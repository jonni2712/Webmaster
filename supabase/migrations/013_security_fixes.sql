-- ============================================
-- Migration 013: Security Fixes
-- Fixes Supabase Linter warnings:
-- 1. Security Definer View (site_status_summary)
-- 2. Function Search Path Mutable (11 functions)
-- 3. RLS Policy Always True (vercel_deployments)
-- ============================================

-- ============================================
-- FIX 1: Security Definer View
-- Recreate site_status_summary with security_invoker = true
-- This ensures the view runs with the permissions of the querying user
-- ============================================

DROP VIEW IF EXISTS site_status_summary;

CREATE VIEW site_status_summary
WITH (security_invoker = true) AS
SELECT
    s.id AS site_id,
    s.tenant_id,
    s.name,
    s.url,
    s.platform,
    s.is_active,
    s.tags,
    s.created_at,

    u.is_up AS current_status,
    u.response_time_ms AS last_response_time,
    u.checked_at AS last_uptime_check,

    calculate_uptime_percentage(s.id, 30) AS uptime_30d,

    ssl.is_valid AS ssl_valid,
    ssl.days_until_expiry AS ssl_days_remaining,

    (SELECT COUNT(*) FROM wp_updates wu WHERE wu.site_id = s.id AND wu.status = 'available') AS wp_updates_pending,
    (SELECT COUNT(*) FROM ps_updates pu WHERE pu.site_id = s.id AND pu.status = 'available') AS ps_updates_pending,

    p.performance_score AS last_perf_score,
    p.lcp_ms AS last_lcp

FROM sites s
LEFT JOIN LATERAL (
    SELECT * FROM uptime_checks
    WHERE site_id = s.id
    ORDER BY checked_at DESC
    LIMIT 1
) u ON true
LEFT JOIN LATERAL (
    SELECT * FROM ssl_checks
    WHERE site_id = s.id
    ORDER BY checked_at DESC
    LIMIT 1
) ssl ON true
LEFT JOIN LATERAL (
    SELECT * FROM performance_checks
    WHERE site_id = s.id
    ORDER BY checked_at DESC
    LIMIT 1
) p ON true;

-- ============================================
-- FIX 2: Function Search Path Mutable
-- Add SET search_path = '' to all functions for security
-- ============================================

-- 2a. update_updated_at (trigger function)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- 2b. calculate_uptime_percentage
CREATE OR REPLACE FUNCTION calculate_uptime_percentage(
    p_site_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS DECIMAL AS $$
DECLARE
    total_checks INTEGER;
    up_checks INTEGER;
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE is_up = true)
    INTO total_checks, up_checks
    FROM public.uptime_checks
    WHERE site_id = p_site_id
      AND checked_at >= NOW() - (p_days || ' days')::INTERVAL;

    IF total_checks = 0 THEN
        RETURN NULL;
    END IF;

    RETURN ROUND((up_checks::DECIMAL / total_checks) * 100, 2);
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- 2c. update_clients_updated_at (trigger function)
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- 2d. can_access_site
CREATE OR REPLACE FUNCTION can_access_site(site_row sites)
RETURNS BOOLEAN AS $$
BEGIN
  -- Direct access through tenant membership
  IF EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid()
    AND ut.tenant_id = site_row.tenant_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Access through parent site (for subsites)
  IF site_row.parent_site_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.sites s
      JOIN public.user_tenants ut ON ut.tenant_id = s.tenant_id
      WHERE s.id = site_row.parent_site_id
      AND ut.user_id = auth.uid()
    );
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- 2e. cleanup_expired_tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM public.auth_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- 2f. current_user_email
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT AS $$
BEGIN
  -- Try Supabase auth first
  IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
    RETURN COALESCE(
      current_setting('request.jwt.claims', true)::json->>'email',
      (current_setting('request.jwt.claims', true)::json->'user_metadata'->>'email')
    );
  END IF;
  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = '';

-- 2g. get_current_tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  user_email TEXT;
  tenant_id UUID;
BEGIN
  user_email := public.current_user_email();

  IF user_email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT u.current_tenant_id INTO tenant_id
  FROM public.users u
  WHERE u.email = user_email;

  RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = '';

-- 2h. user_belongs_to_tenant
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  belongs BOOLEAN;
BEGIN
  user_email := public.current_user_email();

  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.user_tenants ut ON u.id = ut.user_id
    WHERE u.email = user_email
      AND ut.tenant_id = check_tenant_id
  ) INTO belongs;

  RETURN COALESCE(belongs, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = '';

-- 2i. user_role_in_tenant
CREATE OR REPLACE FUNCTION public.user_role_in_tenant(check_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
  user_role TEXT;
BEGIN
  user_email := public.current_user_email();

  IF user_email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT ut.role INTO user_role
  FROM public.users u
  JOIN public.user_tenants ut ON u.id = ut.user_id
  WHERE u.email = user_email
    AND ut.tenant_id = check_tenant_id;

  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = '';

-- 2j. user_is_admin_in_tenant
CREATE OR REPLACE FUNCTION public.user_is_admin_in_tenant(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  role TEXT;
BEGIN
  role := public.user_role_in_tenant(check_tenant_id);
  RETURN role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = '';

-- 2k. user_is_owner_in_tenant
CREATE OR REPLACE FUNCTION public.user_is_owner_in_tenant(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  role TEXT;
BEGIN
  role := public.user_role_in_tenant(check_tenant_id);
  RETURN role = 'owner';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = '';

-- ============================================
-- FIX 3: RLS Policy Always True
-- Fix vercel_deployments policy to properly restrict to service role
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage deployments" ON vercel_deployments;

-- Create a proper service role policy
-- The service role bypasses RLS by default, so this policy is for
-- authenticated users who are admins/owners
CREATE POLICY "Admins can manage deployments in their tenant"
    ON vercel_deployments FOR ALL
    USING (
        tenant_id IN (
            SELECT ut.tenant_id
            FROM user_tenants ut
            WHERE ut.user_id = auth.uid()
            AND ut.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT ut.tenant_id
            FROM user_tenants ut
            WHERE ut.user_id = auth.uid()
            AND ut.role IN ('owner', 'admin')
        )
    );

-- ============================================
-- NOTES:
-- - The service_role in Supabase bypasses RLS by default,
--   so we don't need a specific policy for it.
-- - All functions now have SET search_path = '' which prevents
--   search path manipulation attacks.
-- - Table references inside functions use explicit public. prefix
--   to ensure correct schema resolution.
-- - The view now uses security_invoker = true to run with
--   the querying user's permissions.
-- ============================================

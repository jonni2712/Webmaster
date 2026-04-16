-- ============================================
-- Supabase Security Advisor fixes
-- ============================================
-- Resolves 7 warnings from Supabase database linter:
--   - 4× function_search_path_mutable (prevent search_path injection)
--   - 3× rls_policy_always_true (replace permissive ALL policies with
--     tenant-scoped policies)

-- ============================================
-- Part 1: Lock down function search_path
-- ============================================
-- Setting `search_path = public, pg_catalog` explicitly prevents an
-- attacker who can create objects in another schema from hijacking
-- function calls that use unqualified names.

ALTER FUNCTION public.cleanup_expired_invitations()
    SET search_path = public, pg_catalog;

ALTER FUNCTION public.cleanup_old_rows_by_sites(text, text, uuid[], timestamptz, int)
    SET search_path = public, pg_catalog;

ALTER FUNCTION public.cleanup_old_activity_logs(uuid, timestamptz, int)
    SET search_path = public, pg_catalog;

ALTER FUNCTION public.cleanup_old_resolved_alerts(uuid, timestamptz, int)
    SET search_path = public, pg_catalog;

-- Also lock down the existing helper (pre-existing in the schema).
ALTER FUNCTION public.user_belongs_to_tenant(uuid)
    SET search_path = public, pg_catalog;

-- ============================================
-- Part 2: Replace overly permissive RLS policies
-- ============================================
-- The existing "Allow all operations" policies use USING (true) / WITH
-- CHECK (true) which effectively disables RLS. Replace with tenant-
-- scoped policies that restrict access to rows where the user belongs
-- to the same tenant via user_tenants.

-- The helper function user_belongs_to_tenant(uuid) already exists in the
-- schema from earlier migrations and is used by many RLS policies across
-- the codebase. We only lock its search_path (handled in Part 1 above);
-- the function body stays unchanged. Policies below call it positionally
-- so the internal parameter name does not matter.

-- ── activity_logs ──────────────────────────────────────────────────
-- Users can read/write activity logs for tenants they belong to.
-- Service role bypasses RLS automatically.

DROP POLICY IF EXISTS "Allow all operations on activity_logs" ON public.activity_logs;

CREATE POLICY "Users can read activity_logs for their tenants"
    ON public.activity_logs
    FOR SELECT
    TO authenticated
    USING (public.user_belongs_to_tenant(tenant_id));

CREATE POLICY "Users can insert activity_logs for their tenants"
    ON public.activity_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (public.user_belongs_to_tenant(tenant_id));

-- UPDATE/DELETE on activity_logs is not expected from clients (write-once
-- audit trail). Only service role can modify, which bypasses RLS.

-- ── member_site_access ─────────────────────────────────────────────
-- Users can manage site access entries only for tenants they belong to.

DROP POLICY IF EXISTS "Allow all operations on member_site_access" ON public.member_site_access;

CREATE POLICY "Users can read member_site_access for their tenants"
    ON public.member_site_access
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sites s
            WHERE s.id = member_site_access.site_id
              AND public.user_belongs_to_tenant(s.tenant_id)
        )
    );

CREATE POLICY "Users can insert member_site_access for their tenants"
    ON public.member_site_access
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sites s
            WHERE s.id = member_site_access.site_id
              AND public.user_belongs_to_tenant(s.tenant_id)
        )
    );

CREATE POLICY "Users can delete member_site_access for their tenants"
    ON public.member_site_access
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sites s
            WHERE s.id = member_site_access.site_id
              AND public.user_belongs_to_tenant(s.tenant_id)
        )
    );

-- ── team_invitations ───────────────────────────────────────────────
-- Two access patterns:
-- 1. Tenant members manage invitations for their tenant
-- 2. The invitee (by token) can SELECT their own invitation to accept it
--    — but the accept-invite flow uses the service role, so we don't
--    need a public policy for this. Service role bypasses RLS.

DROP POLICY IF EXISTS "Allow all operations on team_invitations" ON public.team_invitations;

CREATE POLICY "Users can read team_invitations for their tenants"
    ON public.team_invitations
    FOR SELECT
    TO authenticated
    USING (public.user_belongs_to_tenant(tenant_id));

CREATE POLICY "Users can insert team_invitations for their tenants"
    ON public.team_invitations
    FOR INSERT
    TO authenticated
    WITH CHECK (public.user_belongs_to_tenant(tenant_id));

CREATE POLICY "Users can update team_invitations for their tenants"
    ON public.team_invitations
    FOR UPDATE
    TO authenticated
    USING (public.user_belongs_to_tenant(tenant_id))
    WITH CHECK (public.user_belongs_to_tenant(tenant_id));

CREATE POLICY "Users can delete team_invitations for their tenants"
    ON public.team_invitations
    FOR DELETE
    TO authenticated
    USING (public.user_belongs_to_tenant(tenant_id));

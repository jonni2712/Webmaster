-- ============================================
-- WEBMASTER MONITOR - COMPLETE DATABASE SETUP
-- ============================================
-- Esegui questo script nel SQL Editor di Supabase
-- per configurare completamente il database
-- ============================================

-- ============================================
-- PART 1: AUTH CREDENTIALS TABLES
-- ============================================

-- Tabella per credenziali password
CREATE TABLE IF NOT EXISTS auth_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_auth_credentials_user_id ON auth_credentials(user_id);

-- Tabella per token verifica email e reset password
CREATE TABLE IF NOT EXISTS auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id_type ON auth_tokens(user_id, type);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at);

-- Funzione per pulizia token scaduti
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM auth_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 2: RLS HELPER FUNCTIONS (in public schema)
-- ============================================

-- Funzione per ottenere l'email utente corrente dal JWT
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Funzione per ottenere il tenant corrente dell'utente
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
  FROM users u
  WHERE u.email = user_email;

  RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Funzione per verificare se l'utente appartiene a un tenant
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
    FROM users u
    JOIN user_tenants ut ON u.id = ut.user_id
    WHERE u.email = user_email
      AND ut.tenant_id = check_tenant_id
  ) INTO belongs;

  RETURN COALESCE(belongs, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Funzione per ottenere il ruolo dell'utente in un tenant
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
  FROM users u
  JOIN user_tenants ut ON u.id = ut.user_id
  WHERE u.email = user_email
    AND ut.tenant_id = check_tenant_id;

  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Funzione per verificare se l'utente ha ruolo admin o superiore
CREATE OR REPLACE FUNCTION public.user_is_admin_in_tenant(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  role TEXT;
BEGIN
  role := public.user_role_in_tenant(check_tenant_id);
  RETURN role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Funzione per verificare se l'utente è owner del tenant
CREATE OR REPLACE FUNCTION public.user_is_owner_in_tenant(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  role TEXT;
BEGIN
  role := public.user_role_in_tenant(check_tenant_id);
  RETURN role = 'owner';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- PART 3: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE uptime_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssl_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wp_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 4: DROP EXISTING POLICIES
-- ============================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============================================
-- PART 5: CREATE RLS POLICIES
-- ============================================

-- === TENANTS ===
CREATE POLICY "tenants_select" ON tenants FOR SELECT
  USING (public.user_belongs_to_tenant(id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "tenants_update" ON tenants FOR UPDATE
  USING (public.user_is_owner_in_tenant(id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "tenants_insert" ON tenants FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "tenants_delete" ON tenants FOR DELETE
  USING ((SELECT auth.role()) = 'service_role');

-- === USERS ===
CREATE POLICY "users_select_own" ON users FOR SELECT
  USING (
    email = public.current_user_email()
    OR (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM user_tenants ut1
      JOIN user_tenants ut2 ON ut1.tenant_id = ut2.tenant_id
      JOIN users u ON u.id = ut1.user_id
      WHERE u.email = public.current_user_email()
        AND ut2.user_id = users.id
    )
  );

CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING (email = public.current_user_email() OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "users_insert" ON users FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "users_delete" ON users FOR DELETE
  USING ((SELECT auth.role()) = 'service_role');

-- === USER_TENANTS ===
CREATE POLICY "user_tenants_select" ON user_tenants FOR SELECT
  USING (public.user_belongs_to_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "user_tenants_insert" ON user_tenants FOR INSERT
  WITH CHECK (public.user_is_admin_in_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "user_tenants_update" ON user_tenants FOR UPDATE
  USING (public.user_is_admin_in_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "user_tenants_delete" ON user_tenants FOR DELETE
  USING (public.user_is_owner_in_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

-- === SITES ===
CREATE POLICY "sites_select" ON sites FOR SELECT
  USING (public.user_belongs_to_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "sites_insert" ON sites FOR INSERT
  WITH CHECK (public.user_is_admin_in_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "sites_update" ON sites FOR UPDATE
  USING (public.user_is_admin_in_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "sites_delete" ON sites FOR DELETE
  USING (public.user_is_owner_in_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

-- === UPTIME_CHECKS ===
CREATE POLICY "uptime_checks_select" ON uptime_checks FOR SELECT
  USING (
    (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = uptime_checks.site_id
        AND public.user_belongs_to_tenant(s.tenant_id)
    )
  );

CREATE POLICY "uptime_checks_insert" ON uptime_checks FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "uptime_checks_update" ON uptime_checks FOR UPDATE
  USING ((SELECT auth.role()) = 'service_role');

CREATE POLICY "uptime_checks_delete" ON uptime_checks FOR DELETE
  USING ((SELECT auth.role()) = 'service_role');

-- === SSL_CHECKS ===
CREATE POLICY "ssl_checks_select" ON ssl_checks FOR SELECT
  USING (
    (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = ssl_checks.site_id
        AND public.user_belongs_to_tenant(s.tenant_id)
    )
  );

CREATE POLICY "ssl_checks_all" ON ssl_checks FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- === PERFORMANCE_CHECKS ===
CREATE POLICY "performance_checks_select" ON performance_checks FOR SELECT
  USING (
    (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = performance_checks.site_id
        AND public.user_belongs_to_tenant(s.tenant_id)
    )
  );

CREATE POLICY "performance_checks_all" ON performance_checks FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- === WP_UPDATES ===
CREATE POLICY "wp_updates_select" ON wp_updates FOR SELECT
  USING (
    (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = wp_updates.site_id
        AND public.user_belongs_to_tenant(s.tenant_id)
    )
  );

CREATE POLICY "wp_updates_modify" ON wp_updates FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- === PS_UPDATES ===
CREATE POLICY "ps_updates_select" ON ps_updates FOR SELECT
  USING (
    (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = ps_updates.site_id
        AND public.user_belongs_to_tenant(s.tenant_id)
    )
  );

CREATE POLICY "ps_updates_modify" ON ps_updates FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- === ECOMMERCE_TRANSACTIONS ===
CREATE POLICY "ecommerce_select" ON ecommerce_transactions FOR SELECT
  USING (
    (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = ecommerce_transactions.site_id
        AND public.user_belongs_to_tenant(s.tenant_id)
    )
  );

CREATE POLICY "ecommerce_modify" ON ecommerce_transactions FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- === ALERT_CHANNELS ===
CREATE POLICY "alert_channels_select" ON alert_channels FOR SELECT
  USING (public.user_belongs_to_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "alert_channels_insert" ON alert_channels FOR INSERT
  WITH CHECK (public.user_is_admin_in_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "alert_channels_update" ON alert_channels FOR UPDATE
  USING (public.user_is_admin_in_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "alert_channels_delete" ON alert_channels FOR DELETE
  USING (public.user_is_admin_in_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

-- === ALERT_RULES ===
CREATE POLICY "alert_rules_select" ON alert_rules FOR SELECT
  USING (public.user_belongs_to_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "alert_rules_insert" ON alert_rules FOR INSERT
  WITH CHECK (public.user_is_admin_in_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "alert_rules_update" ON alert_rules FOR UPDATE
  USING (public.user_is_admin_in_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "alert_rules_delete" ON alert_rules FOR DELETE
  USING (public.user_is_admin_in_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

-- === ALERTS ===
CREATE POLICY "alerts_select" ON alerts FOR SELECT
  USING (public.user_belongs_to_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "alerts_insert" ON alerts FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "alerts_update" ON alerts FOR UPDATE
  USING (public.user_belongs_to_tenant(tenant_id) OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "alerts_delete" ON alerts FOR DELETE
  USING ((SELECT auth.role()) = 'service_role');

-- === AUTH_CREDENTIALS (solo service role) ===
CREATE POLICY "auth_credentials_all" ON auth_credentials FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- === AUTH_TOKENS (solo service role) ===
CREATE POLICY "auth_tokens_all" ON auth_tokens FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- ============================================
-- PART 6: PERFORMANCE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_tenant ON user_tenants(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_sites_tenant_id ON sites(tenant_id);

-- ============================================
-- SETUP COMPLETE!
-- ============================================

SELECT 'Database setup complete! RLS policies are now active.' AS status;

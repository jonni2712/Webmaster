-- ============================================
-- PRODUCTION RLS POLICIES
-- Politiche di sicurezza complete per multi-tenant
-- ============================================

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Funzione per ottenere l'ID utente corrente dalla sessione JWT
CREATE OR REPLACE FUNCTION auth.current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Funzione per ottenere l'email utente corrente
CREATE OR REPLACE FUNCTION auth.current_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'email';
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Funzione per ottenere il tenant corrente dell'utente
CREATE OR REPLACE FUNCTION auth.current_tenant_id()
RETURNS UUID AS $$
DECLARE
  user_email TEXT;
  tenant_id UUID;
BEGIN
  user_email := auth.current_user_email();

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
CREATE OR REPLACE FUNCTION auth.user_belongs_to_tenant(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  belongs BOOLEAN;
BEGIN
  user_email := auth.current_user_email();

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
CREATE OR REPLACE FUNCTION auth.user_role_in_tenant(check_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
  user_role TEXT;
BEGIN
  user_email := auth.current_user_email();

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
CREATE OR REPLACE FUNCTION auth.user_is_admin_in_tenant(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  role TEXT;
BEGIN
  role := auth.user_role_in_tenant(check_tenant_id);
  RETURN role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Funzione per verificare se l'utente è owner del tenant
CREATE OR REPLACE FUNCTION auth.user_is_owner_in_tenant(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  role TEXT;
BEGIN
  role := auth.user_role_in_tenant(check_tenant_id);
  RETURN role = 'owner';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- ENABLE RLS ON ALL TABLES
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

-- ============================================
-- DROP EXISTING POLICIES (if any)
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
-- TENANTS POLICIES
-- ============================================

-- Utenti possono vedere solo i tenant a cui appartengono
CREATE POLICY "Users can view their tenants"
  ON tenants FOR SELECT
  USING (auth.user_belongs_to_tenant(id));

-- Solo owner può modificare il tenant
CREATE POLICY "Owners can update their tenant"
  ON tenants FOR UPDATE
  USING (auth.user_is_owner_in_tenant(id))
  WITH CHECK (auth.user_is_owner_in_tenant(id));

-- Service role ha accesso completo
CREATE POLICY "Service role full access to tenants"
  ON tenants FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- USERS POLICIES
-- ============================================

-- Utenti possono vedere se stessi
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (email = auth.current_user_email());

-- Utenti possono vedere altri utenti dello stesso tenant
CREATE POLICY "Users can view tenant members"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_tenants ut1
      JOIN user_tenants ut2 ON ut1.tenant_id = ut2.tenant_id
      JOIN users u ON u.id = ut1.user_id
      WHERE u.email = auth.current_user_email()
        AND ut2.user_id = users.id
    )
  );

-- Utenti possono aggiornare solo il proprio profilo
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (email = auth.current_user_email())
  WITH CHECK (email = auth.current_user_email());

-- Service role ha accesso completo
CREATE POLICY "Service role full access to users"
  ON users FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- USER_TENANTS POLICIES
-- ============================================

-- Utenti possono vedere le membership dei loro tenant
CREATE POLICY "Users can view tenant memberships"
  ON user_tenants FOR SELECT
  USING (auth.user_belongs_to_tenant(tenant_id));

-- Solo admin/owner possono aggiungere membri
CREATE POLICY "Admins can insert tenant members"
  ON user_tenants FOR INSERT
  WITH CHECK (auth.user_is_admin_in_tenant(tenant_id));

-- Solo admin/owner possono modificare ruoli (ma non possono promuoversi a owner)
CREATE POLICY "Admins can update tenant members"
  ON user_tenants FOR UPDATE
  USING (auth.user_is_admin_in_tenant(tenant_id))
  WITH CHECK (
    auth.user_is_admin_in_tenant(tenant_id)
    AND (role != 'owner' OR auth.user_is_owner_in_tenant(tenant_id))
  );

-- Solo owner può rimuovere membri
CREATE POLICY "Owners can delete tenant members"
  ON user_tenants FOR DELETE
  USING (auth.user_is_owner_in_tenant(tenant_id));

-- Service role ha accesso completo
CREATE POLICY "Service role full access to user_tenants"
  ON user_tenants FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- SITES POLICIES
-- ============================================

-- Utenti possono vedere i siti del loro tenant
CREATE POLICY "Users can view tenant sites"
  ON sites FOR SELECT
  USING (auth.user_belongs_to_tenant(tenant_id));

-- Admin/owner possono creare siti
CREATE POLICY "Admins can insert sites"
  ON sites FOR INSERT
  WITH CHECK (auth.user_is_admin_in_tenant(tenant_id));

-- Admin/owner possono modificare siti
CREATE POLICY "Admins can update sites"
  ON sites FOR UPDATE
  USING (auth.user_is_admin_in_tenant(tenant_id))
  WITH CHECK (auth.user_is_admin_in_tenant(tenant_id));

-- Solo owner può eliminare siti
CREATE POLICY "Owners can delete sites"
  ON sites FOR DELETE
  USING (auth.user_is_owner_in_tenant(tenant_id));

-- Service role ha accesso completo (per cron jobs)
CREATE POLICY "Service role full access to sites"
  ON sites FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- UPTIME_CHECKS POLICIES
-- ============================================

-- Utenti possono vedere i check dei siti del loro tenant
CREATE POLICY "Users can view tenant uptime checks"
  ON uptime_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = uptime_checks.site_id
        AND auth.user_belongs_to_tenant(s.tenant_id)
    )
  );

-- Solo service role può inserire check (cron jobs)
CREATE POLICY "Service role can insert uptime checks"
  ON uptime_checks FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Service role ha accesso completo
CREATE POLICY "Service role full access to uptime_checks"
  ON uptime_checks FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- SSL_CHECKS POLICIES
-- ============================================

CREATE POLICY "Users can view tenant ssl checks"
  ON ssl_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = ssl_checks.site_id
        AND auth.user_belongs_to_tenant(s.tenant_id)
    )
  );

CREATE POLICY "Service role full access to ssl_checks"
  ON ssl_checks FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- PERFORMANCE_CHECKS POLICIES
-- ============================================

CREATE POLICY "Users can view tenant performance checks"
  ON performance_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = performance_checks.site_id
        AND auth.user_belongs_to_tenant(s.tenant_id)
    )
  );

CREATE POLICY "Service role full access to performance_checks"
  ON performance_checks FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- WP_UPDATES POLICIES
-- ============================================

CREATE POLICY "Users can view tenant wp updates"
  ON wp_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = wp_updates.site_id
        AND auth.user_belongs_to_tenant(s.tenant_id)
    )
  );

-- Admin può aggiornare lo stato degli update
CREATE POLICY "Admins can update wp updates status"
  ON wp_updates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = wp_updates.site_id
        AND auth.user_is_admin_in_tenant(s.tenant_id)
    )
  );

CREATE POLICY "Service role full access to wp_updates"
  ON wp_updates FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- PS_UPDATES POLICIES
-- ============================================

CREATE POLICY "Users can view tenant ps updates"
  ON ps_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = ps_updates.site_id
        AND auth.user_belongs_to_tenant(s.tenant_id)
    )
  );

CREATE POLICY "Admins can update ps updates status"
  ON ps_updates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = ps_updates.site_id
        AND auth.user_is_admin_in_tenant(s.tenant_id)
    )
  );

CREATE POLICY "Service role full access to ps_updates"
  ON ps_updates FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- ECOMMERCE_TRANSACTIONS POLICIES
-- ============================================

CREATE POLICY "Users can view tenant ecommerce transactions"
  ON ecommerce_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = ecommerce_transactions.site_id
        AND auth.user_belongs_to_tenant(s.tenant_id)
    )
  );

CREATE POLICY "Service role full access to ecommerce_transactions"
  ON ecommerce_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- ALERT_CHANNELS POLICIES
-- ============================================

CREATE POLICY "Users can view tenant alert channels"
  ON alert_channels FOR SELECT
  USING (auth.user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can insert alert channels"
  ON alert_channels FOR INSERT
  WITH CHECK (auth.user_is_admin_in_tenant(tenant_id));

CREATE POLICY "Admins can update alert channels"
  ON alert_channels FOR UPDATE
  USING (auth.user_is_admin_in_tenant(tenant_id))
  WITH CHECK (auth.user_is_admin_in_tenant(tenant_id));

CREATE POLICY "Admins can delete alert channels"
  ON alert_channels FOR DELETE
  USING (auth.user_is_admin_in_tenant(tenant_id));

CREATE POLICY "Service role full access to alert_channels"
  ON alert_channels FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- ALERT_RULES POLICIES
-- ============================================

CREATE POLICY "Users can view tenant alert rules"
  ON alert_rules FOR SELECT
  USING (auth.user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can insert alert rules"
  ON alert_rules FOR INSERT
  WITH CHECK (auth.user_is_admin_in_tenant(tenant_id));

CREATE POLICY "Admins can update alert rules"
  ON alert_rules FOR UPDATE
  USING (auth.user_is_admin_in_tenant(tenant_id))
  WITH CHECK (auth.user_is_admin_in_tenant(tenant_id));

CREATE POLICY "Admins can delete alert rules"
  ON alert_rules FOR DELETE
  USING (auth.user_is_admin_in_tenant(tenant_id));

CREATE POLICY "Service role full access to alert_rules"
  ON alert_rules FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- ALERTS POLICIES
-- ============================================

CREATE POLICY "Users can view tenant alerts"
  ON alerts FOR SELECT
  USING (auth.user_belongs_to_tenant(tenant_id));

-- Qualsiasi membro può acknowledgiare un alert
CREATE POLICY "Members can acknowledge alerts"
  ON alerts FOR UPDATE
  USING (auth.user_belongs_to_tenant(tenant_id))
  WITH CHECK (auth.user_belongs_to_tenant(tenant_id));

CREATE POLICY "Service role full access to alerts"
  ON alerts FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- AUTH_CREDENTIALS POLICIES (già creata, ma assicuriamoci)
-- ============================================

-- Le credenziali auth sono accessibili solo dal service role
-- Policy già create in 00003_auth_credentials.sql

-- ============================================
-- AUTH_TOKENS POLICIES (già creata, ma assicuriamoci)
-- ============================================

-- I token auth sono accessibili solo dal service role
-- Policy già create in 00003_auth_credentials.sql

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Concedi permessi alle funzioni auth
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.current_user_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.current_user_email() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.current_tenant_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.user_belongs_to_tenant(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.user_role_in_tenant(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.user_is_admin_in_tenant(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.user_is_owner_in_tenant(UUID) TO anon, authenticated;

-- ============================================
-- INDEXES FOR RLS PERFORMANCE
-- ============================================

-- Indici per migliorare le performance delle query RLS
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_tenant ON user_tenants(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_sites_tenant_id ON sites(tenant_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION auth.current_user_id() IS 'Restituisce l''ID dell''utente corrente dalla sessione JWT';
COMMENT ON FUNCTION auth.current_user_email() IS 'Restituisce l''email dell''utente corrente dalla sessione JWT';
COMMENT ON FUNCTION auth.current_tenant_id() IS 'Restituisce l''ID del tenant corrente dell''utente';
COMMENT ON FUNCTION auth.user_belongs_to_tenant(UUID) IS 'Verifica se l''utente corrente appartiene al tenant specificato';
COMMENT ON FUNCTION auth.user_role_in_tenant(UUID) IS 'Restituisce il ruolo dell''utente nel tenant specificato';
COMMENT ON FUNCTION auth.user_is_admin_in_tenant(UUID) IS 'Verifica se l''utente è admin o owner nel tenant';
COMMENT ON FUNCTION auth.user_is_owner_in_tenant(UUID) IS 'Verifica se l''utente è owner del tenant';

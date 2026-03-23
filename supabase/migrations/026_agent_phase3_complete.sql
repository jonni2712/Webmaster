-- 026_agent_phase3_complete.sql
-- Phase 3: Email accounts, databases per hosting account

-- ============================================================
-- 1. Email accounts per server account
-- ============================================================
CREATE TABLE IF NOT EXISTS server_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_account_id UUID NOT NULL REFERENCES server_accounts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  quota_mb INTEGER,
  used_mb INTEGER,
  has_forwarder BOOLEAN DEFAULT false,
  forwarder_target TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_account_id, email)
);

-- ============================================================
-- 2. Databases per server account
-- ============================================================
CREATE TABLE IF NOT EXISTS server_databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_account_id UUID NOT NULL REFERENCES server_accounts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  engine TEXT DEFAULT 'mysql',
  size_mb NUMERIC,
  db_users JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_account_id, name)
);

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_server_emails_account ON server_emails(server_account_id);
CREATE INDEX IF NOT EXISTS idx_server_emails_tenant ON server_emails(tenant_id);
CREATE INDEX IF NOT EXISTS idx_server_databases_account ON server_databases(server_account_id);
CREATE INDEX IF NOT EXISTS idx_server_databases_tenant ON server_databases(tenant_id);

-- ============================================================
-- 4. RLS
-- ============================================================
ALTER TABLE server_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_databases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON server_emails
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON server_databases
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

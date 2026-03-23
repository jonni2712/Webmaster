-- 024_cpanel_agent_support.sql
-- Adds cPanel/Plesk agent support: server extensions + sync data tables

-- ============================================================
-- 1. Extend servers table
-- ============================================================
ALTER TABLE servers ADD COLUMN IF NOT EXISTS panel_type TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS agent_token TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS agent_status TEXT DEFAULT 'not_installed';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS agent_version TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS sync_config JSONB DEFAULT '{}';

-- ============================================================
-- 2. Server accounts (cPanel/Plesk accounts)
-- ============================================================
CREATE TABLE IF NOT EXISTS server_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  main_domain TEXT NOT NULL,
  addon_domains JSONB DEFAULT '[]',
  subdomains JSONB DEFAULT '[]',
  parked_domains JSONB DEFAULT '[]',
  document_roots JSONB DEFAULT '{}',
  php_version TEXT,
  disk_used_mb INTEGER,
  disk_limit_mb INTEGER,
  bandwidth_used_mb INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_id, username)
);

-- ============================================================
-- 3. CMS detections per domain
-- ============================================================
CREATE TABLE IF NOT EXISTS server_cms_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_account_id UUID NOT NULL REFERENCES server_accounts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  cms_type TEXT NOT NULL,
  cms_version TEXT,
  document_root TEXT,
  matched_site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_account_id, domain)
);

-- ============================================================
-- 4. DNS zones synced from panel
-- ============================================================
CREATE TABLE IF NOT EXISTS server_dns_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  records JSONB DEFAULT '[]',
  points_to_server BOOLEAN DEFAULT true,
  resolved_ip TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_id, domain)
);

-- ============================================================
-- 5. SSL certificates from panel
-- ============================================================
CREATE TABLE IF NOT EXISTS server_ssl_certs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  issuer TEXT,
  expires_at TIMESTAMPTZ,
  auto_ssl BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'valid',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_id, domain)
);

-- ============================================================
-- 6. Pending site imports
-- ============================================================
CREATE TABLE IF NOT EXISTS pending_site_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  cms_type TEXT,
  cms_version TEXT,
  server_account_username TEXT,
  status TEXT DEFAULT 'pending',
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  actioned_at TIMESTAMPTZ,
  UNIQUE(server_id, domain)
);

-- ============================================================
-- 7. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_server_accounts_server ON server_accounts(server_id);
CREATE INDEX IF NOT EXISTS idx_server_accounts_tenant ON server_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_server_cms_matched ON server_cms_detections(matched_site_id);
CREATE INDEX IF NOT EXISTS idx_server_dns_server ON server_dns_zones(server_id);
CREATE INDEX IF NOT EXISTS idx_server_ssl_server ON server_ssl_certs(server_id);
CREATE INDEX IF NOT EXISTS idx_pending_imports_status ON pending_site_imports(tenant_id, status)
  WHERE status = 'pending';

-- ============================================================
-- 8. RLS Policies
-- ============================================================
ALTER TABLE server_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_cms_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_dns_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_ssl_certs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_site_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON server_accounts
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON server_cms_detections
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON server_dns_zones
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON server_ssl_certs
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON pending_site_imports
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

-- 025_agent_phase2_monitoring.sql
-- Phase 2: Server resource monitoring, error tracking, backup status

-- ============================================================
-- 1. Server resource snapshots (time-series)
-- ============================================================
CREATE TABLE IF NOT EXISTS server_resource_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cpu_cores INTEGER,
  cpu_usage_percent NUMERIC(5,1),
  ram_total_mb INTEGER,
  ram_used_mb INTEGER,
  disk_total_gb INTEGER,
  disk_used_gb INTEGER,
  load_average JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. Server errors (aggregated by domain + type)
-- ============================================================
CREATE TABLE IF NOT EXISTS server_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  server_account_id UUID REFERENCES server_accounts(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT,
  error_type TEXT NOT NULL,
  message TEXT,
  file_path TEXT,
  occurrence_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ
);

-- ============================================================
-- 3. Server backups from panel
-- ============================================================
CREATE TABLE IF NOT EXISTS server_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  server_account_id UUID REFERENCES server_accounts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  username TEXT,
  backup_type TEXT,
  size_mb INTEGER,
  backup_date TIMESTAMPTZ,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_resource_snapshots_server_time
  ON server_resource_snapshots(server_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_resource_snapshots_tenant
  ON server_resource_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_server_errors_unresolved
  ON server_errors(server_id, resolved) WHERE NOT resolved;
CREATE INDEX IF NOT EXISTS idx_server_errors_tenant
  ON server_errors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_server_errors_last_seen
  ON server_errors(server_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_server_backups_server
  ON server_backups(server_id);
CREATE INDEX IF NOT EXISTS idx_server_backups_tenant
  ON server_backups(tenant_id);

-- ============================================================
-- 5. RLS Policies
-- ============================================================
ALTER TABLE server_resource_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON server_resource_snapshots
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON server_errors
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON server_backups
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

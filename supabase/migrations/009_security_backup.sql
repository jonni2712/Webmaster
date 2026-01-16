-- ============================================
-- Migration: 009_security_backup.sql
-- Description: Add security scans and backups tables
-- ============================================

-- ============================================
-- SECURITY SCANS
-- ============================================
CREATE TABLE IF NOT EXISTS security_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Overall Security Score (0-100)
    security_score INTEGER NOT NULL,

    -- SSL Score (0-25)
    ssl_score INTEGER NOT NULL DEFAULT 0,
    ssl_valid BOOLEAN,
    https_forced BOOLEAN,
    hsts_enabled BOOLEAN,

    -- Versions Score (0-25)
    versions_score INTEGER NOT NULL DEFAULT 0,
    wp_updated BOOLEAN,
    plugins_updated BOOLEAN,
    themes_updated BOOLEAN,
    outdated_count INTEGER DEFAULT 0,

    -- Configuration Score (0-25)
    config_score INTEGER NOT NULL DEFAULT 0,
    debug_disabled BOOLEAN,
    file_editor_disabled BOOLEAN,
    directory_listing_disabled BOOLEAN,
    default_prefix BOOLEAN,

    -- Security Plugin Score (0-25)
    security_plugin_score INTEGER NOT NULL DEFAULT 0,
    security_plugin_name VARCHAR(100),
    security_plugin_active BOOLEAN,

    -- File Integrity
    core_files_modified INTEGER DEFAULT 0,
    suspicious_files JSONB DEFAULT '[]',

    -- Recommendations
    recommendations JSONB DEFAULT '[]',

    scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_scans_site ON security_scans(site_id);
CREATE INDEX IF NOT EXISTS idx_security_scans_tenant ON security_scans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_scans_date ON security_scans(scanned_at DESC);

-- ============================================
-- SITE BACKUPS
-- ============================================
CREATE TABLE IF NOT EXISTS site_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Backup info
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT,
    backup_type VARCHAR(50) DEFAULT 'full' CHECK (backup_type IN ('full', 'database', 'files')),

    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'creating', 'completed', 'failed', 'deleted')),
    error_message TEXT,

    -- Metadata
    includes_database BOOLEAN DEFAULT true,
    includes_files BOOLEAN DEFAULT true,
    includes_uploads BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_site_backups_site ON site_backups(site_id);
CREATE INDEX IF NOT EXISTS idx_site_backups_tenant ON site_backups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_site_backups_status ON site_backups(status);

-- ============================================
-- ADD SECURITY FIELDS TO SITES TABLE
-- ============================================
ALTER TABLE sites ADD COLUMN IF NOT EXISTS security_score INTEGER;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS last_security_scan TIMESTAMPTZ;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS last_backup TIMESTAMPTZ;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS backup_enabled BOOLEAN DEFAULT false;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Security Scans RLS
ALTER TABLE security_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_scans_tenant_isolation" ON security_scans
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    ));

-- Site Backups RLS
ALTER TABLE site_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_backups_tenant_isolation" ON site_backups
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    ));

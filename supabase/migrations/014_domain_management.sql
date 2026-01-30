-- Migration: Domain Management System
-- Version: 014
-- Description: Adds servers table, lifecycle status enum, and domain management columns

-- ============================================
-- 1. Create servers table
-- ============================================
CREATE TABLE IF NOT EXISTS servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(255),
    hostname VARCHAR(500),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for tenant queries
CREATE INDEX IF NOT EXISTS idx_servers_tenant_id ON servers(tenant_id);

-- Unique constraint for server names within a tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_servers_tenant_name ON servers(tenant_id, name);

-- Enable RLS
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for servers
CREATE POLICY "servers_tenant_isolation" ON servers
    FOR ALL
    USING (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    ));

-- Comments for documentation
COMMENT ON TABLE servers IS 'Servers/hosts where sites are deployed';
COMMENT ON COLUMN servers.name IS 'Display name for the server (e.g., Server Vecchio, Server Nuovo)';
COMMENT ON COLUMN servers.provider IS 'Hosting provider (e.g., Aruba, OVH, Hetzner)';
COMMENT ON COLUMN servers.hostname IS 'IP address or hostname for reference';

-- ============================================
-- 2. Create domain lifecycle status enum
-- ============================================
DO $$ BEGIN
    CREATE TYPE domain_lifecycle_status AS ENUM (
        'active',           -- Attivo / In Produzione
        'to_update',        -- Da Aggiornare
        'to_rebuild',       -- Da Rifare / Redesign
        'in_maintenance',   -- In Manutenzione / Sospeso
        'in_progress',      -- In Lavorazione
        'to_delete',        -- Da Cancellare
        'redirect_only',    -- Solo Redirect
        'archived'          -- Archiviato
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE domain_lifecycle_status IS 'Lifecycle status for domain/site management';

-- ============================================
-- 3. Add new columns to sites table
-- ============================================

-- Server reference
ALTER TABLE sites ADD COLUMN IF NOT EXISTS server_id UUID REFERENCES servers(id) ON DELETE SET NULL;

-- Lifecycle status (default to active for existing sites)
ALTER TABLE sites ADD COLUMN IF NOT EXISTS lifecycle_status domain_lifecycle_status DEFAULT 'active';

-- Redirect configuration
ALTER TABLE sites ADD COLUMN IF NOT EXISTS redirect_to_site_id UUID REFERENCES sites(id) ON DELETE SET NULL;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS redirect_type VARCHAR(10);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS is_redirect_source BOOLEAN DEFAULT false;

-- Domain registration info
ALTER TABLE sites ADD COLUMN IF NOT EXISTS domain_expires_at TIMESTAMPTZ;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS domain_registrar VARCHAR(255);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS domain_notes TEXT;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_sites_server_id ON sites(server_id);
CREATE INDEX IF NOT EXISTS idx_sites_lifecycle_status ON sites(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_sites_redirect_to ON sites(redirect_to_site_id) WHERE redirect_to_site_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sites_domain_expires ON sites(domain_expires_at) WHERE domain_expires_at IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN sites.server_id IS 'Reference to the server where this site is hosted';
COMMENT ON COLUMN sites.lifecycle_status IS 'Current lifecycle status of the domain/site';
COMMENT ON COLUMN sites.redirect_to_site_id IS 'Target site if this domain redirects to another';
COMMENT ON COLUMN sites.redirect_type IS 'Type of redirect: 301, 302, 307, 308, meta, js';
COMMENT ON COLUMN sites.is_redirect_source IS 'True if this site serves as a redirect source';
COMMENT ON COLUMN sites.domain_expires_at IS 'Domain registration expiry date';
COMMENT ON COLUMN sites.domain_registrar IS 'Domain registrar name';
COMMENT ON COLUMN sites.domain_notes IS 'Additional notes about domain registration';

-- ============================================
-- 4. Create domain_portfolio_summary view
-- ============================================
CREATE OR REPLACE VIEW domain_portfolio_summary AS
SELECT
    s.tenant_id,
    -- Totals
    COUNT(*) AS total_domains,
    COUNT(*) FILTER (WHERE s.is_active = true) AS active_domains,
    COUNT(*) FILTER (WHERE s.is_active = false) AS inactive_domains,

    -- By lifecycle status
    COUNT(*) FILTER (WHERE s.lifecycle_status = 'active') AS status_active,
    COUNT(*) FILTER (WHERE s.lifecycle_status = 'to_update') AS status_to_update,
    COUNT(*) FILTER (WHERE s.lifecycle_status = 'to_rebuild') AS status_to_rebuild,
    COUNT(*) FILTER (WHERE s.lifecycle_status = 'in_maintenance') AS status_in_maintenance,
    COUNT(*) FILTER (WHERE s.lifecycle_status = 'in_progress') AS status_in_progress,
    COUNT(*) FILTER (WHERE s.lifecycle_status = 'to_delete') AS status_to_delete,
    COUNT(*) FILTER (WHERE s.lifecycle_status = 'redirect_only') AS status_redirect_only,
    COUNT(*) FILTER (WHERE s.lifecycle_status = 'archived') AS status_archived,

    -- Redirects
    COUNT(*) FILTER (WHERE s.is_redirect_source = true) AS redirect_sources,
    COUNT(*) FILTER (WHERE s.redirect_to_site_id IS NOT NULL) AS has_redirect_target,

    -- Domain expiry
    COUNT(*) FILTER (WHERE s.domain_expires_at IS NOT NULL) AS domains_with_expiry,
    COUNT(*) FILTER (WHERE s.domain_expires_at <= NOW() + INTERVAL '30 days' AND s.domain_expires_at > NOW()) AS expiring_30_days,
    COUNT(*) FILTER (WHERE s.domain_expires_at <= NOW() + INTERVAL '7 days' AND s.domain_expires_at > NOW()) AS expiring_7_days,
    COUNT(*) FILTER (WHERE s.domain_expires_at <= NOW()) AS expired,

    -- Server assignment
    COUNT(*) FILTER (WHERE s.server_id IS NOT NULL) AS domains_with_server,
    COUNT(*) FILTER (WHERE s.server_id IS NULL) AS domains_without_server
FROM sites s
WHERE s.parent_site_id IS NULL  -- Exclude subsites from portfolio count
GROUP BY s.tenant_id;

COMMENT ON VIEW domain_portfolio_summary IS 'Aggregated statistics for domain portfolio dashboard';

-- ============================================
-- 5. Create server_stats view
-- ============================================
CREATE OR REPLACE VIEW server_stats AS
SELECT
    srv.id AS server_id,
    srv.tenant_id,
    srv.name AS server_name,
    srv.provider,
    srv.hostname,
    srv.is_active,
    COUNT(s.id) AS sites_count,
    COUNT(s.id) FILTER (WHERE s.lifecycle_status = 'active') AS active_sites,
    COUNT(s.id) FILTER (WHERE s.is_active = true) AS enabled_sites
FROM servers srv
LEFT JOIN sites s ON s.server_id = srv.id AND s.parent_site_id IS NULL
GROUP BY srv.id, srv.tenant_id, srv.name, srv.provider, srv.hostname, srv.is_active;

COMMENT ON VIEW server_stats IS 'Server statistics with site counts';

-- ============================================
-- 6. Create redirect_chains view (recursive)
-- ============================================
CREATE OR REPLACE VIEW redirect_chains AS
WITH RECURSIVE chain AS (
    -- Base case: sites that are redirect sources
    SELECT
        s.id AS source_id,
        s.tenant_id,
        s.name AS source_name,
        s.url AS source_url,
        s.redirect_to_site_id,
        s.redirect_type,
        1 AS chain_depth,
        ARRAY[s.id] AS chain_path,
        false AS is_circular
    FROM sites s
    WHERE s.is_redirect_source = true

    UNION ALL

    -- Recursive case: follow the redirect chain
    SELECT
        c.source_id,
        c.tenant_id,
        c.source_name,
        c.source_url,
        s.redirect_to_site_id,
        s.redirect_type,
        c.chain_depth + 1,
        c.chain_path || s.id,
        s.id = ANY(c.chain_path) AS is_circular
    FROM chain c
    JOIN sites s ON s.id = c.redirect_to_site_id
    WHERE c.chain_depth < 10  -- Prevent infinite recursion
        AND NOT c.is_circular
        AND s.redirect_to_site_id IS NOT NULL
)
SELECT
    c.source_id,
    c.tenant_id,
    c.source_name,
    c.source_url,
    t.id AS target_id,
    t.name AS target_name,
    t.url AS target_url,
    c.chain_depth,
    c.chain_path,
    c.is_circular,
    c.redirect_type
FROM chain c
JOIN sites t ON t.id = c.redirect_to_site_id
WHERE c.redirect_to_site_id IS NOT NULL;

COMMENT ON VIEW redirect_chains IS 'Recursive view showing redirect chains between sites';

-- ============================================
-- 7. Create expiring_domains view
-- ============================================
CREATE OR REPLACE VIEW expiring_domains AS
SELECT
    s.id AS site_id,
    s.tenant_id,
    s.name,
    s.url,
    s.domain_expires_at,
    s.domain_registrar,
    s.lifecycle_status,
    CASE
        WHEN s.domain_expires_at <= NOW() THEN 'expired'
        WHEN s.domain_expires_at <= NOW() + INTERVAL '7 days' THEN 'critical'
        WHEN s.domain_expires_at <= NOW() + INTERVAL '30 days' THEN 'warning'
        ELSE 'ok'
    END AS expiry_status,
    EXTRACT(DAY FROM (s.domain_expires_at - NOW()))::INTEGER AS days_until_expiry
FROM sites s
WHERE s.domain_expires_at IS NOT NULL
    AND s.domain_expires_at <= NOW() + INTERVAL '90 days'
    AND s.parent_site_id IS NULL
ORDER BY s.domain_expires_at ASC;

COMMENT ON VIEW expiring_domains IS 'Sites with domains expiring within 90 days';

-- ============================================
-- 8. Trigger for servers updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_servers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS servers_updated_at_trigger ON servers;
CREATE TRIGGER servers_updated_at_trigger
    BEFORE UPDATE ON servers
    FOR EACH ROW
    EXECUTE FUNCTION update_servers_updated_at();

-- ============================================
-- 9. Add constraint to prevent circular redirects
-- ============================================
ALTER TABLE sites DROP CONSTRAINT IF EXISTS check_no_self_redirect;
ALTER TABLE sites ADD CONSTRAINT check_no_self_redirect
    CHECK (redirect_to_site_id IS NULL OR redirect_to_site_id != id);

-- ============================================
-- 10. Activity types for domain management
-- ============================================
-- Note: If activity_action_type is an enum, you may need to add new values
-- This is handled in application code for flexibility

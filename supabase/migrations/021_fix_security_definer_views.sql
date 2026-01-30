-- Migration 021: Fix Security Definer Views
-- Cambia le view per usare SECURITY INVOKER invece di SECURITY DEFINER
-- Questo rispetta le policy RLS dell'utente che esegue la query

-- ============================================
-- Fix domain_portfolio_summary view
-- ============================================
DROP VIEW IF EXISTS domain_portfolio_summary;

CREATE VIEW domain_portfolio_summary
WITH (security_invoker = on) AS
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
WHERE s.parent_site_id IS NULL
GROUP BY s.tenant_id;

COMMENT ON VIEW domain_portfolio_summary IS 'Aggregated statistics for domain portfolio dashboard (security invoker)';

-- ============================================
-- Fix server_stats view
-- ============================================
DROP VIEW IF EXISTS server_stats;

CREATE VIEW server_stats
WITH (security_invoker = on) AS
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

COMMENT ON VIEW server_stats IS 'Server statistics with site counts (security invoker)';

-- ============================================
-- Fix redirect_chains view
-- ============================================
DROP VIEW IF EXISTS redirect_chains;

CREATE VIEW redirect_chains
WITH (security_invoker = on) AS
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
    WHERE c.chain_depth < 10
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

COMMENT ON VIEW redirect_chains IS 'Recursive view showing redirect chains between sites (security invoker)';

-- ============================================
-- Fix expiring_domains view
-- ============================================
DROP VIEW IF EXISTS expiring_domains;

CREATE VIEW expiring_domains
WITH (security_invoker = on) AS
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

COMMENT ON VIEW expiring_domains IS 'Sites with domains expiring within 90 days (security invoker)';

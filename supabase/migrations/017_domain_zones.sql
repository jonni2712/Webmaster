-- Migration 017: Domain Zones
-- Allows grouping related domains together (main domain + redirects/aliases)

-- Add primary_domain_id to link secondary domains to their main domain
ALTER TABLE sites ADD COLUMN IF NOT EXISTS primary_domain_id UUID REFERENCES sites(id) ON DELETE SET NULL;

-- Add zone_name for custom naming of domain groups
ALTER TABLE sites ADD COLUMN IF NOT EXISTS zone_name VARCHAR(255);

-- Index for efficient zone queries
CREATE INDEX IF NOT EXISTS idx_sites_primary_domain ON sites(primary_domain_id) WHERE primary_domain_id IS NOT NULL;

COMMENT ON COLUMN sites.primary_domain_id IS 'Links this domain to its primary/main domain in a zone';
COMMENT ON COLUMN sites.zone_name IS 'Custom name for the domain zone (only on primary domain)';

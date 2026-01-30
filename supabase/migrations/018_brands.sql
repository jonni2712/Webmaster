-- Migration 018: Brands for domain grouping
-- Create brands first, then assign domains to them

CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    primary_domain_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for tenant queries
CREATE INDEX IF NOT EXISTS idx_brands_tenant_id ON brands(tenant_id);

-- Unique brand names within tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_tenant_name ON brands(tenant_id, name);

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "brands_tenant_isolation" ON brands
    FOR ALL
    USING (tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    ));

-- Add brand_id to sites
ALTER TABLE sites ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;

-- Index for brand queries
CREATE INDEX IF NOT EXISTS idx_sites_brand_id ON sites(brand_id) WHERE brand_id IS NOT NULL;

-- Add is_primary_for_brand flag
ALTER TABLE sites ADD COLUMN IF NOT EXISTS is_primary_for_brand BOOLEAN DEFAULT false;

COMMENT ON TABLE brands IS 'Brands/projects that group related domains together';
COMMENT ON COLUMN brands.primary_domain_id IS 'The main domain for this brand';
COMMENT ON COLUMN sites.brand_id IS 'The brand this domain belongs to';
COMMENT ON COLUMN sites.is_primary_for_brand IS 'Whether this is the primary domain for its brand';

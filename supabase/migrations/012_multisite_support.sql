-- Migration: Add WordPress Multisite Support
-- Version: 012
-- Description: Adds columns to support WordPress Multisite networks and subsites

-- Add multisite columns to sites table
ALTER TABLE sites ADD COLUMN IF NOT EXISTS parent_site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS is_multisite BOOLEAN DEFAULT FALSE;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS is_main_site BOOLEAN DEFAULT FALSE;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS multisite_blog_id INTEGER;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS multisite_path VARCHAR(255);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS auto_discovered BOOLEAN DEFAULT FALSE;

-- Create index for parent_site_id lookups
CREATE INDEX IF NOT EXISTS idx_sites_parent_site_id ON sites(parent_site_id);

-- Create index for multisite filtering
CREATE INDEX IF NOT EXISTS idx_sites_is_multisite ON sites(is_multisite) WHERE is_multisite = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN sites.parent_site_id IS 'Reference to parent site for multisite subsites';
COMMENT ON COLUMN sites.is_multisite IS 'True if this site is a WordPress Multisite network';
COMMENT ON COLUMN sites.is_main_site IS 'True if this is the main site of a multisite network';
COMMENT ON COLUMN sites.multisite_blog_id IS 'WordPress blog_id for subsites in a multisite network';
COMMENT ON COLUMN sites.multisite_path IS 'Path or domain for the subsite in multisite network';
COMMENT ON COLUMN sites.auto_discovered IS 'True if the site was automatically discovered during sync';

-- Update RLS policies to include subsites access based on parent
-- Users who can access the parent site can also access its subsites
CREATE OR REPLACE FUNCTION can_access_site(site_row sites)
RETURNS BOOLEAN AS $$
BEGIN
  -- Direct access through tenant membership
  IF EXISTS (
    SELECT 1 FROM user_tenants ut
    WHERE ut.user_id = auth.uid()
    AND ut.tenant_id = site_row.tenant_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Access through parent site (for subsites)
  IF site_row.parent_site_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM sites s
      JOIN user_tenants ut ON ut.tenant_id = s.tenant_id
      WHERE s.id = site_row.parent_site_id
      AND ut.user_id = auth.uid()
    );
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration 016: Add redirect_url column to sites table
-- This allows storing a direct URL for redirects instead of only referencing another site

ALTER TABLE sites ADD COLUMN IF NOT EXISTS redirect_url TEXT;

COMMENT ON COLUMN sites.redirect_url IS 'Direct URL where this domain redirects to (alternative to redirect_to_site_id)';

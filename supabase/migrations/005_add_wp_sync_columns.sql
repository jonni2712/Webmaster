-- Migration: Add columns for WordPress plugin sync data
-- Run this in Supabase SQL Editor

-- Add new columns to sites table for storing WordPress plugin data
ALTER TABLE sites ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS wp_version VARCHAR(20);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS php_version VARCHAR(20);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS plugin_version VARCHAR(20);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS server_info JSONB DEFAULT '{}';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS wp_info JSONB DEFAULT '{}';

-- Create index for faster queries on sync status
CREATE INDEX IF NOT EXISTS idx_sites_last_sync ON sites(last_sync);

-- Comment on columns
COMMENT ON COLUMN sites.last_sync IS 'Last time data was synced from WordPress plugin';
COMMENT ON COLUMN sites.wp_version IS 'WordPress version from plugin';
COMMENT ON COLUMN sites.php_version IS 'PHP version from server';
COMMENT ON COLUMN sites.plugin_version IS 'Webmaster Monitor plugin version';
COMMENT ON COLUMN sites.server_info IS 'Server info JSON (PHP, database, disk, etc.)';
COMMENT ON COLUMN sites.wp_info IS 'WordPress info JSON (core, plugins, themes, etc.)';

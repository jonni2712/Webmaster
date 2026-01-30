-- Migration 015: Add alert_settings column to sites table
-- This column stores per-site alert configuration as JSONB

-- Add alert_settings column
ALTER TABLE sites ADD COLUMN IF NOT EXISTS alert_settings JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN sites.alert_settings IS 'Per-site alert configuration: alerts_enabled, ssl_warning_days, ssl_critical_days, uptime_cooldown_minutes, ssl_cooldown_minutes, notify_on_recovery';

-- Create index for queries on alert_settings
CREATE INDEX IF NOT EXISTS idx_sites_alert_settings ON sites USING gin(alert_settings) WHERE alert_settings IS NOT NULL;

-- Migration: Add status columns to sites table
-- These columns store the current status for quick access without querying check tables

-- Site status (online, offline, degraded, unknown)
ALTER TABLE sites ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'unknown';

-- Uptime data
ALTER TABLE sites ADD COLUMN IF NOT EXISTS uptime_percentage DECIMAL(5,2);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS response_time_avg INTEGER;

-- SSL data
ALTER TABLE sites ADD COLUMN IF NOT EXISTS ssl_status VARCHAR(20);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS ssl_expires_at TIMESTAMPTZ;

-- Last check timestamp
ALTER TABLE sites ADD COLUMN IF NOT EXISTS last_check TIMESTAMPTZ;

-- Performance score
ALTER TABLE sites ADD COLUMN IF NOT EXISTS performance_score INTEGER;

-- Add comments
COMMENT ON COLUMN sites.status IS 'Current site status: online, offline, degraded, unknown';
COMMENT ON COLUMN sites.uptime_percentage IS 'Uptime percentage over last 30 days';
COMMENT ON COLUMN sites.response_time_avg IS 'Average response time in ms';
COMMENT ON COLUMN sites.ssl_status IS 'SSL status: valid, expiring, expired, invalid';
COMMENT ON COLUMN sites.ssl_expires_at IS 'SSL certificate expiry date';
COMMENT ON COLUMN sites.last_check IS 'Last uptime/status check timestamp';
COMMENT ON COLUMN sites.performance_score IS 'Latest performance score (0-100)';

-- ============================================
-- Rate limiting attempts log
-- ============================================
-- Fixed-window rate limiter backed by a single append-only table.
-- Each row = one request. Checks use COUNT(*) with a time window.
-- Cleanup via periodic DELETE of rows older than 24 hours.

CREATE TABLE IF NOT EXISTS rate_limit_attempts (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Composite index supports the lookup pattern:
--   WHERE key = ? AND created_at >= ?
CREATE INDEX IF NOT EXISTS idx_rate_limit_key_time
    ON rate_limit_attempts (key, created_at DESC);

-- Service-role only: this table is internal and should never be
-- exposed to client queries.
ALTER TABLE rate_limit_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for rate_limit_attempts"
    ON rate_limit_attempts
    FOR ALL
    USING (auth.role() = 'service_role');

-- Helper function: delete entries older than the given interval.
-- Called from the cleanup cron.
CREATE OR REPLACE FUNCTION cleanup_rate_limit_attempts(
    older_than INTERVAL DEFAULT INTERVAL '24 hours'
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limit_attempts
    WHERE created_at < NOW() - older_than;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

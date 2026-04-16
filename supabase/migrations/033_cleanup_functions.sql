-- ============================================
-- Efficient cleanup functions — reduce Disk IO
-- ============================================
-- The previous cleanup approach (SELECT ids, then DELETE WHERE id IN (...))
-- does 2 round-trips per batch. These PostgreSQL functions do DELETE with
-- a CTE in one statement, halving the read IO and running entirely server-side.
--
-- All functions return the count of rows actually deleted. The cron loops
-- until the returned count is less than the requested batch size.

-- Delete old monitoring rows for a list of site IDs (uptime_checks, ssl_checks,
-- performance_checks use this).
CREATE OR REPLACE FUNCTION cleanup_old_rows_by_sites(
    p_table text,
    p_timestamp_column text,
    p_site_ids uuid[],
    p_cutoff timestamptz,
    p_batch_size int DEFAULT 5000
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count int;
BEGIN
    -- Use EXECUTE because table name is dynamic.
    EXECUTE format(
        'WITH doomed AS (
            SELECT ctid FROM %I
            WHERE site_id = ANY($1) AND %I < $2
            LIMIT $3
        )
        DELETE FROM %I WHERE ctid IN (SELECT ctid FROM doomed)',
        p_table, p_timestamp_column, p_table
    )
    USING p_site_ids, p_cutoff, p_batch_size;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Delete old resolved alerts for a tenant.
CREATE OR REPLACE FUNCTION cleanup_old_resolved_alerts(
    p_tenant_id uuid,
    p_cutoff timestamptz,
    p_batch_size int DEFAULT 5000
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count int;
BEGIN
    WITH doomed AS (
        SELECT ctid FROM alerts
        WHERE tenant_id = p_tenant_id
          AND status IN ('resolved', 'auto_resolved', 'dismissed')
          AND created_at < p_cutoff
        LIMIT p_batch_size
    )
    DELETE FROM alerts WHERE ctid IN (SELECT ctid FROM doomed);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Delete old activity logs for a tenant.
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs(
    p_tenant_id uuid,
    p_cutoff timestamptz,
    p_batch_size int DEFAULT 5000
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count int;
BEGIN
    WITH doomed AS (
        SELECT ctid FROM activity_logs
        WHERE tenant_id = p_tenant_id
          AND created_at < p_cutoff
        LIMIT p_batch_size
    )
    DELETE FROM activity_logs WHERE ctid IN (SELECT ctid FROM doomed);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Grant execute to service role (the cron uses the service role key).
GRANT EXECUTE ON FUNCTION cleanup_old_rows_by_sites(text, text, uuid[], timestamptz, int) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_resolved_alerts(uuid, timestamptz, int) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_activity_logs(uuid, timestamptz, int) TO service_role;

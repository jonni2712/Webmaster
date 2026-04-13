import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Daily history cleanup cron.
 *
 * Iterates every tenant, looks up their plan's `retention_days`, and
 * deletes old monitoring data older than that cutoff:
 *   - uptime_checks
 *   - ssl_checks
 *   - performance_checks
 *   - alerts (only resolved ones)
 *   - external_scan_results
 *
 * Uses batched deletes (max 1000 rows per operation) to avoid long
 * lock contention on the Supabase primary.
 *
 * Schedule: daily at 04:00 UTC (vercel.json entry added alongside).
 *
 * Idempotent: running twice in the same day has no effect after the
 * first run since nothing is older than the cutoff anymore.
 */

export const maxDuration = 300;

const BATCH_SIZE = 1000;

/**
 * Tables that store per-site time-series data and are subject to the
 * per-plan retention policy. The `timestamp_column` is the column used
 * to compare against the cutoff date.
 */
const RETENTION_TABLES = [
  { table: 'uptime_checks', timestamp_column: 'checked_at' },
  { table: 'ssl_checks', timestamp_column: 'checked_at' },
  { table: 'performance_checks', timestamp_column: 'checked_at' },
  { table: 'external_scan_results', timestamp_column: 'scanned_at' },
] as const;

interface TenantCleanupResult {
  tenant_id: string;
  tenant_name: string;
  retention_days: number;
  deleted_by_table: Record<string, number>;
  total_deleted: number;
}

interface CleanupSummary {
  ok: true;
  tenants_processed: number;
  total_rows_deleted: number;
  duration_ms: number;
  details: TenantCleanupResult[];
  errors: string[];
}

async function deleteOldRowsViaSiteIds(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  timestampColumn: string,
  siteIds: string[],
  cutoffIso: string
): Promise<number> {
  if (siteIds.length === 0) return 0;

  let totalDeleted = 0;
  // Delete in passes — Supabase DELETE with eq returns the row count
  // via the count option. We loop until nothing more gets removed.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Step 1: select a batch of row IDs to delete (keeps the subsequent
    // DELETE fast and chunked regardless of index performance).
    const { data: doomed, error: selectError } = await supabase
      .from(table)
      .select('id')
      .in('site_id', siteIds)
      .lt(timestampColumn, cutoffIso)
      .limit(BATCH_SIZE);

    if (selectError) {
      console.error(`[cleanup-history] select ${table} failed:`, selectError);
      break;
    }
    if (!doomed || doomed.length === 0) break;

    const ids = doomed.map((r) => (r as { id: string | number }).id);

    const { error: deleteError, count } = await supabase
      .from(table)
      .delete({ count: 'exact' })
      .in('id', ids);

    if (deleteError) {
      console.error(`[cleanup-history] delete ${table} failed:`, deleteError);
      break;
    }

    totalDeleted += count ?? ids.length;
    if (doomed.length < BATCH_SIZE) break;
  }

  return totalDeleted;
}

async function deleteOldResolvedAlerts(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
  cutoffIso: string
): Promise<number> {
  // Only delete alerts that are in a terminal state. Never delete an
  // active/triggered alert, even if it's old — the user might still
  // need to act on it.
  let totalDeleted = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: doomed, error: selectError } = await supabase
      .from('alerts')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('status', ['resolved', 'auto_resolved', 'dismissed'])
      .lt('created_at', cutoffIso)
      .limit(BATCH_SIZE);

    if (selectError) {
      console.error('[cleanup-history] select alerts failed:', selectError);
      break;
    }
    if (!doomed || doomed.length === 0) break;

    const ids = doomed.map((r) => (r as { id: string }).id);

    const { error: deleteError, count } = await supabase
      .from('alerts')
      .delete({ count: 'exact' })
      .in('id', ids);

    if (deleteError) {
      console.error('[cleanup-history] delete alerts failed:', deleteError);
      break;
    }

    totalDeleted += count ?? ids.length;
    if (doomed.length < BATCH_SIZE) break;
  }

  return totalDeleted;
}

async function deleteOldActivityLogs(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
  cutoffIso: string
): Promise<number> {
  // Delete all activity log entries older than the retention cutoff.
  // activity_logs carries tenant_id directly so no site join is needed.
  let totalDeleted = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: doomed, error: selectError } = await supabase
      .from('activity_logs')
      .select('id')
      .eq('tenant_id', tenantId)
      .lt('created_at', cutoffIso)
      .limit(BATCH_SIZE);

    if (selectError) {
      console.error('[cleanup-history] select activity_logs failed:', selectError);
      break;
    }
    if (!doomed || doomed.length === 0) break;

    const ids = doomed.map((r) => (r as { id: string }).id);

    const { error: deleteError, count } = await supabase
      .from('activity_logs')
      .delete({ count: 'exact' })
      .in('id', ids);

    if (deleteError) {
      console.error('[cleanup-history] delete activity_logs failed:', deleteError);
      break;
    }

    totalDeleted += count ?? ids.length;
    if (doomed.length < BATCH_SIZE) break;
  }

  return totalDeleted;
}

export async function GET(request: Request) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const supabase = createAdminClient();
  const errors: string[] = [];
  const details: TenantCleanupResult[] = [];

  // Fetch all tenants with their plan's retention_days in one query
  // via the tenant_plan_limits view.
  const { data: tenantLimits, error: listError } = await supabase
    .from('tenant_plan_limits')
    .select('tenant_id, tenant_name, plan_retention_days');

  if (listError) {
    console.error('[cleanup-history] Failed to list tenants:', listError);
    return NextResponse.json(
      { error: 'Failed to list tenants', details: listError.message },
      { status: 500 }
    );
  }

  for (const row of tenantLimits || []) {
    const tenantId = (row as { tenant_id: string }).tenant_id;
    const tenantName = (row as { tenant_name: string }).tenant_name;
    const retentionDays =
      ((row as { plan_retention_days: number | null }).plan_retention_days) ?? 30;

    // Defensive: never delete less than 1 day of history.
    if (retentionDays <= 0) {
      continue;
    }

    const cutoffIso = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000
    ).toISOString();

    try {
      // Get the list of site IDs for this tenant — needed because the
      // monitoring tables don't carry tenant_id directly, they reference
      // sites which in turn belong to a tenant.
      const { data: tenantSites } = await supabase
        .from('sites')
        .select('id')
        .eq('tenant_id', tenantId);

      const siteIds =
        (tenantSites || []).map((s) => (s as { id: string }).id) ?? [];

      const deletedByTable: Record<string, number> = {};

      for (const { table, timestamp_column } of RETENTION_TABLES) {
        const n = await deleteOldRowsViaSiteIds(
          supabase,
          table,
          timestamp_column,
          siteIds,
          cutoffIso
        );
        deletedByTable[table] = n;
      }

      // Alerts are tenant-scoped directly.
      deletedByTable['alerts'] = await deleteOldResolvedAlerts(
        supabase,
        tenantId,
        cutoffIso
      );

      // Activity logs are tenant-scoped directly.
      deletedByTable['activity_logs'] = await deleteOldActivityLogs(
        supabase,
        tenantId,
        cutoffIso
      );

      const totalDeleted = Object.values(deletedByTable).reduce(
        (a, b) => a + b,
        0
      );

      details.push({
        tenant_id: tenantId,
        tenant_name: tenantName,
        retention_days: retentionDays,
        deleted_by_table: deletedByTable,
        total_deleted: totalDeleted,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`tenant ${tenantId}: ${msg}`);
    }
  }

  const summary: CleanupSummary = {
    ok: true,
    tenants_processed: details.length,
    total_rows_deleted: details.reduce((a, d) => a + d.total_deleted, 0),
    duration_ms: Date.now() - startedAt,
    details,
    errors,
  };

  return NextResponse.json(summary);
}

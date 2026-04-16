import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Daily history cleanup cron — IO-optimized version.
 *
 * Uses PostgreSQL functions (migration 033) that run entirely server-side:
 *   - cleanup_old_rows_by_sites (uptime/ssl/performance/external_scan)
 *   - cleanup_old_resolved_alerts
 *   - cleanup_old_activity_logs
 *
 * Each call does a single round-trip with a CTE-based DELETE (no SELECT
 * preamble), and uses a larger batch size (5000) to reduce the number of
 * transactions and WAL writes — which directly lowers Supabase Disk IO.
 *
 * Idempotent: running twice in the same day has no effect after the
 * first run since nothing is older than the cutoff anymore.
 */

export const maxDuration = 300;

const BATCH_SIZE = 5000;

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

async function deleteOldRowsByTable(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  timestampColumn: string,
  siteIds: string[],
  cutoffIso: string
): Promise<number> {
  if (siteIds.length === 0) return 0;

  let totalDeleted = 0;
  // Loop until the function returns less than a full batch
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.rpc('cleanup_old_rows_by_sites', {
      p_table: table,
      p_timestamp_column: timestampColumn,
      p_site_ids: siteIds,
      p_cutoff: cutoffIso,
      p_batch_size: BATCH_SIZE,
    });

    if (error) {
      console.error(`[cleanup-history] ${table} RPC failed:`, error);
      break;
    }

    const deleted = (data as number) ?? 0;
    totalDeleted += deleted;
    if (deleted < BATCH_SIZE) break;
  }

  return totalDeleted;
}

async function deleteOldResolvedAlerts(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
  cutoffIso: string
): Promise<number> {
  let totalDeleted = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.rpc('cleanup_old_resolved_alerts', {
      p_tenant_id: tenantId,
      p_cutoff: cutoffIso,
      p_batch_size: BATCH_SIZE,
    });

    if (error) {
      console.error('[cleanup-history] alerts RPC failed:', error);
      break;
    }

    const deleted = (data as number) ?? 0;
    totalDeleted += deleted;
    if (deleted < BATCH_SIZE) break;
  }

  return totalDeleted;
}

async function deleteOldActivityLogs(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
  cutoffIso: string
): Promise<number> {
  let totalDeleted = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.rpc('cleanup_old_activity_logs', {
      p_tenant_id: tenantId,
      p_cutoff: cutoffIso,
      p_batch_size: BATCH_SIZE,
    });

    if (error) {
      console.error('[cleanup-history] activity_logs RPC failed:', error);
      break;
    }

    const deleted = (data as number) ?? 0;
    totalDeleted += deleted;
    if (deleted < BATCH_SIZE) break;
  }

  return totalDeleted;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const supabase = createAdminClient();
  const errors: string[] = [];
  const details: TenantCleanupResult[] = [];

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

    if (retentionDays <= 0) continue;

    const cutoffIso = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000
    ).toISOString();

    try {
      const { data: tenantSites } = await supabase
        .from('sites')
        .select('id')
        .eq('tenant_id', tenantId);

      const siteIds =
        (tenantSites || []).map((s) => (s as { id: string }).id) ?? [];

      const deletedByTable: Record<string, number> = {};

      for (const { table, timestamp_column } of RETENTION_TABLES) {
        deletedByTable[table] = await deleteOldRowsByTable(
          supabase,
          table,
          timestamp_column,
          siteIds,
          cutoffIso
        );
      }

      deletedByTable['alerts'] = await deleteOldResolvedAlerts(
        supabase,
        tenantId,
        cutoffIso
      );

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

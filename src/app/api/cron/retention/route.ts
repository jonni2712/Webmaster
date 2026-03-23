import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let deletedOld = 0;
  let compacted = 0;

  // 1. Delete everything older than 30 days
  const { count: oldCount } = await supabase
    .from('server_resource_snapshots')
    .delete({ count: 'exact' })
    .lt('recorded_at', thirtyDaysAgo.toISOString());

  deletedOld = oldCount || 0;

  // 2. For 7-30 day range: keep only one per hour per server
  // Strategy: find duplicates within the same hour and delete all but the latest
  const { data: servers } = await supabase
    .from('servers')
    .select('id')
    .not('last_sync_at', 'is', null);

  if (servers) {
    for (const server of servers) {
      // Get all snapshots in the 7-30 day range for this server
      const { data: snapshots } = await supabase
        .from('server_resource_snapshots')
        .select('id, recorded_at')
        .eq('server_id', server.id)
        .gte('recorded_at', thirtyDaysAgo.toISOString())
        .lt('recorded_at', sevenDaysAgo.toISOString())
        .order('recorded_at', { ascending: true });

      if (!snapshots || snapshots.length <= 1) continue;

      // Group by hour
      const hourGroups = new Map<string, string[]>();
      for (const snap of snapshots) {
        const date = new Date(snap.recorded_at);
        const hourKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        const group = hourGroups.get(hourKey) || [];
        group.push(snap.id);
        hourGroups.set(hourKey, group);
      }

      // For each hour group, keep the last one, delete the rest
      const toDelete: string[] = [];
      for (const [, ids] of hourGroups) {
        if (ids.length > 1) {
          toDelete.push(...ids.slice(0, -1)); // Keep last, delete rest
        }
      }

      if (toDelete.length > 0) {
        // Delete in batches of 100
        for (let i = 0; i < toDelete.length; i += 100) {
          const batch = toDelete.slice(i, i + 100);
          await supabase
            .from('server_resource_snapshots')
            .delete()
            .in('id', batch);
        }
        compacted += toDelete.length;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    deleted_old: deletedOld,
    compacted,
  });
}

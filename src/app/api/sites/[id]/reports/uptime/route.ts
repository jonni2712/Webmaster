import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

export interface UptimeDataPoint {
  date: string;
  uptime_percentage: number;
  total_checks: number;
  successful_checks: number;
  avg_response_time: number | null;
  min_response_time: number | null;
  max_response_time: number | null;
}

export interface UptimeReportSummary {
  average_uptime: number;
  total_checks: number;
  total_downtime_minutes: number;
  avg_response_time: number;
  p95_response_time: number;
  longest_outage_minutes: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);

  // Parse date range from query params
  const startDate = searchParams.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = searchParams.get('end') || new Date().toISOString();

  try {
    const supabase = createAdminClient();

    // Get user's current tenant
    const { data: user } = await supabase
      .from('users')
      .select('current_tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.current_tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Verify site belongs to tenant
    const { data: site } = await supabase
      .from('sites')
      .select('id, name')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get aggregated uptime data by day
    const { data: dailyData, error: dailyError } = await supabase
      .rpc('get_uptime_daily_report', {
        p_site_id: id,
        p_start_date: startDate,
        p_end_date: endDate,
      });

    // If RPC doesn't exist, fall back to raw query
    let dataPoints: UptimeDataPoint[] = [];

    if (dailyError) {
      // Fallback: Get raw data and aggregate in JS
      const { data: rawChecks } = await supabase
        .from('uptime_checks')
        .select('is_up, response_time_ms, checked_at')
        .eq('site_id', id)
        .gte('checked_at', startDate)
        .lte('checked_at', endDate)
        .order('checked_at', { ascending: true });

      if (rawChecks && rawChecks.length > 0) {
        // Group by date
        const groupedByDate = new Map<string, { up: number; total: number; responseTimes: number[] }>();

        for (const check of rawChecks) {
          const date = new Date(check.checked_at).toISOString().split('T')[0];
          const existing = groupedByDate.get(date) || { up: 0, total: 0, responseTimes: [] };

          existing.total++;
          if (check.is_up) existing.up++;
          if (check.response_time_ms) existing.responseTimes.push(check.response_time_ms);

          groupedByDate.set(date, existing);
        }

        // Convert to data points
        dataPoints = Array.from(groupedByDate.entries()).map(([date, data]) => ({
          date,
          uptime_percentage: Math.round((data.up / data.total) * 10000) / 100,
          total_checks: data.total,
          successful_checks: data.up,
          avg_response_time: data.responseTimes.length > 0
            ? Math.round(data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length)
            : null,
          min_response_time: data.responseTimes.length > 0 ? Math.min(...data.responseTimes) : null,
          max_response_time: data.responseTimes.length > 0 ? Math.max(...data.responseTimes) : null,
        }));
      }
    } else {
      dataPoints = dailyData || [];
    }

    // Calculate summary statistics
    const allResponseTimes: number[] = [];
    let totalChecks = 0;
    let successfulChecks = 0;

    for (const point of dataPoints) {
      totalChecks += point.total_checks;
      successfulChecks += point.successful_checks;
      if (point.avg_response_time) {
        allResponseTimes.push(point.avg_response_time);
      }
    }

    // Sort for percentile calculation
    const sortedTimes = [...allResponseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);

    const summary: UptimeReportSummary = {
      average_uptime: totalChecks > 0
        ? Math.round((successfulChecks / totalChecks) * 10000) / 100
        : 100,
      total_checks: totalChecks,
      total_downtime_minutes: Math.round((totalChecks - successfulChecks) * 5), // Assuming 5-min intervals
      avg_response_time: allResponseTimes.length > 0
        ? Math.round(allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length)
        : 0,
      p95_response_time: sortedTimes[p95Index] || 0,
      longest_outage_minutes: 0, // TODO: Calculate from consecutive failures
    };

    return NextResponse.json({
      site: { id: site.id, name: site.name },
      period: { start: startDate, end: endDate },
      data: dataPoints,
      summary,
    });
  } catch (error) {
    console.error('GET /api/sites/[id]/reports/uptime error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

export interface PerformanceDataPoint {
  date: string;
  avg_score: number;
  avg_lcp: number;
  avg_fid: number;
  avg_cls: number;
  avg_fcp: number;
  avg_ttfb: number;
  checks_count: number;
}

export interface PerformanceReportSummary {
  average_score: number;
  score_trend: 'improving' | 'stable' | 'degrading';
  avg_lcp: number;
  avg_fid: number;
  avg_cls: number;
  avg_fcp: number;
  avg_ttfb: number;
  total_checks: number;
  lcp_status: 'good' | 'needs-improvement' | 'poor';
  fid_status: 'good' | 'needs-improvement' | 'poor';
  cls_status: 'good' | 'needs-improvement' | 'poor';
}

function getWebVitalStatus(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (metric) {
    case 'lcp':
      if (value <= 2500) return 'good';
      if (value <= 4000) return 'needs-improvement';
      return 'poor';
    case 'fid':
      if (value <= 100) return 'good';
      if (value <= 300) return 'needs-improvement';
      return 'poor';
    case 'cls':
      if (value <= 0.1) return 'good';
      if (value <= 0.25) return 'needs-improvement';
      return 'poor';
    default:
      return 'good';
  }
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

    // Get performance checks
    const { data: rawChecks } = await supabase
      .from('performance_checks')
      .select('performance_score, lcp_ms, fid_ms, cls, fcp_ms, ttfb_ms, checked_at')
      .eq('site_id', id)
      .gte('checked_at', startDate)
      .lte('checked_at', endDate)
      .order('checked_at', { ascending: true });

    let dataPoints: PerformanceDataPoint[] = [];

    if (rawChecks && rawChecks.length > 0) {
      // Group by date
      const groupedByDate = new Map<string, {
        scores: number[];
        lcps: number[];
        fids: number[];
        cls: number[];
        fcps: number[];
        ttfbs: number[];
      }>();

      for (const check of rawChecks) {
        const date = new Date(check.checked_at).toISOString().split('T')[0];
        const existing = groupedByDate.get(date) || {
          scores: [],
          lcps: [],
          fids: [],
          cls: [],
          fcps: [],
          ttfbs: [],
        };

        if (check.performance_score) existing.scores.push(check.performance_score);
        if (check.lcp_ms) existing.lcps.push(check.lcp_ms);
        if (check.fid_ms) existing.fids.push(check.fid_ms);
        if (check.cls !== null) existing.cls.push(Number(check.cls));
        if (check.fcp_ms) existing.fcps.push(check.fcp_ms);
        if (check.ttfb_ms) existing.ttfbs.push(check.ttfb_ms);

        groupedByDate.set(date, existing);
      }

      // Convert to data points
      dataPoints = Array.from(groupedByDate.entries()).map(([date, data]) => ({
        date,
        avg_score: data.scores.length > 0
          ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
          : 0,
        avg_lcp: data.lcps.length > 0
          ? Math.round(data.lcps.reduce((a, b) => a + b, 0) / data.lcps.length)
          : 0,
        avg_fid: data.fids.length > 0
          ? Math.round(data.fids.reduce((a, b) => a + b, 0) / data.fids.length)
          : 0,
        avg_cls: data.cls.length > 0
          ? Math.round((data.cls.reduce((a, b) => a + b, 0) / data.cls.length) * 1000) / 1000
          : 0,
        avg_fcp: data.fcps.length > 0
          ? Math.round(data.fcps.reduce((a, b) => a + b, 0) / data.fcps.length)
          : 0,
        avg_ttfb: data.ttfbs.length > 0
          ? Math.round(data.ttfbs.reduce((a, b) => a + b, 0) / data.ttfbs.length)
          : 0,
        checks_count: data.scores.length,
      }));
    }

    // Calculate summary
    const allScores = dataPoints.map(d => d.avg_score).filter(s => s > 0);
    const avgScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    // Calculate trend (compare first half vs second half)
    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (allScores.length >= 4) {
      const midpoint = Math.floor(allScores.length / 2);
      const firstHalf = allScores.slice(0, midpoint);
      const secondHalf = allScores.slice(midpoint);
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      const diff = secondAvg - firstAvg;

      if (diff > 5) trend = 'improving';
      else if (diff < -5) trend = 'degrading';
    }

    // Calculate averages for Web Vitals
    const avgLcp = dataPoints.length > 0
      ? Math.round(dataPoints.reduce((a, b) => a + b.avg_lcp, 0) / dataPoints.length)
      : 0;
    const avgFid = dataPoints.length > 0
      ? Math.round(dataPoints.reduce((a, b) => a + b.avg_fid, 0) / dataPoints.length)
      : 0;
    const avgCls = dataPoints.length > 0
      ? Math.round((dataPoints.reduce((a, b) => a + b.avg_cls, 0) / dataPoints.length) * 1000) / 1000
      : 0;
    const avgFcp = dataPoints.length > 0
      ? Math.round(dataPoints.reduce((a, b) => a + b.avg_fcp, 0) / dataPoints.length)
      : 0;
    const avgTtfb = dataPoints.length > 0
      ? Math.round(dataPoints.reduce((a, b) => a + b.avg_ttfb, 0) / dataPoints.length)
      : 0;

    const summary: PerformanceReportSummary = {
      average_score: avgScore,
      score_trend: trend,
      avg_lcp: avgLcp,
      avg_fid: avgFid,
      avg_cls: avgCls,
      avg_fcp: avgFcp,
      avg_ttfb: avgTtfb,
      total_checks: dataPoints.reduce((a, b) => a + b.checks_count, 0),
      lcp_status: getWebVitalStatus('lcp', avgLcp),
      fid_status: getWebVitalStatus('fid', avgFid),
      cls_status: getWebVitalStatus('cls', avgCls),
    };

    return NextResponse.json({
      site: { id: site.id, name: site.name },
      period: { start: startDate, end: endDate },
      data: dataPoints,
      summary,
    });
  } catch (error) {
    console.error('GET /api/sites/[id]/reports/performance error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

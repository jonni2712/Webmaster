import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkUptime } from '@/lib/monitoring/uptime-checker';
import { checkSSL } from '@/lib/monitoring/ssl-checker';
import { checkPerformance } from '@/lib/monitoring/performance-checker';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { type } = body;

    if (!['uptime', 'ssl', 'performance'].includes(type)) {
      return NextResponse.json({ error: 'Invalid check type' }, { status: 400 });
    }

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

    // Get site
    const { data: site } = await supabase
      .from('sites')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    let result;

    if (type === 'uptime') {
      const checkResult = await checkUptime(site.url);

      const { data, error } = await supabase
        .from('uptime_checks')
        .insert({
          site_id: id,
          is_up: checkResult.isUp,
          response_time_ms: checkResult.responseTimeMs,
          status_code: checkResult.statusCode,
          error_message: checkResult.errorMessage,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Calculate uptime percentage from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentChecks } = await supabase
        .from('uptime_checks')
        .select('is_up')
        .eq('site_id', id)
        .gte('checked_at', thirtyDaysAgo.toISOString());

      let uptimePercentage = null;
      if (recentChecks && recentChecks.length > 0) {
        const upCount = recentChecks.filter(c => c.is_up).length;
        uptimePercentage = (upCount / recentChecks.length) * 100;
      }

      // Update site status
      await supabase
        .from('sites')
        .update({
          status: checkResult.isUp ? 'online' : 'offline',
          response_time_avg: checkResult.responseTimeMs,
          uptime_percentage: uptimePercentage,
          last_check: new Date().toISOString(),
        })
        .eq('id', id);
    } else if (type === 'ssl') {
      const checkResult = await checkSSL(site.url);

      const { data, error } = await supabase
        .from('ssl_checks')
        .insert({
          site_id: id,
          is_valid: checkResult.isValid,
          issuer: checkResult.issuer,
          valid_to: checkResult.validTo,
          days_until_expiry: checkResult.daysUntilExpiry,
          error_message: checkResult.errorMessage,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Determine SSL status
      let sslStatus = 'invalid';
      if (checkResult.isValid) {
        if (checkResult.daysUntilExpiry && checkResult.daysUntilExpiry <= 14) {
          sslStatus = 'expiring';
        } else {
          sslStatus = 'valid';
        }
      } else if (checkResult.daysUntilExpiry && checkResult.daysUntilExpiry < 0) {
        sslStatus = 'expired';
      }

      // Update site SSL status
      await supabase
        .from('sites')
        .update({
          ssl_status: sslStatus,
          ssl_expires_at: checkResult.validTo,
        })
        .eq('id', id);
    } else if (type === 'performance') {
      const checkResult = await checkPerformance(site.url);

      if (!checkResult.success) {
        return NextResponse.json(
          { error: checkResult.errorMessage || 'Performance check failed' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('performance_checks')
        .insert({
          site_id: id,
          performance_score: checkResult.performanceScore,
          lcp_ms: checkResult.lcpMs,
          fid_ms: checkResult.fidMs,
          cls: checkResult.cls,
          fcp_ms: checkResult.fcpMs,
          ttfb_ms: checkResult.ttfbMs,
          tti_ms: checkResult.ttiMs,
          tbt_ms: checkResult.tbtMs,
          speed_index: checkResult.speedIndex,
          total_bytes: checkResult.totalBytes,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Update site performance score
      await supabase
        .from('sites')
        .update({
          performance_score: checkResult.performanceScore,
        })
        .eq('id', id);
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('POST /api/sites/[id]/check error:', error);
    return NextResponse.json(
      { error: 'Errore durante il controllo' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkUptime } from '@/lib/monitoring/uptime-checker';
import { checkSSL } from '@/lib/monitoring/ssl-checker';

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
          status: checkResult.status,
          response_time: checkResult.responseTime,
          status_code: checkResult.statusCode,
          error_message: checkResult.error,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Update site status
      await supabase
        .from('sites')
        .update({
          status: checkResult.status === 'up' ? 'online' : checkResult.status === 'down' ? 'offline' : 'degraded',
          last_check: new Date().toISOString(),
        })
        .eq('id', id);
    } else if (type === 'ssl') {
      const checkResult = await checkSSL(site.url);

      const { data, error } = await supabase
        .from('ssl_checks')
        .insert({
          site_id: id,
          valid: checkResult.valid,
          issuer: checkResult.issuer,
          expires_at: checkResult.expiresAt,
          days_until_expiry: checkResult.daysUntilExpiry,
          error_message: checkResult.error,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Determine SSL status
      let sslStatus = 'invalid';
      if (checkResult.valid) {
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
          ssl_expires_at: checkResult.expiresAt,
        })
        .eq('id', id);
    } else if (type === 'performance') {
      // Performance check would use PageSpeed API
      // For now, return a placeholder
      result = { message: 'Performance check requires PageSpeed API key' };
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

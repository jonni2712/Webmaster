import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { DigestEmail } from '@/lib/email/templates/digest';
import { format, subDays, subWeeks } from 'date-fns';
import { it } from 'date-fns/locale';
import type { DigestPreferences } from '@/types/database';

export const runtime = 'edge';
export const maxDuration = 60;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET(request: NextRequest) {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping digest');
    return NextResponse.json({ message: 'Email not configured' });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentDayOfWeek = now.getUTCDay();

    // Get all tenants with digest preferences
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, name, settings');

    if (error) {
      console.error('Failed to fetch tenants:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const tenant of tenants || []) {
      results.processed++;

      const digestPrefs = (tenant.settings?.digest_preferences || null) as DigestPreferences | null;

      // Skip if no digest preferences or disabled
      if (!digestPrefs?.enabled) {
        results.skipped++;
        continue;
      }

      // Check if it's the right time to send
      const shouldSend =
        digestPrefs.hour === currentHour &&
        (digestPrefs.frequency === 'daily' ||
          (digestPrefs.frequency === 'weekly' && digestPrefs.day_of_week === currentDayOfWeek));

      if (!shouldSend) {
        results.skipped++;
        continue;
      }

      try {
        // Calculate period
        const periodEnd = now;
        const periodStart = digestPrefs.frequency === 'weekly' ? subWeeks(now, 1) : subDays(now, 1);
        const periodLabel = digestPrefs.frequency === 'weekly' ? 'settimanale' : 'giornaliero';

        // Get sites for this tenant
        const { data: sites } = await supabase
          .from('site_status_summary')
          .select('*')
          .eq('tenant_id', tenant.id);

        if (!sites || sites.length === 0) {
          results.skipped++;
          continue;
        }

        // Get alerts for the period
        const { data: alerts } = await supabase
          .from('alerts')
          .select('id, site_id, title, severity, created_at')
          .eq('tenant_id', tenant.id)
          .gte('created_at', periodStart.toISOString())
          .order('created_at', { ascending: false })
          .limit(20);

        // Get site names for alerts
        const siteIds = [...new Set((alerts || []).map(a => a.site_id).filter(Boolean))];
        const { data: siteNames } = siteIds.length > 0
          ? await supabase.from('sites').select('id, name').in('id', siteIds)
          : { data: [] };

        const siteNameMap = new Map((siteNames || []).map(s => [s.id, s.name]));

        // Calculate stats
        const stats = {
          totalSites: sites.length,
          sitesOnline: sites.filter(s => s.current_status === true).length,
          sitesOffline: sites.filter(s => s.current_status === false).length,
          sslValid: sites.filter(s => s.ssl_valid === true && (s.ssl_days_remaining || 0) > 14).length,
          sslExpiring: sites.filter(s => s.ssl_valid === true && (s.ssl_days_remaining || 0) <= 14 && (s.ssl_days_remaining || 0) > 0).length,
          sslExpired: sites.filter(s => s.ssl_valid === false || (s.ssl_days_remaining || 0) <= 0).length,
          totalAlerts: (alerts || []).length,
          criticalAlerts: (alerts || []).filter(a => a.severity === 'critical').length,
        };

        // Format sites for email
        const siteStatuses = sites.map(site => ({
          name: site.name,
          url: site.url,
          status: site.current_status === true ? 'online' as const : site.current_status === false ? 'offline' as const : 'degraded' as const,
          uptime: site.uptime_30d,
          sslStatus: site.ssl_valid === true
            ? ((site.ssl_days_remaining || 0) <= 14 ? 'expiring' as const : 'valid' as const)
            : site.ssl_valid === false
              ? 'invalid' as const
              : null,
          sslDaysRemaining: site.ssl_days_remaining,
        }));

        // Format alerts for email
        const recentAlerts = (alerts || []).map(alert => ({
          id: alert.id,
          siteName: alert.site_id ? siteNameMap.get(alert.site_id) || 'Sconosciuto' : 'Sistema',
          title: alert.title,
          severity: alert.severity as 'info' | 'warning' | 'critical',
          createdAt: alert.created_at,
        }));

        // Get recipient email
        const { data: users } = await supabase
          .from('user_tenants')
          .select('user_id, role')
          .eq('tenant_id', tenant.id)
          .eq('role', 'owner')
          .limit(1);

        if (!users || users.length === 0) {
          results.skipped++;
          continue;
        }

        const { data: owner } = await supabase
          .from('users')
          .select('email, name')
          .eq('id', users[0].user_id)
          .single();

        const recipientEmail = digestPrefs.email || owner?.email;
        if (!recipientEmail) {
          results.skipped++;
          continue;
        }

        // Send digest email
        const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://webmaster-monitor.com';

        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Webmaster Monitor <noreply@webmaster-monitor.com>',
          to: recipientEmail,
          subject: `Riepilogo ${periodLabel} - ${stats.sitesOnline}/${stats.totalSites} siti online`,
          react: DigestEmail({
            periodLabel,
            periodStart: format(periodStart, 'dd MMM yyyy', { locale: it }),
            periodEnd: format(periodEnd, 'dd MMM yyyy', { locale: it }),
            stats,
            sites: siteStatuses,
            recentAlerts,
            dashboardUrl,
          }),
        });

        results.sent++;
        console.log(`Digest sent to ${recipientEmail} for tenant ${tenant.name}`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`Tenant ${tenant.id}: ${errorMsg}`);
        console.error(`Failed to send digest for tenant ${tenant.id}:`, err);
      }
    }

    return NextResponse.json({
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron digest error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

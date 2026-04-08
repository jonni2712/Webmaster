import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkUptime } from '@/lib/monitoring/uptime-checker';
import { createAlert, resolveAlerts, getCooldownMinutes, shouldNotifyRecovery } from '@/lib/alerts/generator';
import type { SiteAlertSettings } from '@/types/database';

// Uses default Node.js runtime (Fluid Compute) so that downstream
// notification dispatchers can load nodemailer for SMTP.
// maxDuration bumped to 300s (Vercel default since 2025) to allow
// processing all sites in a single run even at 1000+ scale.
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Get all active sites with uptime check enabled
    const { data: sites, error } = await supabase
      .from('sites')
      .select('id, name, url, tenant_id, status, alert_settings')
      .eq('is_active', true)
      .eq('uptime_check_enabled', true);

    if (error) {
      console.error('Failed to fetch sites:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!sites || sites.length === 0) {
      return NextResponse.json({
        message: 'No sites to check',
        timestamp: new Date().toISOString(),
      });
    }

    // Process in batches to respect rate limits.
    // At 755 active sites: 755/30 = ~26 batches × ~5s/batch = ~130s,
    // well within the 300s budget. Leaves ~170s of headroom for DB
    // writes and alert dispatching.
    const BATCH_SIZE = 30;
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < sites.length; i += BATCH_SIZE) {
      const batch = sites.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(async (site) => {
          const result = await checkUptime(site.url);

          // Save to database
          const { error: insertError } = await supabase
            .from('uptime_checks')
            .insert({
              site_id: site.id,
              is_up: result.isUp,
              status_code: result.statusCode,
              response_time_ms: result.responseTimeMs,
              error_type: result.errorType,
              error_message: result.errorMessage,
            });

          if (insertError) {
            throw new Error(`Failed to save check for ${site.url}: ${insertError.message}`);
          }

          // Calculate uptime percentage from last 30 days using COUNT (no row transfer)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const [totalResult, upResult] = await Promise.all([
            supabase
              .from('uptime_checks')
              .select('*', { count: 'exact', head: true })
              .eq('site_id', site.id)
              .gte('checked_at', thirtyDaysAgo.toISOString()),
            supabase
              .from('uptime_checks')
              .select('*', { count: 'exact', head: true })
              .eq('site_id', site.id)
              .eq('is_up', true)
              .gte('checked_at', thirtyDaysAgo.toISOString()),
          ]);

          let uptimePercentage = null;
          const totalCount = totalResult.count ?? 0;
          const upCount = upResult.count ?? 0;
          if (totalCount > 0) {
            uptimePercentage = (upCount / totalCount) * 100;
          }

          // Update site status fields
          const newStatus = result.isUp ? 'online' : 'offline';
          await supabase
            .from('sites')
            .update({
              status: newStatus,
              response_time_avg: result.responseTimeMs,
              uptime_percentage: uptimePercentage,
              last_check: new Date().toISOString(),
              last_check_at: new Date().toISOString(),
            })
            .eq('id', site.id);

          // Alert generation based on status change
          const previousStatus = site.status;
          const alertSettings = site.alert_settings as SiteAlertSettings | null;

          // Site went DOWN: online -> offline
          if (!result.isUp && previousStatus === 'online') {
            await createAlert({
              tenantId: site.tenant_id,
              siteId: site.id,
              siteName: site.name,
              siteUrl: site.url,
              triggerType: 'site_down',
              severity: 'critical',
              title: `${site.name} non raggiungibile`,
              message: `Il sito ${site.url} non risponde. Errore: ${result.errorType || 'unknown'}`,
              details: {
                errorType: result.errorType,
                errorMessage: result.errorMessage,
                statusCode: result.statusCode,
              },
              cooldownMinutes: getCooldownMinutes('site_down', alertSettings),
              alertSettings,
            });
          }

          // Site came back UP: offline -> online
          if (result.isUp && previousStatus === 'offline') {
            // Auto-resolve previous site_down alerts first
            await resolveAlerts({
              tenantId: site.tenant_id,
              siteId: site.id,
              triggerType: 'site_down',
            });

            // Create recovery alert if enabled
            if (shouldNotifyRecovery(alertSettings)) {
              await createAlert({
                tenantId: site.tenant_id,
                siteId: site.id,
                siteName: site.name,
                siteUrl: site.url,
                triggerType: 'site_down', // Use same type for recovery notification
                severity: 'info',
                title: `${site.name} tornato online`,
                message: `Il sito ${site.url} e' nuovamente raggiungibile`,
                details: {
                  responseTime: result.responseTimeMs,
                },
                cooldownMinutes: 5, // Short cooldown for recovery
                alertSettings,
              });
            }
          }

          return { siteId: site.id, url: site.url, ...result };
        })
      );

      for (const result of batchResults) {
        results.processed++;
        if (result.status === 'fulfilled') {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push(result.reason?.message || 'Unknown error');
        }
      }
    }

    return NextResponse.json({
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron uptime error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

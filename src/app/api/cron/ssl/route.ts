import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkSSL } from '@/lib/monitoring/ssl-checker';
import { createAlert, getSSLSeverity, resolveAlerts, getCooldownMinutes, shouldTriggerSSLAlert } from '@/lib/alerts/generator';
import { DEFAULT_ALERT_SETTINGS, type SiteAlertSettings } from '@/types/database';

export const runtime = 'edge';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { data: sites, error } = await supabase
      .from('sites')
      .select('id, name, url, tenant_id, ssl_status, alert_settings')
      .eq('is_active', true)
      .eq('ssl_check_enabled', true);

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

    const BATCH_SIZE = 10;
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
    };

    for (let i = 0; i < sites.length; i += BATCH_SIZE) {
      const batch = sites.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(async (site) => {
          const result = await checkSSL(site.url);

          const { error: insertError } = await supabase
            .from('ssl_checks')
            .insert({
              site_id: site.id,
              is_valid: result.isValid,
              valid_from: result.validFrom,
              valid_to: result.validTo,
              days_until_expiry: result.daysUntilExpiry,
              issuer: result.issuer,
              subject: result.subject,
              serial_number: result.serialNumber,
              error_message: result.errorMessage,
            });

          if (insertError) {
            throw new Error(`Failed to save SSL check for ${site.url}`);
          }

          // Get site-specific alert settings
          const alertSettings = site.alert_settings as SiteAlertSettings | null;
          const warningDays = alertSettings?.ssl_warning_days ?? DEFAULT_ALERT_SETTINGS.ssl_warning_days;
          const criticalDays = alertSettings?.ssl_critical_days ?? DEFAULT_ALERT_SETTINGS.ssl_critical_days;
          const sslCooldown = getCooldownMinutes('ssl_expiring', alertSettings);

          // Update site SSL status using site-specific thresholds
          let sslStatus = 'valid';
          if (!result.isValid) {
            sslStatus = 'invalid';
          } else if (result.daysUntilExpiry !== null && result.daysUntilExpiry <= 0) {
            sslStatus = 'expired';
          } else if (result.daysUntilExpiry !== null && result.daysUntilExpiry <= warningDays) {
            sslStatus = 'expiring';
          }

          await supabase
            .from('sites')
            .update({
              ssl_status: sslStatus,
              ssl_expires_at: result.validTo,
            })
            .eq('id', site.id);

          // Alert generation for SSL issues using site-specific thresholds
          const daysUntilExpiry = result.daysUntilExpiry;

          // SSL Invalid
          if (!result.isValid) {
            await createAlert({
              tenantId: site.tenant_id,
              siteId: site.id,
              siteName: site.name,
              siteUrl: site.url,
              triggerType: 'ssl_invalid',
              severity: 'critical',
              title: `SSL non valido per ${site.name}`,
              message: `Il certificato SSL del sito ${site.url} non e' valido: ${result.errorMessage || 'Errore sconosciuto'}`,
              details: {
                errorMessage: result.errorMessage,
              },
              cooldownMinutes: sslCooldown,
              alertSettings,
            });
          }
          // SSL Expired
          else if (daysUntilExpiry !== null && daysUntilExpiry <= 0) {
            await createAlert({
              tenantId: site.tenant_id,
              siteId: site.id,
              siteName: site.name,
              siteUrl: site.url,
              triggerType: 'ssl_expiring',
              severity: 'critical',
              title: `SSL SCADUTO per ${site.name}`,
              message: `Il certificato SSL del sito ${site.url} e' scaduto!`,
              details: {
                expiryDate: result.validTo,
                daysUntilExpiry: 0,
              },
              cooldownMinutes: sslCooldown,
              alertSettings,
            });
          }
          // SSL Expiring - Critical (using site-specific threshold)
          else if (daysUntilExpiry !== null && daysUntilExpiry <= criticalDays) {
            await createAlert({
              tenantId: site.tenant_id,
              siteId: site.id,
              siteName: site.name,
              siteUrl: site.url,
              triggerType: 'ssl_expiring',
              severity: 'critical',
              title: `SSL scade tra ${daysUntilExpiry} giorni - ${site.name}`,
              message: `Il certificato SSL del sito ${site.url} scadra' tra ${daysUntilExpiry} giorni. Rinnova subito!`,
              details: {
                expiryDate: result.validTo,
                daysUntilExpiry,
              },
              cooldownMinutes: sslCooldown,
              alertSettings,
            });
          }
          // SSL Expiring - Warning (using site-specific threshold)
          else if (daysUntilExpiry !== null && daysUntilExpiry <= warningDays) {
            await createAlert({
              tenantId: site.tenant_id,
              siteId: site.id,
              siteName: site.name,
              siteUrl: site.url,
              triggerType: 'ssl_expiring',
              severity: 'warning',
              title: `SSL scade tra ${daysUntilExpiry} giorni - ${site.name}`,
              message: `Il certificato SSL del sito ${site.url} scadra' tra ${daysUntilExpiry} giorni.`,
              details: {
                expiryDate: result.validTo,
                daysUntilExpiry,
              },
              cooldownMinutes: sslCooldown,
              alertSettings,
            });
          }
          // SSL is valid and not expiring soon - resolve any previous alerts
          else if (result.isValid && daysUntilExpiry !== null && daysUntilExpiry > warningDays) {
            await resolveAlerts({
              tenantId: site.tenant_id,
              siteId: site.id,
              triggerType: 'ssl_expiring',
            });
            await resolveAlerts({
              tenantId: site.tenant_id,
              siteId: site.id,
              triggerType: 'ssl_invalid',
            });
          }

          return result;
        })
      );

      for (const result of batchResults) {
        results.processed++;
        if (result.status === 'fulfilled') {
          results.successful++;
        } else {
          results.failed++;
        }
      }
    }

    return NextResponse.json({
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron SSL error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

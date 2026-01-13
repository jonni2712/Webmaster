import { resend, EMAIL_FROM } from '@/lib/email/client';
import { AlertDowntimeEmail } from '@/lib/email/templates/alert-downtime';
import { AlertSSLEmail } from '@/lib/email/templates/alert-ssl';
import { AlertRecoveryEmail } from '@/lib/email/templates/alert-recovery';
import { AlertUpdatesEmail } from '@/lib/email/templates/alert-updates';
import type { NotificationPayload } from '../dispatcher';

interface EmailConfig {
  recipients?: string[];
}

/**
 * Send email notification via Resend
 */
export async function sendEmailNotification(
  payload: NotificationPayload,
  config: Record<string, unknown>
): Promise<boolean> {
  if (!resend) {
    console.warn('Resend client not configured - skipping email notification');
    return false;
  }

  const emailConfig = config as EmailConfig;
  const recipients = emailConfig.recipients || [];

  if (recipients.length === 0) {
    console.warn('No email recipients configured');
    return false;
  }

  try {
    let emailComponent: React.ReactElement;
    let subject: string;

    switch (payload.type) {
      case 'site_down':
        subject = `🔴 ALERT: ${payload.site.name} non raggiungibile`;
        emailComponent = AlertDowntimeEmail({
          siteName: payload.site.name,
          siteUrl: payload.site.url,
          timestamp: new Date().toISOString(),
          errorMessage: payload.details?.errorMessage as string | undefined,
        });
        break;

      case 'site_up':
        subject = `✅ RISOLTO: ${payload.site.name} tornato online`;
        emailComponent = AlertRecoveryEmail({
          siteName: payload.site.name,
          siteUrl: payload.site.url,
          timestamp: new Date().toISOString(),
          downtimeDuration: payload.details?.downtimeDuration as string | undefined,
        });
        break;

      case 'ssl_expiring':
        subject = `⚠️ SSL: ${payload.site.name} scade tra ${payload.details?.daysUntilExpiry} giorni`;
        emailComponent = AlertSSLEmail({
          siteName: payload.site.name,
          siteUrl: payload.site.url,
          expiryDate: payload.details?.expiryDate as string,
          daysUntilExpiry: payload.details?.daysUntilExpiry as number,
          isExpired: false,
        });
        break;

      case 'ssl_expired':
      case 'ssl_invalid':
        subject = `🔴 SSL SCADUTO: ${payload.site.name}`;
        emailComponent = AlertSSLEmail({
          siteName: payload.site.name,
          siteUrl: payload.site.url,
          expiryDate: payload.details?.expiryDate as string,
          daysUntilExpiry: 0,
          isExpired: true,
        });
        break;

      case 'updates_critical':
        subject = `🔴 Aggiornamenti CRITICI: ${payload.site.name}`;
        emailComponent = AlertUpdatesEmail({
          siteName: payload.site.name,
          siteUrl: payload.site.url,
          updates: (payload.details?.updates as Array<{
            name: string;
            type: 'core' | 'plugin' | 'theme';
            currentVersion: string;
            newVersion: string;
            isCritical: boolean;
          }>) || [],
          criticalCount: (payload.details?.criticalCount as number) || 0,
          totalCount: (payload.details?.totalCount as number) || 0,
          dashboardUrl: payload.details?.dashboardUrl as string | undefined,
        });
        break;

      case 'updates_available':
        subject = `🔄 Aggiornamenti disponibili: ${payload.site.name}`;
        emailComponent = AlertUpdatesEmail({
          siteName: payload.site.name,
          siteUrl: payload.site.url,
          updates: (payload.details?.updates as Array<{
            name: string;
            type: 'core' | 'plugin' | 'theme';
            currentVersion: string;
            newVersion: string;
            isCritical: boolean;
          }>) || [],
          criticalCount: 0,
          totalCount: (payload.details?.totalCount as number) || 0,
          dashboardUrl: payload.details?.dashboardUrl as string | undefined,
        });
        break;

      default:
        subject = payload.title;
        emailComponent = AlertDowntimeEmail({
          siteName: payload.site.name,
          siteUrl: payload.site.url,
          timestamp: new Date().toISOString(),
        });
    }

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipients,
      subject,
      react: emailComponent,
    });

    if (error) {
      console.error('Resend email error:', error);
      return false;
    }

    console.log(`Email sent successfully to ${recipients.join(', ')}`);
    return true;
  } catch (err) {
    console.error('Error sending email notification:', err);
    return false;
  }
}

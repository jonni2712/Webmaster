import { createAdminClient } from '@/lib/supabase/admin';
import { dispatchNotification, type NotificationPayload } from '@/lib/notifications/dispatcher';
import type { AlertTriggerType, AlertSeverity } from '@/types/database';

interface CreateAlertParams {
  tenantId: string;
  siteId: string;
  siteName: string;
  siteUrl: string;
  triggerType: AlertTriggerType;
  severity: AlertSeverity;
  title: string;
  message: string;
  details?: Record<string, unknown>;
  cooldownMinutes?: number;
}

interface AlertResult {
  created: boolean;
  alertId?: string;
  reason?: string;
}

// Default cooldown in minutes
const DEFAULT_COOLDOWN_MINUTES = 60;

/**
 * Create an alert with cooldown logic to prevent spam
 * Returns the alert ID if created, null if skipped due to cooldown
 */
export async function createAlert(params: CreateAlertParams): Promise<AlertResult> {
  const supabase = createAdminClient();
  const cooldownMinutes = params.cooldownMinutes ?? DEFAULT_COOLDOWN_MINUTES;

  try {
    // Check for recent alerts of the same type for this site (cooldown)
    const cooldownTime = new Date(Date.now() - cooldownMinutes * 60 * 1000).toISOString();

    const { data: recentAlerts } = await supabase
      .from('alerts')
      .select('id, created_at')
      .eq('tenant_id', params.tenantId)
      .eq('site_id', params.siteId)
      .eq('trigger_type', params.triggerType)
      .neq('status', 'resolved')
      .gte('created_at', cooldownTime)
      .limit(1);

    if (recentAlerts && recentAlerts.length > 0) {
      console.log(
        `Alert ${params.triggerType} for site ${params.siteId} skipped - cooldown active (recent alert: ${recentAlerts[0].id})`
      );
      return {
        created: false,
        reason: 'cooldown_active',
        alertId: recentAlerts[0].id,
      };
    }

    // Create the alert
    const { data: alert, error } = await supabase
      .from('alerts')
      .insert({
        tenant_id: params.tenantId,
        site_id: params.siteId,
        trigger_type: params.triggerType,
        severity: params.severity,
        title: params.title,
        message: params.message,
        details: params.details || {},
        status: 'triggered',
        channels_notified: [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating alert:', error);
      return { created: false, reason: 'database_error' };
    }

    console.log(`Alert created: ${alert.id} - ${params.title}`);

    // Dispatch notifications
    const notificationPayload: NotificationPayload = {
      tenantId: params.tenantId,
      alertId: alert.id,
      type: mapTriggerTypeToNotificationType(params.triggerType),
      severity: params.severity,
      site: {
        id: params.siteId,
        name: params.siteName,
        url: params.siteUrl,
      },
      title: params.title,
      message: params.message,
      details: params.details,
    };

    // Fire and forget - don't wait for notifications to complete
    dispatchNotification(notificationPayload).catch((err) => {
      console.error('Error dispatching notifications:', err);
    });

    return { created: true, alertId: alert.id };
  } catch (err) {
    console.error('Error in createAlert:', err);
    return { created: false, reason: 'unexpected_error' };
  }
}

/**
 * Auto-resolve alerts when the issue is fixed (e.g., site back online)
 */
export async function resolveAlerts(params: {
  tenantId: string;
  siteId: string;
  triggerType: AlertTriggerType;
}): Promise<number> {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from('alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('tenant_id', params.tenantId)
      .eq('site_id', params.siteId)
      .eq('trigger_type', params.triggerType)
      .neq('status', 'resolved')
      .select('id');

    if (error) {
      console.error('Error resolving alerts:', error);
      return 0;
    }

    const resolvedCount = data?.length || 0;
    if (resolvedCount > 0) {
      console.log(`Auto-resolved ${resolvedCount} ${params.triggerType} alerts for site ${params.siteId}`);
    }

    return resolvedCount;
  } catch (err) {
    console.error('Error in resolveAlerts:', err);
    return 0;
  }
}

/**
 * Map trigger types to notification payload types
 */
function mapTriggerTypeToNotificationType(
  triggerType: AlertTriggerType
): NotificationPayload['type'] {
  switch (triggerType) {
    case 'site_down':
      return 'site_down';
    case 'ssl_expiring':
      return 'ssl_expiring';
    case 'ssl_invalid':
      return 'ssl_invalid';
    default:
      return 'site_down';
  }
}

/**
 * Get severity based on days until SSL expiry
 */
export function getSSLSeverity(daysUntilExpiry: number): AlertSeverity {
  if (daysUntilExpiry <= 0) return 'critical';
  if (daysUntilExpiry <= 7) return 'critical';
  if (daysUntilExpiry <= 14) return 'warning';
  return 'info';
}

/**
 * Format downtime duration for display
 */
export function formatDowntimeDuration(startTime: Date, endTime: Date): string {
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;

  if (diffHours > 0) {
    return `${diffHours}h ${remainingMinutes}m`;
  }
  return `${diffMinutes} minuti`;
}

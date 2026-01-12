import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmailNotification } from './channels/email';
import { sendTelegramNotification } from './channels/telegram';
import { sendSlackNotification } from './channels/slack';
import { sendDiscordNotification } from './channels/discord';
import { sendWebhookNotification } from './channels/webhook';
import type { AlertChannelType } from '@/types/database';

export interface NotificationPayload {
  tenantId: string;
  alertId: string;
  type: 'site_down' | 'site_up' | 'ssl_expiring' | 'ssl_expired' | 'ssl_invalid';
  severity: 'info' | 'warning' | 'critical';
  site: {
    id: string;
    name: string;
    url: string;
  };
  title: string;
  message: string;
  details?: Record<string, unknown>;
}

interface ChannelConfig {
  id: string;
  type: AlertChannelType;
  name: string;
  config: Record<string, unknown>;
}

interface NotificationResult {
  channelId: string;
  channelType: AlertChannelType;
  success: boolean;
  error?: string;
}

/**
 * Dispatch notification to all active channels for a tenant
 */
export async function dispatchNotification(
  payload: NotificationPayload
): Promise<NotificationResult[]> {
  const supabase = createAdminClient();
  const results: NotificationResult[] = [];

  try {
    // Fetch all active channels for the tenant
    const { data: channels, error } = await supabase
      .from('alert_channels')
      .select('id, type, name, config')
      .eq('tenant_id', payload.tenantId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching alert channels:', error);
      return results;
    }

    if (!channels || channels.length === 0) {
      console.log(`No active channels for tenant ${payload.tenantId}`);
      return results;
    }

    // Send to each channel
    const notificationPromises = channels.map(async (channel: ChannelConfig) => {
      try {
        let success = false;

        switch (channel.type) {
          case 'email':
            success = await sendEmailNotification(payload, channel.config);
            break;
          case 'telegram':
            success = await sendTelegramNotification(payload, channel.config);
            break;
          case 'slack':
            success = await sendSlackNotification(payload, channel.config);
            break;
          case 'discord':
            success = await sendDiscordNotification(payload, channel.config);
            break;
          case 'webhook':
            success = await sendWebhookNotification(payload, channel.config);
            break;
          default:
            console.warn(`Unknown channel type: ${channel.type}`);
        }

        return {
          channelId: channel.id,
          channelType: channel.type,
          success,
        };
      } catch (err) {
        console.error(`Error sending to channel ${channel.name}:`, err);
        return {
          channelId: channel.id,
          channelType: channel.type,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    });

    const notificationResults = await Promise.all(notificationPromises);
    results.push(...notificationResults);

    // Update alert with notified channels
    const notifiedChannels = results
      .filter((r) => r.success)
      .map((r) => r.channelType);

    if (notifiedChannels.length > 0) {
      await supabase
        .from('alerts')
        .update({ channels_notified: notifiedChannels })
        .eq('id', payload.alertId);
    }

    return results;
  } catch (err) {
    console.error('Error in dispatchNotification:', err);
    return results;
  }
}

/**
 * Get severity color for visual indicators
 */
export function getSeverityColor(severity: 'info' | 'warning' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return '#dc2626'; // red
    case 'warning':
      return '#f59e0b'; // amber
    case 'info':
    default:
      return '#3b82f6'; // blue
  }
}

/**
 * Get severity emoji for text notifications
 */
export function getSeverityEmoji(severity: 'info' | 'warning' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return '🔴';
    case 'warning':
      return '🟡';
    case 'info':
    default:
      return '🔵';
  }
}

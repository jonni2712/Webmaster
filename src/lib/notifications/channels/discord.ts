import { getSeverityColor, getSeverityEmoji } from '../dispatcher';
import type { NotificationPayload } from '../dispatcher';

interface DiscordConfig {
  webhook_url?: string;
}

/**
 * Send Discord notification via webhook
 */
export async function sendDiscordNotification(
  payload: NotificationPayload,
  config: Record<string, unknown>
): Promise<boolean> {
  const discordConfig = config as DiscordConfig;
  const webhookUrl = discordConfig.webhook_url;

  if (!webhookUrl) {
    console.warn('Discord webhook_url not configured');
    return false;
  }

  try {
    const color = parseInt(getSeverityColor(payload.severity).replace('#', ''), 16);
    const emoji = getSeverityEmoji(payload.severity);

    // Build Discord embed message
    const discordMessage = {
      embeds: [
        {
          title: `${emoji} ${payload.title}`,
          description: payload.message,
          color,
          fields: [
            {
              name: 'Sito',
              value: `[${payload.site.name}](${payload.site.url})`,
              inline: true,
            },
            {
              name: 'Severita\'',
              value: payload.severity.toUpperCase(),
              inline: true,
            },
            {
              name: 'Tipo',
              value: formatAlertType(payload.type),
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Webmaster Monitor',
          },
        },
      ],
    };

    // Add error details if present
    if (payload.details?.errorMessage) {
      discordMessage.embeds[0].fields.push({
        name: 'Dettagli Errore',
        value: `\`${payload.details.errorMessage}\``,
        inline: false,
      });
    }

    // Add SSL expiry info if present
    if (payload.details?.daysUntilExpiry !== undefined) {
      discordMessage.embeds[0].fields.push({
        name: 'Giorni alla Scadenza',
        value: String(payload.details.daysUntilExpiry),
        inline: true,
      });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordMessage),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord webhook error:', errorText);
      return false;
    }

    console.log('Discord notification sent successfully');
    return true;
  } catch (err) {
    console.error('Error sending Discord notification:', err);
    return false;
  }
}

function formatAlertType(type: string): string {
  const typeMap: Record<string, string> = {
    site_down: 'Sito Offline',
    site_up: 'Sito Online',
    ssl_expiring: 'SSL in Scadenza',
    ssl_expired: 'SSL Scaduto',
    ssl_invalid: 'SSL Non Valido',
  };
  return typeMap[type] || type;
}

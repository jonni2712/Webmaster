import { getSeverityColor, getSeverityEmoji } from '../dispatcher';
import type { NotificationPayload } from '../dispatcher';

interface SlackConfig {
  webhook_url?: string;
}

/**
 * Send Slack notification via webhook
 */
export async function sendSlackNotification(
  payload: NotificationPayload,
  config: Record<string, unknown>
): Promise<boolean> {
  const slackConfig = config as SlackConfig;
  const webhookUrl = slackConfig.webhook_url;

  if (!webhookUrl) {
    console.warn('Slack webhook_url not configured');
    return false;
  }

  try {
    const color = getSeverityColor(payload.severity);
    const emoji = getSeverityEmoji(payload.severity);

    // Build Slack Block Kit message
    const slackMessage = {
      attachments: [
        {
          color,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${emoji} ${payload.title}`,
                emoji: true,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: payload.message,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Sito:*\n<${payload.site.url}|${payload.site.name}>`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Severita':*\n${payload.severity.toUpperCase()}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Tipo:*\n${formatAlertType(payload.type)}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Ora:*\n${new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}`,
                },
              ],
            },
          ],
        },
      ],
    };

    // Add details if present
    if (payload.details?.errorMessage) {
      slackMessage.attachments[0].blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Dettagli errore:*\n\`${payload.details.errorMessage}\``,
        },
      } as any);
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Slack webhook error:', errorText);
      return false;
    }

    console.log('Slack notification sent successfully');
    return true;
  } catch (err) {
    console.error('Error sending Slack notification:', err);
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

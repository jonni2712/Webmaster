import { getSeverityEmoji } from '../dispatcher';
import type { NotificationPayload } from '../dispatcher';

interface TelegramConfig {
  bot_token?: string;
  chat_id?: string;
}

/**
 * Send Telegram notification
 */
export async function sendTelegramNotification(
  payload: NotificationPayload,
  config: Record<string, unknown>
): Promise<boolean> {
  const telegramConfig = config as TelegramConfig;
  const botToken = telegramConfig.bot_token;
  const chatId = telegramConfig.chat_id;

  if (!botToken || !chatId) {
    console.warn('Telegram bot_token or chat_id not configured');
    return false;
  }

  try {
    const emoji = getSeverityEmoji(payload.severity);

    // Build message with Markdown formatting
    let message = `${emoji} *${escapeMarkdown(payload.title)}*\n\n`;
    message += `${escapeMarkdown(payload.message)}\n\n`;
    message += `🌐 *Sito:* [${escapeMarkdown(payload.site.name)}](${payload.site.url})\n`;
    message += `⏰ *Ora:* ${new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}`;

    if (payload.details) {
      if (payload.details.errorMessage) {
        message += `\n❌ *Errore:* ${escapeMarkdown(String(payload.details.errorMessage))}`;
      }
      if (payload.details.daysUntilExpiry !== undefined) {
        message += `\n📅 *Giorni alla scadenza:* ${payload.details.daysUntilExpiry}`;
      }
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Telegram API error:', errorData);
      return false;
    }

    console.log(`Telegram notification sent to chat ${chatId}`);
    return true;
  } catch (err) {
    console.error('Error sending Telegram notification:', err);
    return false;
  }
}

/**
 * Escape special characters for Telegram Markdown
 */
function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

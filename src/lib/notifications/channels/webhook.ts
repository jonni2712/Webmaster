import type { NotificationPayload } from '../dispatcher';

interface WebhookConfig {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  include_details?: boolean;
}

/**
 * Send notification via custom webhook
 */
export async function sendWebhookNotification(
  payload: NotificationPayload,
  config: Record<string, unknown>
): Promise<boolean> {
  const webhookConfig = config as WebhookConfig;
  const url = webhookConfig.url;

  if (!url) {
    console.warn('Webhook url not configured');
    return false;
  }

  try {
    const method = webhookConfig.method || 'POST';
    const customHeaders = webhookConfig.headers || {};

    // Build webhook payload
    const webhookPayload = {
      event: payload.type,
      severity: payload.severity,
      alert_id: payload.alertId,
      tenant_id: payload.tenantId,
      site: {
        id: payload.site.id,
        name: payload.site.name,
        url: payload.site.url,
      },
      title: payload.title,
      message: payload.message,
      timestamp: new Date().toISOString(),
      ...(webhookConfig.include_details !== false && payload.details
        ? { details: payload.details }
        : {}),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'WebmasterMonitor/1.0',
      ...customHeaders,
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Add body for POST/PUT requests
    if (method !== 'GET') {
      fetchOptions.body = JSON.stringify(webhookPayload);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Webhook error (${response.status}):`, errorText);
      return false;
    }

    console.log(`Webhook notification sent to ${url}`);
    return true;
  } catch (err) {
    console.error('Error sending webhook notification:', err);
    return false;
  }
}

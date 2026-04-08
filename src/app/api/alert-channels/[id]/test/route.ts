import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmailNotification } from '@/lib/notifications/channels/email';
import { sendTelegramNotification } from '@/lib/notifications/channels/telegram';
import { sendSlackNotification } from '@/lib/notifications/channels/slack';
import { sendDiscordNotification } from '@/lib/notifications/channels/discord';
import { sendWebhookNotification } from '@/lib/notifications/channels/webhook';
import type { NotificationPayload } from '@/lib/notifications/dispatcher';
import type { AlertChannelType } from '@/types/database';
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from '@/lib/rate-limit';

/**
 * POST /api/alert-channels/[id]/test
 *
 * Sends a fake "test" alert through the given channel so that users
 * can verify their Slack/Telegram/webhook/etc. configuration before
 * a real incident fires.
 *
 * Security:
 *   - Requires authenticated session
 *   - Verifies the channel belongs to the user's current tenant
 *   - Rate limited: 5 tests per user per 10 minutes (prevents abuse
 *     of user-supplied webhooks as an outbound-request oracle)
 */

export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: channelId } = await params;

  // Rate limit per user (5 tests per 10 minutes). Prevents a compromised
  // session from using the test button as a spam relay via webhooks.
  const rl = await checkRateLimit({
    name: 'test_notification',
    identifier: `user:${session.user.id}`,
    max: 5,
    windowSeconds: 600,
  });
  if (!rl.allowed) return rateLimitResponse(rl);

  // Also per-IP belt-and-braces.
  const ip = getClientIp(request);
  const ipLimit = await checkRateLimit({
    name: 'test_notification_ip',
    identifier: `ip:${ip}`,
    max: 15,
    windowSeconds: 600,
  });
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit);

  const supabase = createAdminClient();

  // Look up the user's tenant scope.
  const { data: user } = await supabase
    .from('users')
    .select('current_tenant_id')
    .eq('id', session.user.id)
    .single();

  if (!user?.current_tenant_id) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // Fetch the channel AND verify tenant ownership in one query.
  const { data: channel, error: channelError } = await supabase
    .from('alert_channels')
    .select('id, type, name, config, is_active, tenant_id')
    .eq('id', channelId)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (channelError || !channel) {
    return NextResponse.json(
      { error: 'Canale di notifica non trovato' },
      { status: 404 }
    );
  }

  // Build a fake notification payload that visibly says "TEST" so no
  // one confuses it with a real incident.
  const testPayload: NotificationPayload = {
    tenantId: user.current_tenant_id,
    alertId: `test-${Date.now()}`,
    type: 'site_down',
    severity: 'info',
    site: {
      id: 'test-site',
      name: '[TEST] Webmaster Monitor',
      url: 'https://webmaster-monitor.it',
    },
    title: '[TEST] Notifica di prova',
    message:
      `Questa è una notifica di test inviata dal canale "${channel.name}" per verificare la configurazione. Se la stai leggendo, il canale funziona correttamente.`,
    details: {
      test: true,
      triggered_by: session.user.email || session.user.id,
      triggered_at: new Date().toISOString(),
    },
  };

  // Dispatch to the specific channel.
  let success = false;
  let error: string | undefined;

  try {
    const channelType = channel.type as AlertChannelType;
    const channelConfig = channel.config as Record<string, unknown>;

    switch (channelType) {
      case 'email':
        success = await sendEmailNotification(testPayload, channelConfig);
        break;
      case 'telegram':
        success = await sendTelegramNotification(testPayload, channelConfig);
        break;
      case 'slack':
        success = await sendSlackNotification(testPayload, channelConfig);
        break;
      case 'discord':
        success = await sendDiscordNotification(testPayload, channelConfig);
        break;
      case 'webhook':
        success = await sendWebhookNotification(testPayload, channelConfig);
        break;
      default:
        error = `Tipo di canale non supportato: ${channelType}`;
    }
  } catch (err) {
    console.error(`[test-notification] Channel ${channel.name} dispatch failed:`, err);
    error = err instanceof Error ? err.message : 'Errore sconosciuto';
  }

  if (!success) {
    return NextResponse.json(
      {
        success: false,
        channel: { id: channel.id, name: channel.name, type: channel.type },
        error: error || 'Invio fallito (controllare la configurazione)',
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    channel: { id: channel.id, name: channel.name, type: channel.type },
    message: 'Notifica di test inviata correttamente',
  });
}

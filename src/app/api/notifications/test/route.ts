import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { dispatchNotification, type NotificationPayload } from '@/lib/notifications/dispatcher';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { channelId } = body;

    const supabase = createAdminClient();

    // Get user's current tenant
    const { data: user } = await supabase
      .from('users')
      .select('current_tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.current_tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // If channelId provided, test only that channel
    // Otherwise test all active channels
    let channelsToTest;

    if (channelId) {
      const { data: channel, error } = await supabase
        .from('alert_channels')
        .select('*')
        .eq('id', channelId)
        .eq('tenant_id', user.current_tenant_id)
        .single();

      if (error || !channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
      }
      channelsToTest = [channel];
    } else {
      const { data: channels } = await supabase
        .from('alert_channels')
        .select('*')
        .eq('tenant_id', user.current_tenant_id)
        .eq('is_active', true);

      channelsToTest = channels || [];
    }

    if (channelsToTest.length === 0) {
      return NextResponse.json({
        error: 'Nessun canale attivo trovato',
        tested: 0
      }, { status: 400 });
    }

    // Create a test alert in the database
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .insert({
        tenant_id: user.current_tenant_id,
        site_id: null,
        trigger_type: 'site_down',
        severity: 'info',
        title: 'Test notifica',
        message: 'Questa e\' una notifica di test dal sistema Webmaster Monitor.',
        details: { test: true },
        status: 'resolved', // Auto-resolve test alerts
        resolved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (alertError) {
      console.error('Error creating test alert:', alertError);
      return NextResponse.json({ error: 'Error creating test alert' }, { status: 500 });
    }

    // Send test notification
    const testPayload: NotificationPayload = {
      tenantId: user.current_tenant_id,
      alertId: alert.id,
      type: 'site_down',
      severity: 'info',
      site: {
        id: 'test-site',
        name: 'Sito di Test',
        url: 'https://esempio.com',
      },
      title: 'Test notifica - Webmaster Monitor',
      message: 'Questa e\' una notifica di test. Se la ricevi, il canale e\' configurato correttamente!',
      details: { test: true },
    };

    const results = await dispatchNotification(testPayload);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: successful > 0,
      tested: results.length,
      successful,
      failed,
      results: results.map(r => ({
        channelType: r.channelType,
        success: r.success,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      { error: 'Errore durante il test della notifica' },
      { status: 500 }
    );
  }
}

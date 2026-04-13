import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { assertCanUseChannel, PlanLimitError } from '@/lib/billing/limits';

const channelSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['email', 'slack', 'telegram', 'discord', 'webhook']),
  config: z.record(z.string(), z.string()),
  enabled: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  const { data: channels, error } = await supabase
    .from('alert_channels')
    .select('*')
    .eq('tenant_id', user.current_tenant_id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ channels });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = channelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get user's current tenant and check permission
    const { data: user } = await supabase
      .from('users')
      .select('current_tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.current_tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('user_tenants')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Non hai i permessi per creare canali' },
        { status: 403 }
      );
    }

    // Enforce notification channel plan restriction.
    const channelType = validation.data.type;
    try {
      await assertCanUseChannel(user.current_tenant_id, channelType);
    } catch (err) {
      if (err instanceof PlanLimitError) {
        return NextResponse.json(
          { error: `Il canale ${channelType} non e' disponibile con il tuo piano. Effettua l'upgrade.` },
          { status: 403 }
        );
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('alert_channels')
      .insert({
        ...validation.data,
        tenant_id: user.current_tenant_id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/alert-channels error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

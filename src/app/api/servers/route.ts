import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity/logger';
import { z } from 'zod';

const serverSchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  provider: z.string().optional().nullable(),
  hostname: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeStats = searchParams.get('stats') === 'true';

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

  if (includeStats) {
    // Use the server_stats view
    const { data, error } = await supabase
      .from('server_stats')
      .select('*')
      .eq('tenant_id', user.current_tenant_id)
      .order('server_name');

    if (error) {
      console.error('Error fetching server stats:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ servers: data || [] });
  }

  // Simple query without stats
  const { data, error } = await supabase
    .from('servers')
    .select('*')
    .eq('tenant_id', user.current_tenant_id)
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ servers: data || [] });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = serverSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.flatten() },
        { status: 400 }
      );
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

    // Check user role
    const { data: membership } = await supabase
      .from('user_tenants')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Non hai i permessi per creare server' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('servers')
      .insert({
        ...validation.data,
        tenant_id: user.current_tenant_id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Un server con questo nome esiste gia' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await logActivity({
      tenantId: user.current_tenant_id,
      userId: session.user.id,
      actionType: 'settings_updated',
      resourceType: 'server',
      resourceId: data.id,
      resourceName: data.name,
      metadata: { action: 'created' },
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/servers error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

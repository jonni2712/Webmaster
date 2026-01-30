import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity/logger';
import { z } from 'zod';

const updateServerSchema = z.object({
  name: z.string().min(1).optional(),
  provider: z.string().optional().nullable(),
  hostname: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
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

  const { data: server, error } = await supabase
    .from('servers')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (error || !server) {
    return NextResponse.json({ error: 'Server not found' }, { status: 404 });
  }

  // Get sites count for this server
  const { count } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true })
    .eq('server_id', id);

  return NextResponse.json({ ...server, sites_count: count || 0 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = updateServerSchema.safeParse(body);

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
        { error: 'Non hai i permessi per modificare questo server' },
        { status: 403 }
      );
    }

    // Verify server belongs to tenant
    const { data: existingServer } = await supabase
      .from('servers')
      .select('id, name')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!existingServer) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('servers')
      .update(validation.data)
      .eq('id', id)
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
      metadata: { action: 'updated' },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('PUT /api/servers/[id] error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
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

  // Check user role - only owner can delete
  const { data: membership } = await supabase
    .from('user_tenants')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (!membership || membership.role !== 'owner') {
    return NextResponse.json(
      { error: 'Solo il proprietario puo eliminare i server' },
      { status: 403 }
    );
  }

  // Verify server belongs to tenant and get name for logging
  const { data: existingServer } = await supabase
    .from('servers')
    .select('id, name')
    .eq('id', id)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (!existingServer) {
    return NextResponse.json({ error: 'Server not found' }, { status: 404 });
  }

  // Check if server has sites (optional: you might want to prevent deletion)
  const { count } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true })
    .eq('server_id', id);

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Impossibile eliminare: ${count} siti associati a questo server. Riassegna prima i siti.` },
      { status: 400 }
    );
  }

  const serverName = existingServer.name;

  const { error } = await supabase.from('servers').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  await logActivity({
    tenantId: user.current_tenant_id,
    userId: session.user.id,
    actionType: 'settings_updated',
    resourceType: 'server',
    resourceId: id,
    resourceName: serverName,
    metadata: { action: 'deleted' },
  });

  return NextResponse.json({ success: true });
}

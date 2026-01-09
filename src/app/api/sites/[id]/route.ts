import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const updateSiteSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  platform: z.enum(['wordpress', 'prestashop', 'other']).optional(),
  api_key: z.string().optional(),
  api_secret: z.string().optional(),
  ssl_check_enabled: z.boolean().optional(),
  uptime_check_enabled: z.boolean().optional(),
  performance_check_enabled: z.boolean().optional(),
  updates_check_enabled: z.boolean().optional(),
  ecommerce_check_enabled: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
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

  const { data: site, error } = await supabase
    .from('site_status_summary')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (error || !site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  return NextResponse.json(site);
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
    const validation = updateSiteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get user's current tenant and verify permission
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
        { error: 'Non hai i permessi per modificare questo sito' },
        { status: 403 }
      );
    }

    // Verify site belongs to tenant
    const { data: existingSite } = await supabase
      .from('sites')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!existingSite) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const { api_key, api_secret, ...updateData } = validation.data;

    const updatePayload: Record<string, unknown> = { ...updateData };
    if (api_key !== undefined) {
      updatePayload.api_key_encrypted = api_key || null;
    }
    if (api_secret !== undefined) {
      updatePayload.api_secret_encrypted = api_secret || null;
    }

    const { data, error } = await supabase
      .from('sites')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('PUT /api/sites/[id] error:', error);
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
      { error: 'Solo il proprietario puo eliminare i siti' },
      { status: 403 }
    );
  }

  // Verify site belongs to tenant
  const { data: existingSite } = await supabase
    .from('sites')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (!existingSite) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  const { error } = await supabase.from('sites').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

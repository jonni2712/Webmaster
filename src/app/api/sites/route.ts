import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const siteSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  platform: z.enum(['wordpress', 'prestashop', 'other']),
  api_key: z.string().optional(),
  api_secret: z.string().optional(),
  ssl_check_enabled: z.boolean().optional().default(true),
  uptime_check_enabled: z.boolean().optional().default(true),
  performance_check_enabled: z.boolean().optional().default(true),
  updates_check_enabled: z.boolean().optional().default(true),
  ecommerce_check_enabled: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const platform = searchParams.get('platform');
  const search = searchParams.get('search');

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

  let query = supabase
    .from('site_status_summary')
    .select('*', { count: 'exact' })
    .eq('tenant_id', user.current_tenant_id);

  if (platform) {
    query = query.eq('platform', platform);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,url.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order('name')
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    sites: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = siteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get user's current tenant and verify they have permission
    const { data: userTenant } = await supabase
      .from('users')
      .select(`
        current_tenant_id,
        user_tenants!inner(role)
      `)
      .eq('id', session.user.id)
      .eq('user_tenants.tenant_id', supabase.rpc('current_tenant_id'))
      .single();

    // Fallback: get tenant directly
    const { data: user } = await supabase
      .from('users')
      .select('current_tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.current_tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check user role in tenant
    const { data: membership } = await supabase
      .from('user_tenants')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Non hai i permessi per aggiungere siti' },
        { status: 403 }
      );
    }

    // TODO: Encrypt API keys before storing
    const { api_key, api_secret, ...siteData } = validation.data;

    const { data, error } = await supabase
      .from('sites')
      .insert({
        ...siteData,
        tenant_id: user.current_tenant_id,
        api_key_encrypted: api_key || null,
        api_secret_encrypted: api_secret || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Un sito con questo URL esiste gia' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/sites error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

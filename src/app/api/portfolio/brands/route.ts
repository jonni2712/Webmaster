import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

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

  try {
    // Get all brands with client info
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select(`
        *,
        clients(name)
      `)
      .eq('tenant_id', user.current_tenant_id)
      .order('name');

    if (brandsError) {
      return NextResponse.json({ error: brandsError.message }, { status: 500 });
    }

    // Get all domains
    const { data: domains, error: domainsError } = await supabase
      .from('sites')
      .select(`
        id,
        name,
        url,
        lifecycle_status,
        is_redirect_source,
        redirect_url,
        redirect_type,
        brand_id,
        is_primary_for_brand
      `)
      .eq('tenant_id', user.current_tenant_id)
      .is('parent_site_id', null)
      .order('name');

    if (domainsError) {
      return NextResponse.json({ error: domainsError.message }, { status: 500 });
    }

    // Get clients for dropdown
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .eq('tenant_id', user.current_tenant_id)
      .eq('is_active', true)
      .order('name');

    // Build brands with domains
    const brandsWithDomains = (brands || []).map(brand => ({
      ...brand,
      client_name: brand.clients?.name || null,
      domains: (domains || []).filter(d => d.brand_id === brand.id),
      primaryDomain: (domains || []).find(d => d.brand_id === brand.id && d.is_primary_for_brand) || null,
    }));

    // Unassigned domains
    const unassigned = (domains || []).filter(d => !d.brand_id);

    return NextResponse.json({
      brands: brandsWithDomains,
      unassigned,
      clients: clients || [],
    });

  } catch (error) {
    console.error('GET /api/portfolio/brands error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json();
    const { name, description, client_id } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome richiesto' }, { status: 400 });
    }

    const { data: brand, error } = await supabase
      .from('brands')
      .insert({
        tenant_id: user.current_tenant_id,
        name: name.trim(),
        description: description || null,
        client_id: client_id || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Un brand con questo nome esiste già' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, brand });

  } catch (error) {
    console.error('POST /api/portfolio/brands error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

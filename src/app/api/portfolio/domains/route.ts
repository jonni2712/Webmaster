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
    // Get all domains with server and brand info
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select(`
        id,
        name,
        url,
        platform,
        lifecycle_status,
        server_id,
        domain_expires_at,
        domain_registrar,
        domain_notes,
        tags,
        created_at,
        updated_at,
        is_redirect_source,
        redirect_url,
        redirect_type,
        brand_id,
        is_primary_for_brand,
        domain_relation,
        weglot_language_code,
        parent_site_id,
        http_status_code,
        detected_redirect_url,
        detected_redirect_chain,
        is_parking_page,
        parking_page_type,
        last_http_check,
        http_check_error,
        ssl_valid,
        ssl_error,
        dns_resolves
      `)
      .eq('tenant_id', user.current_tenant_id)
      .order('name', { ascending: true });

    if (sitesError) {
      return NextResponse.json({ error: sitesError.message }, { status: 500 });
    }

    // Get servers for mapping
    const { data: servers, error: serversError } = await supabase
      .from('servers')
      .select('id, name')
      .eq('tenant_id', user.current_tenant_id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (serversError) {
      return NextResponse.json({ error: serversError.message }, { status: 500 });
    }

    // Get brands for mapping and dropdown
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name')
      .eq('tenant_id', user.current_tenant_id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (brandsError) {
      return NextResponse.json({ error: brandsError.message }, { status: 500 });
    }

    // Create lookup maps
    const serverMap = new Map(servers?.map(s => [s.id, s.name]) || []);
    const brandMap = new Map(brands?.map(b => [b.id, b.name]) || []);

    // Enrich sites with server and brand names
    const domainsWithInfo = (sites || []).map(site => ({
      ...site,
      server_name: site.server_id ? serverMap.get(site.server_id) || null : null,
      brand_name: site.brand_id ? brandMap.get(site.brand_id) || null : null,
    }));

    return NextResponse.json({
      domains: domainsWithInfo,
      servers: servers || [],
      brands: brands || [],
      total: domainsWithInfo.length,
    });

  } catch (error) {
    console.error('GET /api/portfolio/domains error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

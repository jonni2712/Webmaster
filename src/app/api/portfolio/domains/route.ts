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
    // Get all domains with server info
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
        redirect_type
      `)
      .eq('tenant_id', user.current_tenant_id)
      .is('parent_site_id', null) // Exclude subsites
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

    // Create server lookup map
    const serverMap = new Map(servers?.map(s => [s.id, s.name]) || []);

    // Enrich sites with server names
    const domainsWithServer = (sites || []).map(site => ({
      ...site,
      server_name: site.server_id ? serverMap.get(site.server_id) || null : null,
    }));

    return NextResponse.json({
      domains: domainsWithServer,
      servers: servers || [],
      total: domainsWithServer.length,
    });

  } catch (error) {
    console.error('GET /api/portfolio/domains error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

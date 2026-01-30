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
    // Get redirect chains from view
    const { data: redirectChains, error: chainsError } = await supabase
      .from('redirect_chains')
      .select('*')
      .eq('tenant_id', user.current_tenant_id)
      .order('source_name');

    if (chainsError) {
      console.error('Error fetching redirect chains:', chainsError);
      return NextResponse.json({ error: chainsError.message }, { status: 500 });
    }

    // Get all redirect sources with their targets for a simple list view
    const { data: redirectSites, error: sitesError } = await supabase
      .from('sites')
      .select(`
        id,
        name,
        url,
        redirect_to_site_id,
        redirect_type,
        is_redirect_source,
        lifecycle_status
      `)
      .eq('tenant_id', user.current_tenant_id)
      .eq('is_redirect_source', true)
      .order('name');

    if (sitesError) {
      console.error('Error fetching redirect sites:', sitesError);
    }

    // For each redirect site, get the target info
    const redirectsWithTargets = await Promise.all(
      (redirectSites || []).map(async (site) => {
        if (!site.redirect_to_site_id) {
          return { ...site, target: null };
        }

        const { data: target } = await supabase
          .from('sites')
          .select('id, name, url')
          .eq('id', site.redirect_to_site_id)
          .single();

        return { ...site, target };
      })
    );

    // Check for circular redirects
    const circularRedirects = (redirectChains || []).filter(chain => chain.is_circular);

    return NextResponse.json({
      chains: redirectChains || [],
      redirects: redirectsWithTargets,
      circularCount: circularRedirects.length,
      hasCircular: circularRedirects.length > 0,
    });
  } catch (error) {
    console.error('GET /api/portfolio/redirects error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

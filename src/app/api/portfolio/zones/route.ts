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
    // Get all domains
    const { data: domains, error } = await supabase
      .from('sites')
      .select(`
        id,
        name,
        url,
        lifecycle_status,
        is_redirect_source,
        redirect_url,
        redirect_type,
        primary_domain_id,
        zone_name
      `)
      .eq('tenant_id', user.current_tenant_id)
      .is('parent_site_id', null)
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build zones structure
    const primaryDomains = (domains || []).filter(d =>
      !d.primary_domain_id &&
      (domains || []).some(other => other.primary_domain_id === d.id)
    );

    // Also include domains that have zone_name set (they're zone primaries even without secondaries)
    const zonesWithNames = (domains || []).filter(d =>
      d.zone_name && !d.primary_domain_id
    );

    // Merge unique primaries
    const allPrimaries = [...primaryDomains];
    for (const z of zonesWithNames) {
      if (!allPrimaries.find(p => p.id === z.id)) {
        allPrimaries.push(z);
      }
    }

    const zones = allPrimaries.map(primary => ({
      primary,
      secondaryDomains: (domains || []).filter(d => d.primary_domain_id === primary.id),
    }));

    // Unassigned domains (not a primary and not assigned to any zone)
    const assignedIds = new Set([
      ...allPrimaries.map(p => p.id),
      ...(domains || []).filter(d => d.primary_domain_id).map(d => d.id),
    ]);

    const unassigned = (domains || []).filter(d => !assignedIds.has(d.id));

    return NextResponse.json({
      domains: domains || [],
      zones,
      unassigned,
    });

  } catch (error) {
    console.error('GET /api/portfolio/zones error:', error);
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
    const { primaryDomainId, zoneName } = body;

    if (!primaryDomainId) {
      return NextResponse.json({ error: 'primaryDomainId richiesto' }, { status: 400 });
    }

    // Set zone_name on primary domain
    const { error } = await supabase
      .from('sites')
      .update({ zone_name: zoneName || null })
      .eq('id', primaryDomainId)
      .eq('tenant_id', user.current_tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('POST /api/portfolio/zones error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

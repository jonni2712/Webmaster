import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

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
    .from('alerts')
    .select(`
      id, tenant_id, site_id, trigger_type, severity, status, title, message, created_at, resolved_at,
      site:sites(id, name, url)
    `, { count: 'exact' })
    .eq('tenant_id', user.current_tenant_id);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (type && type !== 'all') {
    query = query.eq('trigger_type', type);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get unique site IDs from alerts
  const siteIds = [...new Set((data || []).filter(a => a.site_id).map(a => a.site_id))];

  // Fetch update counts for all sites in one query
  const { data: updateCounts } = await supabase
    .from('wp_updates')
    .select('site_id, is_critical')
    .in('site_id', siteIds)
    .eq('status', 'available');

  // Group update counts by site_id
  const updatesBySite = new Map<string, { total: number; critical: number }>();
  for (const update of updateCounts || []) {
    const current = updatesBySite.get(update.site_id) || { total: 0, critical: 0 };
    current.total++;
    if (update.is_critical) current.critical++;
    updatesBySite.set(update.site_id, current);
  }

  // Transform data to include site info and update counts
  const alerts = (data || []).map((alert) => {
    const siteUpdates = alert.site_id ? updatesBySite.get(alert.site_id) : null;
    return {
      ...alert,
      site_name: (alert.site as { name: string; url: string } | null)?.name,
      site_url: (alert.site as { name: string; url: string } | null)?.url,
      pending_updates: siteUpdates?.total || 0,
      critical_updates: siteUpdates?.critical || 0,
    };
  });

  return NextResponse.json({
    alerts,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

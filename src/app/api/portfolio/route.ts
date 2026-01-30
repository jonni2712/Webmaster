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
    // Get portfolio summary from view
    const { data: summary, error: summaryError } = await supabase
      .from('domain_portfolio_summary')
      .select('*')
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (summaryError && summaryError.code !== 'PGRST116') {
      console.error('Error fetching portfolio summary:', summaryError);
    }

    // Get server stats
    const { data: serverStats, error: serverError } = await supabase
      .from('server_stats')
      .select('*')
      .eq('tenant_id', user.current_tenant_id)
      .order('sites_count', { ascending: false });

    if (serverError) {
      console.error('Error fetching server stats:', serverError);
    }

    // Get expiring domains
    const { data: expiringDomains, error: expiringError } = await supabase
      .from('expiring_domains')
      .select('*')
      .eq('tenant_id', user.current_tenant_id)
      .order('domain_expires_at')
      .limit(10);

    if (expiringError) {
      console.error('Error fetching expiring domains:', expiringError);
    }

    // Get lifecycle status distribution
    const { data: statusDistribution, error: statusError } = await supabase
      .from('sites')
      .select('lifecycle_status')
      .eq('tenant_id', user.current_tenant_id)
      .is('parent_site_id', null);

    if (statusError) {
      console.error('Error fetching status distribution:', statusError);
    }

    // Count by status
    const statusCounts: Record<string, number> = {};
    if (statusDistribution) {
      for (const site of statusDistribution) {
        const status = site.lifecycle_status || 'active';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    }

    // Get sites without server
    const { data: unassignedSites, error: unassignedError } = await supabase
      .from('sites')
      .select('id, name, url, lifecycle_status')
      .eq('tenant_id', user.current_tenant_id)
      .is('server_id', null)
      .is('parent_site_id', null)
      .limit(20);

    if (unassignedError) {
      console.error('Error fetching unassigned sites:', unassignedError);
    }

    return NextResponse.json({
      summary: summary || {
        total_domains: 0,
        active_domains: 0,
        inactive_domains: 0,
        status_active: 0,
        status_to_update: 0,
        status_to_rebuild: 0,
        status_in_maintenance: 0,
        status_in_progress: 0,
        status_to_delete: 0,
        status_redirect_only: 0,
        status_archived: 0,
        redirect_sources: 0,
        has_redirect_target: 0,
        domains_with_expiry: 0,
        expiring_30_days: 0,
        expiring_7_days: 0,
        expired: 0,
        domains_with_server: 0,
        domains_without_server: 0,
      },
      serverStats: serverStats || [],
      expiringDomains: expiringDomains || [],
      statusDistribution: statusCounts,
      unassignedSites: unassignedSites || [],
    });
  } catch (error) {
    console.error('GET /api/portfolio error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

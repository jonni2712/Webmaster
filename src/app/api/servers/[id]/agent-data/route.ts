import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  // Get user's current tenant (consistent with existing route pattern)
  const { data: user } = await supabase
    .from('users')
    .select('current_tenant_id')
    .eq('id', session.user.id)
    .single();

  if (!user?.current_tenant_id) {
    return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 });
  }

  // Verify server belongs to tenant
  const { data: server, error: serverError } = await supabase
    .from('servers')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (serverError || !server) {
    return NextResponse.json({ ok: false, error: 'Server not found' }, { status: 404 });
  }

  // Fetch all agent data in parallel
  const [accounts, dnsZones, sslCerts, pendingImports, resourceSnapshots, serverErrors, serverBackups] = await Promise.all([
    supabase
      .from('server_accounts')
      .select('*')
      .eq('server_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .order('main_domain'),
    supabase
      .from('server_dns_zones')
      .select('*')
      .eq('server_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .order('domain'),
    supabase
      .from('server_ssl_certs')
      .select('*')
      .eq('server_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .order('domain'),
    supabase
      .from('pending_site_imports')
      .select('*')
      .eq('server_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .eq('status', 'pending')
      .order('discovered_at', { ascending: false }),
    // Resource snapshots (last 24h)
    supabase
      .from('server_resource_snapshots')
      .select('*')
      .eq('server_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: true }),
    // Unresolved errors
    supabase
      .from('server_errors')
      .select('*')
      .eq('server_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .eq('resolved', false)
      .order('last_seen_at', { ascending: false })
      .limit(100),
    // Recent backups
    supabase
      .from('server_backups')
      .select('*')
      .eq('server_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .order('backup_date', { ascending: false })
      .limit(50),
  ]);

  // Fetch CMS detections, emails, and databases for each account (second parallel batch)
  const accountIds = (accounts.data || []).map((a: { id: string }) => a.id);
  const tenantId = user.current_tenant_id;
  const accountFilter = accountIds.length > 0 ? accountIds : ['none'];

  const [{ data: cmsDetections }, emailsResult, databasesResult] = await Promise.all([
    accountIds.length > 0
      ? supabase
          .from('server_cms_detections')
          .select('*')
          .in('server_account_id', accountIds)
          .eq('tenant_id', tenantId)
      : Promise.resolve({ data: [] }),
    // Emails
    supabase
      .from('server_emails')
      .select('*')
      .in('server_account_id', accountFilter)
      .eq('tenant_id', tenantId),
    // Databases
    supabase
      .from('server_databases')
      .select('*')
      .in('server_account_id', accountFilter)
      .eq('tenant_id', tenantId),
  ]);

  return NextResponse.json({
    ok: true,
    server,
    accounts: accounts.data || [],
    cms_detections: cmsDetections || [],
    dns_zones: dnsZones.data || [],
    ssl_certs: sslCerts.data || [],
    pending_imports: pendingImports.data || [],
    resource_snapshots: resourceSnapshots.data || [],
    errors: serverErrors.data || [],
    backups: serverBackups.data || [],
    emails: emailsResult.data || [],
    databases: databasesResult.data || [],
    stats: {
      total_accounts: accounts.data?.length || 0,
      total_domains: (accounts.data || []).reduce(
        (sum: number, a: { addon_domains?: string[]; subdomains?: string[] }) =>
          sum + 1 + (a.addon_domains?.length || 0) + (a.subdomains?.length || 0),
        0
      ),
      ssl_expiring: (sslCerts.data || []).filter((s: { status: string }) => s.status === 'expiring').length,
      ssl_expired: (sslCerts.data || []).filter((s: { status: string }) => s.status === 'expired').length,
      pending_imports_count: pendingImports.data?.length || 0,
      unresolved_errors: (serverErrors.data || []).length,
      latest_resource: resourceSnapshots.data?.length ? resourceSnapshots.data[resourceSnapshots.data.length - 1] : null,
      cms_breakdown: (cmsDetections || []).reduce(
        (acc: Record<string, number>, d: { cms_type: string }) => {
          acc[d.cms_type] = (acc[d.cms_type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      total_emails: (emailsResult.data || []).length,
      total_databases: (databasesResult.data || []).length,
    },
  });
}

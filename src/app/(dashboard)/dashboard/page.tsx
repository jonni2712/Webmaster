import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { SitesGrid } from '@/components/dashboard/sites-grid';
import { AlertsFeed } from '@/components/dashboard/alerts-feed';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import type { DashboardStats, SiteWithStatus, AlertWithSite } from '@/types';

function getEmptyStats(): DashboardStats {
  return {
    totalSites: 0,
    sitesUp: 0,
    sitesDown: 0,
    avgUptime: 0,
    validSSL: 0,
    expiringSSL: 0,
    invalidSSL: 0,
    pendingUpdates: 0,
    criticalUpdates: 0,
    activeAlerts: 0,
  };
}

async function getDashboardData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { sites: [], alerts: [], stats: getEmptyStats() };
  }

  const supabase = createAdminClient();

  // Get user's current tenant
  const { data: user } = await supabase
    .from('users')
    .select('current_tenant_id')
    .eq('id', session.user.id)
    .single();

  if (!user?.current_tenant_id) {
    return { sites: [], alerts: [], stats: getEmptyStats() };
  }

  // Get sites from sites table
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, url, platform, tenant_id, client_id, is_active, tags, created_at, status, ssl_status, ssl_expires_at, uptime_percentage, response_time_avg, last_check, last_sync, performance_score, server_id, lifecycle_status, redirect_to_site_id, is_redirect_source, domain_expires_at, parent_site_id, is_multisite, is_main_site')
    .eq('tenant_id', user.current_tenant_id)
    .order('name');

  // Get update counts per site
  const { data: updateCounts } = await supabase
    .from('wp_updates')
    .select('site_id, is_critical')
    .eq('status', 'available')
    .in('site_id', (sites || []).map(s => s.id));

  // Build map of site_id -> { total, critical }
  const updateCountsMap = new Map<string, { total: number; critical: number }>();
  for (const update of updateCounts || []) {
    const current = updateCountsMap.get(update.site_id) || { total: 0, critical: 0 };
    current.total++;
    if (update.is_critical) current.critical++;
    updateCountsMap.set(update.site_id, current);
  }

  // Get recent alerts with site info
  const { data: alertsData } = await supabase
    .from('alerts')
    .select(`
      *,
      site:sites(name, url)
    `)
    .eq('tenant_id', user.current_tenant_id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Map alerts to include site_name and site_url
  const alerts: AlertWithSite[] = (alertsData || []).map(alert => ({
    ...alert,
    site_name: alert.site?.name || null,
    site_url: alert.site?.url || null,
  }));

  // Map sites to SiteWithStatus format
  const sitesList: SiteWithStatus[] = (sites || []).map(site => {
    const siteUpdates = updateCountsMap.get(site.id) || { total: 0, critical: 0 };
    return {
      site_id: site.id,
      tenant_id: site.tenant_id,
      client_id: site.client_id || null,
      client_name: null,
      name: site.name,
      url: site.url,
      platform: site.platform,
      is_active: site.is_active,
      tags: site.tags,
      created_at: site.created_at,
      current_status: site.status === 'online' ? true : site.status === 'offline' ? false : null,
      last_response_time: site.response_time_avg,
      last_uptime_check: site.last_check,
      uptime_30d: site.uptime_percentage,
      ssl_valid: site.ssl_status === 'valid',
      ssl_days_remaining: null,
      wp_updates_pending: site.platform === 'wordpress' ? siteUpdates.total : 0,
      wp_updates_critical: site.platform === 'wordpress' ? siteUpdates.critical : 0,
      ps_updates_pending: 0,
      last_perf_score: site.performance_score,
      last_lcp: null,
      // Multisite fields
      parent_site_id: site.parent_site_id || null,
      is_multisite: site.is_multisite || false,
      is_main_site: site.is_main_site || false,
      // Domain management fields
      server_id: site.server_id || null,
      server_name: null,
      lifecycle_status: site.lifecycle_status || 'active',
      redirect_to_site_id: site.redirect_to_site_id || null,
      is_redirect_source: site.is_redirect_source || false,
      domain_expires_at: site.domain_expires_at || null,
    };
  });

  const alertsList = alerts;

  const stats: DashboardStats = {
    totalSites: sitesList.length,
    sitesUp: sitesList.filter((s) => s.current_status === true).length,
    sitesDown: sitesList.filter((s) => s.current_status === false).length,
    avgUptime:
      sitesList.length > 0
        ? sitesList.reduce((acc, s) => acc + (s.uptime_30d || 0), 0) / sitesList.length
        : 0,
    validSSL: sitesList.filter((s) => s.ssl_valid === true).length,
    expiringSSL: sitesList.filter(
      (s) => s.ssl_days_remaining !== null && s.ssl_days_remaining <= 30
    ).length,
    invalidSSL: sitesList.filter((s) => s.ssl_valid === false).length,
    pendingUpdates: sitesList.reduce(
      (acc, s) => acc + (s.wp_updates_pending || 0) + (s.ps_updates_pending || 0),
      0
    ),
    criticalUpdates: Array.from(updateCountsMap.values()).reduce((acc, v) => acc + v.critical, 0),
    activeAlerts: alertsList.filter((a) => a.status === 'triggered').length,
  };

  return { sites: sitesList, alerts: alertsList, stats };
}

export default async function DashboardPage() {
  const { sites, alerts, stats } = await getDashboardData();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Panoramica dei tuoi siti monitorati"
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/sites/import">
                <Upload className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Importa</span>
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sites/new">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Aggiungi Sito</span>
              </Link>
            </Button>
          </>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <Suspense fallback={<StatsCards stats={null} isLoading />}>
          <StatsCards stats={stats} />
        </Suspense>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Siti Monitorati</h2>
              <Link
                href="/sites"
                className="text-xs text-zinc-500 hover:text-emerald-500 transition-colors"
              >
                Vedi tutti →
              </Link>
            </div>
            <Suspense fallback={<SitesGrid sites={[]} isLoading />}>
              <SitesGrid sites={sites.slice(0, 6)} />
            </Suspense>
          </div>

          <div>
            <Suspense fallback={<AlertsFeed alerts={[]} isLoading />}>
              <AlertsFeed alerts={alerts} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { SitesGrid } from '@/components/dashboard/sites-grid';
import { AlertsFeed } from '@/components/dashboard/alerts-feed';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import type { DashboardStats, SiteWithStatus, Alert } from '@/types';

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
    .select('*')
    .eq('tenant_id', user.current_tenant_id)
    .order('name');

  // Get recent alerts
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('tenant_id', user.current_tenant_id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Map sites to SiteWithStatus format
  const sitesList: SiteWithStatus[] = (sites || []).map(site => ({
    site_id: site.id,
    tenant_id: site.tenant_id,
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
    wp_updates_pending: 0,
    ps_updates_pending: 0,
    last_perf_score: site.performance_score,
    last_lcp: null,
  }));

  const alertsList = (alerts || []) as Alert[];

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
    criticalUpdates: 0,
    activeAlerts: alertsList.filter((a) => a.status === 'triggered').length,
  };

  return { sites: sitesList, alerts: alertsList, stats };
}

export default async function DashboardPage() {
  const { sites, alerts, stats } = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Panoramica di tutti i tuoi siti web
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/sites/import">
              <Upload className="h-4 w-4 mr-2" />
              Importa
            </Link>
          </Button>
          <Button asChild>
            <Link href="/sites/new">
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Sito
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Suspense fallback={<StatsCards stats={null} isLoading />}>
        <StatsCards stats={stats} />
      </Suspense>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Siti Monitorati</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sites">Vedi tutti</Link>
            </Button>
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
  );
}

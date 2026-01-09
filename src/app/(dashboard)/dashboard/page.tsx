import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { SitesGrid } from '@/components/dashboard/sites-grid';
import { AlertsFeed } from '@/components/dashboard/alerts-feed';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import type { DashboardStats, SiteWithStatus, Alert } from '@/types';

async function getDashboardData() {
  const supabase = await createClient();

  // Get sites with status
  const { data: sites } = await supabase
    .from('site_status_summary')
    .select('*')
    .order('name');

  // Get recent alerts
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  // Calculate stats
  const sitesList = (sites || []) as SiteWithStatus[];
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
      (acc, s) => acc + s.wp_updates_pending + s.ps_updates_pending,
      0
    ),
    criticalUpdates: 0, // TODO: calcolare dai dati reali
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

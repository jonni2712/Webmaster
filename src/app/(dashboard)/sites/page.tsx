import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { SitesGrid } from '@/components/dashboard/sites-grid';
import { SitesFilters } from '@/components/sites/sites-filters';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import type { SiteWithStatus, Client } from '@/types';

interface SitesData {
  sites: SiteWithStatus[];
  clients: Client[];
}

async function getSitesData(): Promise<SitesData> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { sites: [], clients: [] };
  }

  const supabase = createAdminClient();

  // Get user's current tenant
  const { data: user } = await supabase
    .from('users')
    .select('current_tenant_id')
    .eq('id', session.user.id)
    .single();

  if (!user?.current_tenant_id) {
    return { sites: [], clients: [] };
  }

  // Fetch sites with client info
  const { data: sitesData } = await supabase
    .from('sites')
    .select(`
      *,
      clients(id, name, company_name)
    `)
    .eq('tenant_id', user.current_tenant_id)
    .order('name');

  // Fetch clients for filter
  const { data: clientsData } = await supabase
    .from('clients')
    .select('*')
    .eq('tenant_id', user.current_tenant_id)
    .eq('is_active', true)
    .order('name');

  // Fetch update counts for all sites
  const { data: updateCounts } = await supabase
    .from('wp_updates')
    .select('site_id, is_critical')
    .eq('status', 'available');

  // Group update counts by site_id
  const updatesBySite = new Map<string, { total: number; critical: number }>();
  for (const update of updateCounts || []) {
    const current = updatesBySite.get(update.site_id) || { total: 0, critical: 0 };
    current.total++;
    if (update.is_critical) current.critical++;
    updatesBySite.set(update.site_id, current);
  }

  // Map sites table columns to SiteWithStatus format expected by SitesGrid
  const sites = (sitesData || []).map(site => {
    const updates = updatesBySite.get(site.id) || { total: 0, critical: 0 };
    return {
      site_id: site.id,
      tenant_id: site.tenant_id,
      client_id: site.client_id,
      client_name: site.clients?.name || null,
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
      wp_updates_pending: updates.total,
      wp_updates_critical: updates.critical,
      ps_updates_pending: 0,
      last_perf_score: site.performance_score,
      last_lcp: null,
    };
  }) as SiteWithStatus[];

  return { sites, clients: clientsData || [] };
}

export default async function SitesPage() {
  const { sites, clients } = await getSitesData();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Siti</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestisci tutti i tuoi siti monitorati ({sites.length} siti)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="sm:size-default" asChild>
            <Link href="/sites/import">
              <Upload className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Importa CSV</span>
            </Link>
          </Button>
          <Button size="sm" className="sm:size-default" asChild>
            <Link href="/sites/new">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Aggiungi Sito</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters and Grid */}
      <Suspense fallback={<SitesGrid sites={[]} isLoading />}>
        <SitesFilters sites={sites} clients={clients} />
      </Suspense>
    </div>
  );
}

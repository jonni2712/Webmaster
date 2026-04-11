import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { SitesGrid } from '@/components/dashboard/sites-grid';
import { SitesFilters } from '@/components/sites/sites-filters';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
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

  // Fetch sites with client info (only plugin-connected sites: WordPress, PrestaShop, NextJS)
  const { data: sitesData } = await supabase
    .from('sites')
    .select(`
      *,
      clients(id, name, company_name)
    `)
    .eq('tenant_id', user.current_tenant_id)
    .in('platform', ['wordpress', 'prestashop', 'nextjs'])
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
      // Multisite fields
      parent_site_id: site.parent_site_id || null,
      is_multisite: site.is_multisite || false,
      is_main_site: site.is_main_site || false,
    };
  }) as SiteWithStatus[];

  return { sites, clients: clientsData || [] };
}

export default async function SitesPage() {
  const { sites, clients } = await getSitesData();

  return (
    <div>
      <PageHeader
        title="Siti"
        description="Gestisci e monitora tutti i tuoi siti web"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/sites/import">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1.5" />
                Importa CSV
              </Button>
            </Link>
            <Link href="/sites/new">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Plus className="h-4 w-4 mr-1.5" />
                Aggiungi sito
              </Button>
            </Link>
          </div>
        }
      />
      <div className="p-6 space-y-4">
        {/* Filters and Grid */}
        <Suspense fallback={<SitesGrid sites={[]} isLoading />}>
          <SitesFilters sites={sites} clients={clients} />
        </Suspense>
      </div>
    </div>
  );
}

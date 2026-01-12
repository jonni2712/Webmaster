import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { SitesGrid } from '@/components/dashboard/sites-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Upload, Search } from 'lucide-react';
import type { SiteWithStatus } from '@/types';

async function getSites(): Promise<SiteWithStatus[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return [];
  }

  const supabase = createAdminClient();

  // Get user's current tenant
  const { data: user } = await supabase
    .from('users')
    .select('current_tenant_id')
    .eq('id', session.user.id)
    .single();

  if (!user?.current_tenant_id) {
    return [];
  }

  const { data } = await supabase
    .from('sites')
    .select('*')
    .eq('tenant_id', user.current_tenant_id)
    .order('name');

  // Map sites table columns to SiteWithStatus format expected by SitesGrid
  return (data || []).map(site => ({
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
  })) as SiteWithStatus[];
}

export default async function SitesPage() {
  const sites = await getSites();

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

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca siti..." className="pl-9 h-9 sm:h-10" />
        </div>
      </div>

      {/* Sites Grid */}
      <Suspense fallback={<SitesGrid sites={[]} isLoading />}>
        <SitesGrid sites={sites} />
      </Suspense>
    </div>
  );
}

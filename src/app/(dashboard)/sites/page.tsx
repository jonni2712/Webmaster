import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SitesGrid } from '@/components/dashboard/sites-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Upload, Search } from 'lucide-react';
import type { SiteWithStatus } from '@/types';

async function getSites(): Promise<SiteWithStatus[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('site_status_summary')
    .select('*')
    .order('name');

  return (data || []) as SiteWithStatus[];
}

export default async function SitesPage() {
  const sites = await getSites();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Siti</h1>
          <p className="text-muted-foreground">
            Gestisci tutti i tuoi siti monitorati ({sites.length} siti)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/sites/import">
              <Upload className="h-4 w-4 mr-2" />
              Importa CSV
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

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca siti..." className="pl-9" />
        </div>
      </div>

      {/* Sites Grid */}
      <Suspense fallback={<SitesGrid sites={[]} isLoading />}>
        <SitesGrid sites={sites} />
      </Suspense>
    </div>
  );
}

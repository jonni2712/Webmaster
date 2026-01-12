'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SitesGrid } from '@/components/dashboard/sites-grid';
import { Search, Building2 } from 'lucide-react';
import type { SiteWithStatus, Client } from '@/types';

interface SitesFiltersProps {
  sites: SiteWithStatus[];
  clients: Client[];
}

export function SitesFilters({ sites, clients }: SitesFiltersProps) {
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');

  const filteredSites = useMemo(() => {
    return sites.filter(site => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          site.name.toLowerCase().includes(searchLower) ||
          site.url.toLowerCase().includes(searchLower) ||
          site.client_name?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Client filter
      if (clientFilter && clientFilter !== 'all') {
        if (clientFilter === 'no_client') {
          if (site.client_id) return false;
        } else {
          if (site.client_id !== clientFilter) return false;
        }
      }

      return true;
    });
  }, [sites, search, clientFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca siti..."
            className="pl-9 h-9 sm:h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {clients.length > 0 && (
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-10">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filtra per cliente" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i clienti</SelectItem>
              <SelectItem value="no_client">Senza cliente</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                  {client.company_name && (
                    <span className="text-muted-foreground ml-1">
                      ({client.company_name})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Results info */}
      {(search || clientFilter !== 'all') && (
        <p className="text-sm text-muted-foreground">
          {filteredSites.length} {filteredSites.length === 1 ? 'sito trovato' : 'siti trovati'}
          {search && ` per "${search}"`}
          {clientFilter !== 'all' && clientFilter !== 'no_client' && (
            ` del cliente ${clients.find(c => c.id === clientFilter)?.name}`
          )}
          {clientFilter === 'no_client' && ' senza cliente associato'}
        </p>
      )}

      {/* Sites Grid */}
      <SitesGrid sites={filteredSites} />
    </div>
  );
}

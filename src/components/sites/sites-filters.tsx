'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SitesGrid } from '@/components/dashboard/sites-grid';
import { Search, Building2, Trash2, Loader2 } from 'lucide-react';
import type { SiteWithStatus, Client } from '@/types';

interface SitesFiltersProps {
  sites: SiteWithStatus[];
  clients: Client[];
}

export function SitesFilters({ sites, clients }: SitesFiltersProps) {
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  const handleCleanupDuplicates = async () => {
    setIsCleaningUp(true);
    setCleanupMessage(null);
    try {
      const res = await fetch('/api/updates/cleanup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCleanupMessage(`Rimossi ${data.totalDeleted} duplicati. Ricarica la pagina.`);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setCleanupMessage(`Errore: ${data.error}`);
      }
    } catch (error) {
      setCleanupMessage('Errore durante la pulizia');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleResetUpdates = async () => {
    if (!confirm('Vuoi eliminare TUTTI i record degli aggiornamenti? Dovrai rifare il sync per ripopolarli.')) {
      return;
    }
    setIsCleaningUp(true);
    setCleanupMessage(null);
    try {
      const res = await fetch('/api/updates/debug', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCleanupMessage('Tutti i record eliminati. Ricarica la pagina e fai sync.');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setCleanupMessage(`Errore: ${data.error}`);
      }
    } catch (error) {
      setCleanupMessage('Errore durante il reset');
    } finally {
      setIsCleaningUp(false);
    }
  };

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

        <Button
          variant="outline"
          size="sm"
          className="h-9 sm:h-10"
          onClick={handleResetUpdates}
          disabled={isCleaningUp}
        >
          {isCleaningUp ? (
            <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
          ) : (
            <Trash2 className="h-4 w-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">Reset aggiornamenti</span>
        </Button>
      </div>

      {cleanupMessage && (
        <p className={`text-sm ${cleanupMessage.includes('Errore') ? 'text-red-500' : 'text-green-600'}`}>
          {cleanupMessage}
        </p>
      )}

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

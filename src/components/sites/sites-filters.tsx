'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Search, Building2, Trash2, Loader2, RefreshCw, Tag, Network, Server, Activity, Calendar } from 'lucide-react';
import type { SiteWithStatus, Client, Server as ServerType, DomainLifecycleStatus } from '@/types';
import { PREDEFINED_TAGS, getTagConfig, getUniqueTags } from '@/lib/constants/tags';
import { LIFECYCLE_STATUS_CONFIG } from '@/lib/constants/lifecycle-status';

interface SitesFiltersProps {
  sites: SiteWithStatus[];
  clients: Client[];
}

type SiteTypeFilter = 'all' | 'multisite' | 'standalone' | 'subsites';

export function SitesFilters({ sites, clients }: SitesFiltersProps) {
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [siteTypeFilter, setSiteTypeFilter] = useState<SiteTypeFilter>('all');
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  // New filters for domain management
  const [serverFilter, setServerFilter] = useState<string>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('all');
  const [redirectFilter, setRedirectFilter] = useState<string>('all');
  const [servers, setServers] = useState<ServerType[]>([]);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const res = await fetch('/api/servers');
      if (res.ok) {
        const data = await res.json();
        setServers(data.servers || []);
      }
    } catch (error) {
      console.error('Error fetching servers:', error);
    }
  };

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

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/sites/sync-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(`${data.message}. ${data.failed > 0 ? `(${data.failed} falliti)` : ''}`);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setSyncMessage(`Errore: ${data.error}`);
      }
    } catch (error) {
      setSyncMessage('Errore durante la sincronizzazione');
    } finally {
      setIsSyncing(false);
    }
  };

  // Get unique tags from sites for the filter dropdown
  const availableTags = useMemo(() => getUniqueTags(sites), [sites]);

  const filteredSites = useMemo(() => {
    return sites.filter(site => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          site.name.toLowerCase().includes(searchLower) ||
          site.url.toLowerCase().includes(searchLower) ||
          site.client_name?.toLowerCase().includes(searchLower) ||
          site.tags?.some(tag => tag.toLowerCase().includes(searchLower));
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

      // Tag filter
      if (tagFilter && tagFilter !== 'all') {
        if (tagFilter === 'no_tags') {
          if (site.tags && site.tags.length > 0) return false;
        } else {
          if (!site.tags || !site.tags.includes(tagFilter)) return false;
        }
      }

      // Site type filter (multisite)
      if (siteTypeFilter !== 'all') {
        if (siteTypeFilter === 'multisite') {
          // Show only multisite main sites
          if (!site.is_multisite || !site.is_main_site) return false;
        } else if (siteTypeFilter === 'standalone') {
          // Show only standalone sites (not multisite main sites and not subsites)
          if (site.is_multisite || site.parent_site_id) return false;
        } else if (siteTypeFilter === 'subsites') {
          // Show only subsites
          if (!site.parent_site_id) return false;
        }
      }

      // Server filter
      if (serverFilter !== 'all') {
        if (serverFilter === 'no_server') {
          if (site.server_id) return false;
        } else {
          if (site.server_id !== serverFilter) return false;
        }
      }

      // Lifecycle status filter
      if (lifecycleFilter !== 'all') {
        if (site.lifecycle_status !== lifecycleFilter) return false;
      }

      // Redirect filter
      if (redirectFilter !== 'all') {
        if (redirectFilter === 'redirect_only') {
          if (!site.is_redirect_source) return false;
        } else if (redirectFilter === 'no_redirect') {
          if (site.is_redirect_source) return false;
        }
      }

      return true;
    });
  }, [sites, search, clientFilter, tagFilter, siteTypeFilter, serverFilter, lifecycleFilter, redirectFilter]);

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-3 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <Input
            placeholder="Cerca siti..."
            className="pl-8 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Dropdowns */}
        {clients.length > 0 && (
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="h-8 text-sm w-auto min-w-[120px]">
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                <SelectValue placeholder="Cliente" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i clienti</SelectItem>
              <SelectItem value="no_client">Senza cliente</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-[100px]">
            <div className="flex items-center gap-1.5 truncate">
              <Tag className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
              <SelectValue placeholder="Tag" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i tag</SelectItem>
            <SelectItem value="no_tags">Senza tag</SelectItem>
            {PREDEFINED_TAGS.map((tag) => (
              <SelectItem key={tag.value} value={tag.value}>
                <span className={`inline-flex items-center gap-1.5 ${tag.color}`}>
                  <span className={`w-2 h-2 rounded-full ${tag.bgColor}`} />
                  {tag.label}
                </span>
              </SelectItem>
            ))}
            {availableTags
              .filter(tag => !PREDEFINED_TAGS.some(pt => pt.value === tag))
              .map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select value={siteTypeFilter} onValueChange={(value) => setSiteTypeFilter(value as SiteTypeFilter)}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-[100px]">
            <div className="flex items-center gap-1.5 truncate">
              <Network className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
              <SelectValue placeholder="Tipo" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i tipi</SelectItem>
            <SelectItem value="multisite">Multisite</SelectItem>
            <SelectItem value="standalone">Standalone</SelectItem>
            <SelectItem value="subsites">Sottositi</SelectItem>
          </SelectContent>
        </Select>

        {servers.length > 0 && (
          <Select value={serverFilter} onValueChange={setServerFilter}>
            <SelectTrigger className="h-8 text-sm w-auto min-w-[100px]">
              <div className="flex items-center gap-1.5 truncate">
                <Server className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                <SelectValue placeholder="Server" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i server</SelectItem>
              <SelectItem value="no_server">Senza server</SelectItem>
              {servers.map((server) => (
                <SelectItem key={server.id} value={server.id}>
                  {server.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={lifecycleFilter} onValueChange={setLifecycleFilter}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-[100px]">
            <div className="flex items-center gap-1.5 truncate">
              <Activity className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
              <SelectValue placeholder="Stato" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {LIFECYCLE_STATUS_CONFIG.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                <span className={status.color}>{status.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={redirectFilter} onValueChange={setRedirectFilter}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-[90px]">
            <SelectValue placeholder="Redirect" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="redirect_only">Solo Redirect</SelectItem>
            <SelectItem value="no_redirect">No Redirect</SelectItem>
          </SelectContent>
        </Select>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={handleSyncAll}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          )}
          Sync
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={handleResetUpdates}
          disabled={isCleaningUp}
        >
          {isCleaningUp ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : (
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          )}
          Reset
        </Button>

        {/* Clear filters */}
        {(search || clientFilter !== 'all' || tagFilter !== 'all' || siteTypeFilter !== 'all' || serverFilter !== 'all' || lifecycleFilter !== 'all' || redirectFilter !== 'all') && (
          <button
            onClick={() => {
              setSearch('');
              setClientFilter('all');
              setTagFilter('all');
              setSiteTypeFilter('all');
              setServerFilter('all');
              setLifecycleFilter('all');
              setRedirectFilter('all');
            }}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Pulisci
          </button>
        )}
      </div>

      {cleanupMessage && (
        <p className={`text-xs ${cleanupMessage.includes('Errore') ? 'text-red-500' : 'text-green-600'}`}>
          {cleanupMessage}
        </p>
      )}

      {syncMessage && (
        <p className={`text-xs ${syncMessage.includes('Errore') ? 'text-red-500' : 'text-green-600'}`}>
          {syncMessage}
        </p>
      )}

      {/* Results info */}
      {(search || clientFilter !== 'all' || tagFilter !== 'all' || siteTypeFilter !== 'all' || serverFilter !== 'all' || lifecycleFilter !== 'all' || redirectFilter !== 'all') && (
        <p className="text-xs text-zinc-500">
          {filteredSites.length} {filteredSites.length === 1 ? 'sito trovato' : 'siti trovati'}
          {search && ` per "${search}"`}
          {clientFilter !== 'all' && clientFilter !== 'no_client' && (
            ` del cliente ${clients.find(c => c.id === clientFilter)?.name}`
          )}
          {clientFilter === 'no_client' && ' senza cliente associato'}
          {tagFilter !== 'all' && tagFilter !== 'no_tags' && (
            ` con tag "${getTagConfig(tagFilter).label}"`
          )}
          {tagFilter === 'no_tags' && ' senza tag'}
          {siteTypeFilter === 'multisite' && ' (reti multisite)'}
          {siteTypeFilter === 'standalone' && ' (standalone)'}
          {siteTypeFilter === 'subsites' && ' (sottositi)'}
          {serverFilter !== 'all' && serverFilter !== 'no_server' && (
            ` su ${servers.find(s => s.id === serverFilter)?.name}`
          )}
          {serverFilter === 'no_server' && ' senza server'}
          {lifecycleFilter !== 'all' && (
            ` - ${LIFECYCLE_STATUS_CONFIG.find(s => s.value === lifecycleFilter)?.label}`
          )}
          {redirectFilter === 'redirect_only' && ' (solo redirect)'}
          {redirectFilter === 'no_redirect' && ' (no redirect)'}
        </p>
      )}

      {/* Sites Grid */}
      <SitesGrid sites={filteredSites} />
    </div>
  );
}

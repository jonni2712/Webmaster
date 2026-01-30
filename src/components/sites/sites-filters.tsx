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
      {/* Row 1: Search + Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca siti..."
            className="pl-9 h-9 sm:h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 sm:h-10"
            onClick={handleSyncAll}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Sync</span>
          </Button>
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
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* Row 2: Filters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
        {clients.length > 0 && (
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="h-9">
              <div className="flex items-center gap-2 truncate">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
          <SelectTrigger className="h-9">
            <div className="flex items-center gap-2 truncate">
              <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
          <SelectTrigger className="h-9">
            <div className="flex items-center gap-2 truncate">
              <Network className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
            <SelectTrigger className="h-9">
              <div className="flex items-center gap-2 truncate">
                <Server className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
          <SelectTrigger className="h-9">
            <div className="flex items-center gap-2 truncate">
              <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Redirect" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="redirect_only">Solo Redirect</SelectItem>
            <SelectItem value="no_redirect">No Redirect</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {cleanupMessage && (
        <p className={`text-sm ${cleanupMessage.includes('Errore') ? 'text-red-500' : 'text-green-600'}`}>
          {cleanupMessage}
        </p>
      )}

      {syncMessage && (
        <p className={`text-sm ${syncMessage.includes('Errore') ? 'text-red-500' : 'text-green-600'}`}>
          {syncMessage}
        </p>
      )}

      {/* Results info */}
      {(search || clientFilter !== 'all' || tagFilter !== 'all' || siteTypeFilter !== 'all' || serverFilter !== 'all' || lifecycleFilter !== 'all' || redirectFilter !== 'all') && (
        <p className="text-sm text-muted-foreground">
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

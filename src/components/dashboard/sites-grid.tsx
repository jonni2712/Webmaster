'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink,
  MoreVertical,
  Globe,
  Activity,
  Clock,
  Zap,
  Building2,
  Settings,
  Download,
  Server,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SiteWithStatus } from '@/types';
import { getTagConfig } from '@/lib/constants/tags';
import { MultisiteNetworkCard } from '@/components/sites/multisite-network-card';
import { LifecycleStatusBadge } from '@/components/sites/lifecycle-status-badge';

interface SitesGridProps {
  sites: SiteWithStatus[];
  isLoading?: boolean;
}

function StatusIndicator({ isUp }: { isUp: boolean | null }) {
  if (isUp === null) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-xs text-zinc-500">Sconosciuto</span>
      </div>
    );
  }
  return isUp ? (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-online" />
      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
    </div>
  ) : (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
      <span className="text-xs text-red-600 dark:text-red-400 font-medium">Offline</span>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const config = {
    wordpress: { label: 'WordPress', className: 'border-blue-200 text-blue-700 dark:border-blue-900 dark:text-blue-300' },
    prestashop: { label: 'PrestaShop', className: 'border-pink-200 text-pink-700 dark:border-pink-900 dark:text-pink-300' },
    other: { label: 'Altro', className: 'border-zinc-200 text-zinc-600 dark:border-white/10 dark:text-zinc-400' },
  };

  const { label, className } = config[platform as keyof typeof config] || config.other;

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${className}`}>
      {label}
    </span>
  );
}

function UpdatesBadge({ pending, critical }: { pending: number; critical?: number }) {
  if (pending === 0) return null;

  const hasCritical = critical !== undefined && critical > 0;

  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex items-center gap-1 ${
        hasCritical
          ? 'border-red-200 text-red-700 dark:border-red-900 dark:text-red-400'
          : 'border-orange-200 text-orange-700 dark:border-orange-900 dark:text-orange-400'
      }`}
    >
      <Download className="h-3 w-3" />
      {pending}
      {hasCritical ? ` (${critical} critici)` : null}
    </span>
  );
}

function TagBadge({ tag }: { tag: string }) {
  const config = getTagConfig(tag);
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${config.color} ${config.bgColor} ${config.borderColor}`}
    >
      {config.label}
    </span>
  );
}

function StatItem({ label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{label}</span>
      <span className={`text-sm font-mono font-medium ${color || 'text-zinc-900 dark:text-white'}`}>{value}</span>
    </div>
  );
}

function SiteCard({ site }: { site: SiteWithStatus }) {
  const getPerformanceColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getUptimeColor = (uptime: number | null) => {
    if (!uptime) return 'text-muted-foreground';
    if (uptime >= 99.5) return 'text-green-600 dark:text-green-400';
    if (uptime >= 95) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="group bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg hover:border-zinc-300 dark:hover:border-white/10 transition-colors overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-white/5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <StatusIndicator isUp={site.current_status} />
            </div>
            <Link
              href={`/sites/${site.site_id}`}
              className="text-sm font-medium text-zinc-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1 block"
            >
              {site.name}
            </Link>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1 mt-0.5 truncate"
            >
              <Globe className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{new URL(site.url).hostname}</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            {site.client_name && (
              <Link
                href={`/clients/${site.client_id}`}
                className="text-[11px] text-zinc-500 hover:text-emerald-500 flex items-center gap-1 mt-0.5"
              >
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{site.client_name}</span>
              </Link>
            )}
            {site.server_name && (
              <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                <Server className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{site.server_name}</span>
              </div>
            )}
            {site.tags && site.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {site.tags.slice(0, 3).map((tag) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
                {site.tags.length > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-white/10 text-zinc-500 font-medium">
                    +{site.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/sites/${site.site_id}`}>
                  <Activity className="h-4 w-4 mr-2" />
                  Dettagli
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/sites/${site.site_id}/edit`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Modifica
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={site.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visita sito
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-1.5 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <PlatformBadge platform={site.platform} />
            {site.lifecycle_status && site.lifecycle_status !== 'active' && (
              <LifecycleStatusBadge status={site.lifecycle_status} size="sm" />
            )}
            <UpdatesBadge pending={site.wp_updates_pending} critical={site.wp_updates_critical} />
          </div>
          {site.ssl_valid && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 font-medium">
              SSL
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatItem
            icon={Activity}
            label="Uptime"
            value={site.uptime_30d ? `${site.uptime_30d.toFixed(1)}%` : '--'}
            color={getUptimeColor(site.uptime_30d)}
          />
          <StatItem
            icon={Clock}
            label="Risposta"
            value={site.last_response_time ? `${site.last_response_time}ms` : '--'}
          />
          <StatItem
            icon={Zap}
            label="Perf."
            value={site.last_perf_score ? `${site.last_perf_score}` : '--'}
            color={getPerformanceColor(site.last_perf_score)}
          />
        </div>
      </div>
    </div>
  );
}

interface GroupedSites {
  multisiteNetworks: Map<string, { mainSite: SiteWithStatus; subsites: SiteWithStatus[] }>;
  standaloneSites: SiteWithStatus[];
}

function groupSitesByMultisite(sites: SiteWithStatus[]): GroupedSites {
  const multisiteNetworks = new Map<string, { mainSite: SiteWithStatus; subsites: SiteWithStatus[] }>();
  const standaloneSites: SiteWithStatus[] = [];

  // First pass: identify main sites (multisite networks)
  for (const site of sites) {
    if (site.is_multisite && site.is_main_site) {
      multisiteNetworks.set(site.site_id, { mainSite: site, subsites: [] });
    }
  }

  // Second pass: assign subsites to their parent networks or mark as standalone
  for (const site of sites) {
    // Skip main sites as they're already in the networks map
    if (site.is_multisite && site.is_main_site) {
      continue;
    }

    // Check if this is a subsite
    if (site.parent_site_id && multisiteNetworks.has(site.parent_site_id)) {
      multisiteNetworks.get(site.parent_site_id)!.subsites.push(site);
    } else if (!site.parent_site_id) {
      // Standalone site (not a subsite)
      standaloneSites.push(site);
    }
    // Note: Subsites whose parent is not in the current view are excluded
  }

  return { multisiteNetworks, standaloneSites };
}

export function SitesGrid({ sites, isLoading }: SitesGridProps) {
  // Group sites by multisite networks
  const { multisiteNetworks, standaloneSites } = useMemo(
    () => groupSitesByMultisite(sites),
    [sites]
  );

  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-white/5">
              <Skeleton className="h-2.5 w-12 mb-2" />
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex flex-col gap-0.5">
                    <Skeleton className="h-2.5 w-10" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg flex flex-col items-center justify-center py-12 px-4">
        <Globe className="h-8 w-8 text-zinc-400 mb-3" />
        <p className="text-sm text-zinc-500 mb-4 text-center">Nessun sito monitorato</p>
        <Button asChild size="sm">
          <Link href="/sites/new">Aggiungi il primo sito</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      {/* Render multisite networks first */}
      {Array.from(multisiteNetworks.values()).map(({ mainSite, subsites }) => (
        <MultisiteNetworkCard
          key={mainSite.site_id}
          mainSite={mainSite}
          subsites={subsites}
        />
      ))}
      {/* Then render standalone sites */}
      {standaloneSites.map((site) => (
        <SiteCard key={site.site_id} site={site} />
      ))}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  MoreVertical,
  Globe,
  Activity,
  Clock,
  Zap,
  Building2,
  Settings,
  ChevronDown,
  ChevronRight,
  Network,
  Layers,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SiteWithStatus } from '@/types';
import { getTagConfig } from '@/lib/constants/tags';

interface MultisiteNetworkCardProps {
  mainSite: SiteWithStatus;
  subsites: SiteWithStatus[];
}

function StatusIndicator({ isUp }: { isUp: boolean | null }) {
  if (isUp === null) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-gray-400 animate-pulse" />
        <span className="text-xs text-muted-foreground">Sconosciuto</span>
      </div>
    );
  }
  return isUp ? (
    <div className="flex items-center gap-1.5">
      <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
    </div>
  ) : (
    <div className="flex items-center gap-1.5">
      <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
      <span className="text-xs text-red-600 dark:text-red-400 font-medium">Offline</span>
    </div>
  );
}

function SubsiteRow({ site }: { site: SiteWithStatus }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-md transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <StatusIndicator isUp={site.current_status} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/sites/${site.site_id}`}
            className="font-medium text-sm hover:text-primary transition-colors truncate block"
          >
            {site.name}
          </Link>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 truncate"
          >
            <span className="truncate">{new URL(site.url).hostname}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {site.uptime_30d !== null && (
          <span className={site.uptime_30d >= 99.5 ? 'text-green-600' : site.uptime_30d >= 95 ? 'text-yellow-600' : 'text-red-600'}>
            {site.uptime_30d.toFixed(1)}%
          </span>
        )}
        {site.last_response_time !== null && (
          <span>{site.last_response_time}ms</span>
        )}
        <Link href={`/sites/${site.site_id}`}>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Activity className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
      <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${color || 'text-muted-foreground'}`} />
      <span className={`text-xs sm:text-sm font-semibold ${color || ''}`}>{value}</span>
      <span className="text-[10px] sm:text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function MultisiteNetworkCard({ mainSite, subsites }: MultisiteNetworkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Calculate aggregated stats
  const subsitesOnline = subsites.filter(s => s.current_status === true).length;
  const subsitesOffline = subsites.filter(s => s.current_status === false).length;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden border-l-4 border-l-purple-500">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b bg-muted/30">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <StatusIndicator isUp={mainSite.current_status} />
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-[10px] px-1.5 py-0.5 flex items-center gap-1">
                  <Network className="h-3 w-3" />
                  Multisite
                </Badge>
              </div>
              <Link
                href={`/sites/${mainSite.site_id}`}
                className="font-semibold text-sm sm:text-base hover:text-primary transition-colors line-clamp-1 block"
              >
                {mainSite.name}
              </Link>
              <a
                href={mainSite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5 truncate"
              >
                <Globe className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{new URL(mainSite.url).hostname}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              {mainSite.client_name && (
                <Link
                  href={`/clients/${mainSite.client_id}`}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                >
                  <Building2 className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{mainSite.client_name}</span>
                </Link>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/sites/${mainSite.site_id}`}>
                    <Activity className="h-4 w-4 mr-2" />
                    Dettagli rete
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/sites/${mainSite.site_id}/edit`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Modifica
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={mainSite.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visita sito
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between flex-wrap gap-1.5 mb-3">
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                WordPress
              </Badge>
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {subsites.length} sottositi
              </Badge>
            </div>
            {mainSite.ssl_valid && (
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 text-green-600 border-green-300 dark:text-green-400 dark:border-green-800">
                SSL Valido
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <StatItem
              icon={Activity}
              label="Uptime"
              value={mainSite.uptime_30d ? `${mainSite.uptime_30d.toFixed(1)}%` : '--'}
              color={getUptimeColor(mainSite.uptime_30d)}
            />
            <StatItem
              icon={Clock}
              label="Risposta"
              value={mainSite.last_response_time ? `${mainSite.last_response_time}ms` : '--'}
            />
            <StatItem
              icon={Zap}
              label="Perf."
              value={mainSite.last_perf_score ? `${mainSite.last_perf_score}` : '--'}
              color={getPerformanceColor(mainSite.last_perf_score)}
            />
          </div>
        </div>

        {/* Subsites Expandable Section */}
        {subsites.length > 0 && (
          <div className="border-t">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full px-3 sm:px-4 py-2 flex items-center justify-between text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span>Sottositi ({subsites.length})</span>
                {subsitesOnline > 0 && (
                  <span className="text-green-600 text-xs">{subsitesOnline} online</span>
                )}
                {subsitesOffline > 0 && (
                  <span className="text-red-600 text-xs">{subsitesOffline} offline</span>
                )}
              </span>
            </button>
            {isExpanded && (
              <div className="px-2 pb-2 space-y-1 max-h-64 overflow-y-auto">
                {subsites.map((subsite) => (
                  <SubsiteRow key={subsite.site_id} site={subsite} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

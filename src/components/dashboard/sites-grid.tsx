'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  Activity,
  Clock,
  Zap,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SiteWithStatus } from '@/types';

interface SitesGridProps {
  sites: SiteWithStatus[];
  isLoading?: boolean;
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

function PlatformBadge({ platform }: { platform: string }) {
  const config = {
    wordpress: { label: 'WordPress', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
    prestashop: { label: 'PrestaShop', className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300' },
    other: { label: 'Altro', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  };

  const { label, className } = config[platform as keyof typeof config] || config.other;

  return (
    <Badge variant="secondary" className={`${className} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5`}>
      {label}
    </Badge>
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
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b bg-muted/30">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <StatusIndicator isUp={site.current_status} />
              </div>
              <Link
                href={`/sites/${site.site_id}`}
                className="font-semibold text-sm sm:text-base hover:text-primary transition-colors line-clamp-1 block"
              >
                {site.name}
              </Link>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5 truncate"
              >
                <Globe className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{new URL(site.url).hostname}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/sites/${site.site_id}`}>Dettagli</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={site.url} target="_blank" rel="noopener noreferrer">
                    Visita sito
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <PlatformBadge platform={site.platform} />
            {site.ssl_valid && (
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 text-green-600 border-green-300 dark:text-green-400 dark:border-green-800">
                SSL Valido
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
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
      </CardContent>
    </Card>
  );
}

export function SitesGrid({ sites, isLoading }: SitesGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-0">
              <div className="p-3 sm:p-4 border-b">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex flex-col items-center gap-1">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
          <Globe className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
          <p className="text-muted-foreground mb-3 sm:mb-4 text-center text-sm sm:text-base">Nessun sito monitorato</p>
          <Button asChild size="sm" className="sm:size-default">
            <Link href="/sites/new">Aggiungi il primo sito</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      {sites.map((site) => (
        <SiteCard key={site.site_id} site={site} />
      ))}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
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
    return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
  return isUp ? (
    <CheckCircle className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-red-500" />
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const colors = {
    wordpress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    prestashop: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  };

  return (
    <Badge variant="secondary" className={colors[platform as keyof typeof colors] || colors.other}>
      {platform === 'wordpress' ? 'WP' : platform === 'prestashop' ? 'PS' : platform}
    </Badge>
  );
}

export function SitesGrid({ sites, isLoading }: SitesGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Nessun sito monitorato</p>
          <Button asChild>
            <Link href="/sites/new">Aggiungi il primo sito</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sites.map((site) => (
        <Card key={site.site_id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <StatusIndicator isUp={site.current_status} />
                <Link
                  href={`/sites/${site.site_id}`}
                  className="font-semibold hover:underline line-clamp-1"
                >
                  {site.name}
                </Link>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
            >
              {new URL(site.url).hostname}
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <PlatformBadge platform={site.platform} />

              {site.ssl_days_remaining !== null && (
                <Badge
                  variant={
                    site.ssl_days_remaining <= 7
                      ? 'destructive'
                      : site.ssl_days_remaining <= 30
                      ? 'default'
                      : 'secondary'
                  }
                >
                  SSL: {site.ssl_days_remaining}gg
                </Badge>
              )}

              {(site.wp_updates_pending > 0 || site.ps_updates_pending > 0) && (
                <Badge variant="outline">
                  {site.wp_updates_pending + site.ps_updates_pending} update
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Uptime</div>
                <div className="font-semibold">
                  {site.uptime_30d?.toFixed(1) || '--'}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Risposta</div>
                <div className="font-semibold">
                  {site.last_response_time || '--'}ms
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Perf.</div>
                <div
                  className={`font-semibold ${
                    (site.last_perf_score || 0) >= 90
                      ? 'text-green-600'
                      : (site.last_perf_score || 0) >= 50
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {site.last_perf_score || '--'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

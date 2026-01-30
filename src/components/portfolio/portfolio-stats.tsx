'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Globe,
  Server,
  ArrowRight,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Hammer,
  Wrench,
  Trash2,
  Archive,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import type { DomainPortfolioSummary, ServerWithStats, ExpiringDomain } from '@/types/database';
import { getLifecycleStatusConfig, LIFECYCLE_STATUS_CONFIG } from '@/lib/constants/lifecycle-status';
import { LifecycleStatusBadge } from '@/components/sites/lifecycle-status-badge';

interface PortfolioStatsProps {
  summary: DomainPortfolioSummary;
  serverStats: ServerWithStats[];
  expiringDomains: ExpiringDomain[];
  statusDistribution: Record<string, number>;
  unassignedSites: { id: string; name: string; url: string; lifecycle_status: string }[];
}

const statusIcons = {
  active: CheckCircle,
  to_update: RefreshCw,
  to_rebuild: Hammer,
  in_maintenance: Wrench,
  in_progress: Clock,
  to_delete: Trash2,
  redirect_only: ArrowRight,
  archived: Archive,
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color = 'text-foreground',
}: {
  title: string;
  value: number | string;
  description?: string;
  icon: any;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg bg-muted ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PortfolioStats({
  summary,
  serverStats,
  expiringDomains,
  statusDistribution,
  unassignedSites,
}: PortfolioStatsProps) {
  const totalDomains = summary.total_domains || 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Domini Totali"
          value={totalDomains}
          icon={Globe}
          color="text-blue-600"
        />
        <StatCard
          title="Server"
          value={serverStats.length}
          description={`${summary.domains_with_server} domini assegnati`}
          icon={Server}
          color="text-purple-600"
        />
        <StatCard
          title="Redirect"
          value={summary.redirect_sources}
          description={`${summary.has_redirect_target} con destinazione`}
          icon={ArrowRight}
          color="text-gray-600"
        />
        <StatCard
          title="In Scadenza"
          value={summary.expiring_30_days}
          description={summary.expiring_7_days > 0 ? `${summary.expiring_7_days} urgenti` : undefined}
          icon={Calendar}
          color={summary.expiring_7_days > 0 ? 'text-red-600' : 'text-yellow-600'}
        />
      </div>

      {/* Alerts */}
      {(summary.expired > 0 || summary.expiring_7_days > 0) && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                Attenzione: {summary.expired > 0 && `${summary.expired} domini scaduti`}
                {summary.expired > 0 && summary.expiring_7_days > 0 && ', '}
                {summary.expiring_7_days > 0 && `${summary.expiring_7_days} in scadenza entro 7 giorni`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Distribuzione Stati</CardTitle>
            <CardDescription>Stato del ciclo di vita dei domini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {LIFECYCLE_STATUS_CONFIG.map((status) => {
              const count = statusDistribution[status.value] || 0;
              const percentage = totalDomains > 0 ? (count / totalDomains) * 100 : 0;
              const Icon = statusIcons[status.value as keyof typeof statusIcons] || CheckCircle;

              return (
                <div key={status.value} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${status.color}`} />
                      <span>{status.label}</span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Server Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Server</CardTitle>
                <CardDescription>Distribuzione siti per server</CardDescription>
              </div>
              <Link
                href="/portfolio/servers"
                className="text-sm text-primary hover:underline"
              >
                Gestisci
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {serverStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nessun server configurato.{' '}
                <Link href="/portfolio/servers" className="text-primary hover:underline">
                  Aggiungi il primo server
                </Link>
              </p>
            ) : (
              serverStats.slice(0, 5).map((server) => {
                const percentage = totalDomains > 0 ? (server.sites_count / totalDomains) * 100 : 0;

                return (
                  <div key={server.server_id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <span>{server.server_name}</span>
                        {server.provider && (
                          <span className="text-xs text-muted-foreground">({server.provider})</span>
                        )}
                        {!server.is_active && (
                          <Badge variant="outline" className="text-[10px] px-1">inattivo</Badge>
                        )}
                      </div>
                      <span className="font-medium">{server.sites_count}</span>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                );
              })
            )}

            {summary.domains_without_server > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Senza server assegnato</span>
                  <span className="font-medium">{summary.domains_without_server}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Domains */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Domini in Scadenza</CardTitle>
            <CardDescription>Prossimi 90 giorni</CardDescription>
          </CardHeader>
          <CardContent>
            {expiringDomains.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nessun dominio in scadenza nei prossimi 90 giorni
              </p>
            ) : (
              <div className="space-y-2">
                {expiringDomains.map((domain) => (
                  <Link
                    key={domain.site_id}
                    href={`/sites/${domain.site_id}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar
                        className={`h-4 w-4 flex-shrink-0 ${
                          domain.expiry_status === 'expired'
                            ? 'text-red-600'
                            : domain.expiry_status === 'critical'
                            ? 'text-red-500'
                            : 'text-yellow-500'
                        }`}
                      />
                      <span className="text-sm truncate">{domain.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {domain.domain_registrar && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {domain.domain_registrar}
                        </span>
                      )}
                      <Badge
                        variant={
                          domain.expiry_status === 'expired'
                            ? 'destructive'
                            : domain.expiry_status === 'critical'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-[10px] px-1.5"
                      >
                        {domain.expiry_status === 'expired'
                          ? 'Scaduto'
                          : `${domain.days_until_expiry}g`}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unassigned Sites */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Siti Senza Server</CardTitle>
            <CardDescription>Domini da assegnare a un server</CardDescription>
          </CardHeader>
          <CardContent>
            {unassignedSites.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Tutti i domini sono assegnati a un server
              </p>
            ) : (
              <div className="space-y-2">
                {unassignedSites.slice(0, 8).map((site) => (
                  <Link
                    key={site.id}
                    href={`/sites/${site.id}/edit`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{site.name}</span>
                    </div>
                    <LifecycleStatusBadge
                      status={site.lifecycle_status as any}
                      size="sm"
                      showIcon={false}
                    />
                  </Link>
                ))}
                {unassignedSites.length > 8 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{unassignedSites.length - 8} altri siti
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

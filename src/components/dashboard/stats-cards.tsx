'use client';

import { Globe, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/layout/stat-card';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats | null;
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-4"
          >
            <Skeleton className="h-2.5 w-20 mb-3" />
            <Skeleton className="h-7 w-14 mb-2" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        ))}
      </div>
    );
  }

  const uptimeValue = stats?.avgUptime != null ? `${stats.avgUptime.toFixed(2)}%` : '0%';
  const uptimePositive = (stats?.avgUptime ?? 0) >= 99.5;

  const sslChangePositive = (stats?.expiringSSL ?? 0) === 0;
  const sslChangeText =
    (stats?.expiringSSL ?? 0) > 0
      ? `${stats!.expiringSSL} in scadenza`
      : 'Tutti validi';

  const updatesPositive = (stats?.criticalUpdates ?? 0) === 0;
  const updatesChangeText =
    (stats?.criticalUpdates ?? 0) > 0
      ? `${stats!.criticalUpdates} critici`
      : 'Nessuno critico';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Siti Monitorati"
        value={stats?.totalSites ?? 0}
        change={{
          value: `${stats?.sitesUp ?? 0} online, ${stats?.sitesDown ?? 0} offline`,
          positive: stats?.sitesDown === 0 && (stats?.totalSites ?? 0) > 0,
        }}
        icon={<Globe className="h-4 w-4" />}
      />
      <StatCard
        label="Uptime Medio"
        value={uptimeValue}
        change={{
          value: 'Ultimi 30 giorni',
          positive: uptimePositive,
        }}
        icon={<Zap className="h-4 w-4" />}
      />
      <StatCard
        label="Certificati SSL"
        value={stats?.validSSL ?? 0}
        change={{
          value: sslChangeText,
          positive: sslChangePositive,
        }}
        icon={<ShieldCheck className="h-4 w-4" />}
      />
      <StatCard
        label="Aggiornamenti"
        value={stats?.pendingUpdates ?? 0}
        change={{
          value: updatesChangeText,
          positive: updatesPositive,
        }}
        icon={<AlertTriangle className="h-4 w-4" />}
      />
    </div>
  );
}

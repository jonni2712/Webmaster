'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, ShieldCheck, Zap, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats | null;
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
              <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
              <Skeleton className="h-3 sm:h-4 w-3 sm:w-4" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
              <Skeleton className="h-2 sm:h-3 w-24 sm:w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Siti Monitorati',
      value: stats?.totalSites || 0,
      subtitle: `${stats?.sitesUp || 0} online, ${stats?.sitesDown || 0} offline`,
      icon: Globe,
      trend: stats?.sitesUp === stats?.totalSites ? 'positive' : 'negative',
      trendIcon: stats?.sitesUp === stats?.totalSites ? ArrowUp : ArrowDown,
    },
    {
      title: 'Uptime Medio',
      value: `${stats?.avgUptime?.toFixed(2) || 0}%`,
      subtitle: 'Ultimi 30 giorni',
      icon: Zap,
      trend: (stats?.avgUptime || 0) >= 99.5 ? 'positive' : 'warning',
      trendIcon: (stats?.avgUptime || 0) >= 99.5 ? ArrowUp : ArrowDown,
    },
    {
      title: 'Certificati SSL',
      value: stats?.validSSL || 0,
      subtitle: `${stats?.expiringSSL || 0} in scadenza`,
      icon: ShieldCheck,
      trend: (stats?.expiringSSL || 0) > 0 ? 'warning' : 'positive',
    },
    {
      title: 'Aggiornamenti',
      value: stats?.pendingUpdates || 0,
      subtitle: `${stats?.criticalUpdates || 0} critici`,
      icon: AlertTriangle,
      trend: (stats?.criticalUpdates || 0) > 0 ? 'negative' : 'neutral',
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                card.trend === 'positive'
                  ? 'text-green-500'
                  : card.trend === 'warning'
                  ? 'text-yellow-500'
                  : card.trend === 'negative'
                  ? 'text-red-500'
                  : 'text-muted-foreground'
              }`}
            />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{card.value}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

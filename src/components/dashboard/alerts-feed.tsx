'use client';

import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import type { AlertWithSite, AlertTriggerType } from '@/types';

interface AlertsFeedProps {
  alerts: AlertWithSite[];
  isLoading?: boolean;
}

const triggerTypeLabels: Record<AlertTriggerType, string> = {
  site_down: 'Sito offline',
  ssl_expiring: 'SSL in scadenza',
  ssl_invalid: 'SSL non valido',
  performance_degraded: 'Performance',
  update_available: 'Aggiornamenti',
  update_critical: 'Aggiornamenti critici',
  ecommerce_anomaly: 'E-commerce',
};

const severityDotColor: Record<string, string> = {
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
  critical: 'bg-red-500',
};

export function AlertsFeed({ alerts, isLoading }: AlertsFeedProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-zinc-200 dark:border-white/5 last:border-b-0 flex items-start gap-3">
              <Skeleton className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-3/4 mb-1.5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-zinc-400" />
          Alert Recenti
        </h3>
        <Link
          href="/alerts"
          className="text-xs text-zinc-500 hover:text-emerald-500 transition-colors"
        >
          Vedi tutti →
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 gap-2">
          <Bell className="h-6 w-6 text-zinc-300 dark:text-zinc-700" />
          <p className="text-xs text-zinc-500">Nessun avviso recente</p>
        </div>
      ) : (
        <div>
          {alerts.slice(0, 5).map((alert) => {
            const dotColor = severityDotColor[alert.severity] ?? 'bg-zinc-400';
            const label = triggerTypeLabels[alert.trigger_type] || alert.trigger_type;
            const timeAgo = formatDistanceToNow(new Date(alert.created_at), {
              addSuffix: true,
              locale: it,
            });

            return (
              <Link
                key={alert.id}
                href={alert.site_id ? `/sites/${alert.site_id}` : '/alerts'}
                className="px-4 py-3 border-b border-zinc-200 dark:border-white/5 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-white/[0.02] flex items-start gap-3 transition-colors block"
              >
                <span className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-1">
                    {alert.site_name ?? alert.title}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{label}</p>
                </div>
                <span className="text-xs font-mono text-zinc-500 flex-shrink-0 whitespace-nowrap">
                  {timeAgo}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

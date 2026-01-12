'use client';

import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, AlertTriangle, Info, XCircle } from 'lucide-react';
import Link from 'next/link';
import type { Alert } from '@/types';

interface AlertsFeedProps {
  alerts: Alert[];
  isLoading?: boolean;
}

const severityConfig = {
  info: {
    icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950',
  },
  critical: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950',
  },
};

export function AlertsFeed({ alerts, isLoading }: AlertsFeedProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            Alert Recenti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 pt-0 sm:p-6 sm:pt-0">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-2 sm:gap-3">
              <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-3 sm:h-4 w-3/4" />
                <Skeleton className="h-2 sm:h-3 w-1/2 mt-1" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          Alert Recenti
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-xs sm:text-sm" asChild>
          <Link href="/alerts">Vedi tutti</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        {alerts.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 text-sm">
            Nessun alert recente
          </p>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {alerts.slice(0, 5).map((alert) => {
              const config = severityConfig[alert.severity];
              const Icon = config.icon;

              return (
                <div
                  key={alert.id}
                  className={`flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${config.bg}`}
                >
                  <div className={`flex-shrink-0 ${config.color}`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 sm:gap-2">
                      <p className="font-medium text-xs sm:text-sm line-clamp-1">
                        {alert.title}
                      </p>
                      <Badge
                        variant={
                          alert.status === 'resolved'
                            ? 'secondary'
                            : alert.status === 'acknowledged'
                            ? 'outline'
                            : 'default'
                        }
                        className="flex-shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5"
                      >
                        {alert.status === 'resolved'
                          ? 'Risolto'
                          : alert.status === 'acknowledged'
                          ? 'Preso in carico'
                          : 'Attivo'}
                      </Badge>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                      {alert.message}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                      {formatDistanceToNow(new Date(alert.created_at), {
                        addSuffix: true,
                        locale: it,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

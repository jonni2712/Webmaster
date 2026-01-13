'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Bell,
  Filter,
  RefreshCw,
  Download,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface Alert {
  id: string;
  site_id: string;
  site_name: string;
  site_url: string;
  trigger_type: 'site_down' | 'ssl_expiring' | 'ssl_invalid' | 'performance_degraded' | 'update_available' | 'update_critical' | 'ecommerce_anomaly';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  status: 'triggered' | 'acknowledged' | 'resolved';
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  pending_updates: number;
  critical_updates: number;
}

const severityConfig = {
  critical: { color: 'bg-red-500', icon: XCircle, label: 'Critico' },
  warning: { color: 'bg-yellow-500', icon: AlertTriangle, label: 'Attenzione' },
  info: { color: 'bg-blue-500', icon: Bell, label: 'Info' },
};

const typeLabels: Record<string, string> = {
  site_down: 'Uptime',
  ssl_expiring: 'SSL',
  ssl_invalid: 'SSL',
  performance_degraded: 'Performance',
  update_available: 'Aggiornamenti',
  update_critical: 'Aggiornamenti',
  ecommerce_anomaly: 'E-commerce',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchAlerts();
  }, [filter, typeFilter]);

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const res = await fetch(`/api/alerts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const activeAlerts = alerts.filter((a) => a.status === 'triggered').length;
  const acknowledgedAlerts = alerts.filter(
    (a) => a.status === 'acknowledged'
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Alerts</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestisci gli avvisi dei tuoi siti
          </p>
        </div>
        <Button onClick={fetchAlerts} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Aggiorna</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Alert Attivi</CardTitle>
            <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{activeAlerts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">In Gestione</CardTitle>
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{acknowledgedAlerts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Totale</CardTitle>
            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[120px] sm:w-[150px] h-9">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="triggered">Attivi</SelectItem>
              <SelectItem value="acknowledged">In gestione</SelectItem>
              <SelectItem value="resolved">Risolti</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[120px] sm:w-[150px] h-9">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i tipi</SelectItem>
            <SelectItem value="site_down">Uptime</SelectItem>
            <SelectItem value="ssl_expiring">SSL</SelectItem>
            <SelectItem value="update_critical">Aggiornamenti</SelectItem>
            <SelectItem value="ecommerce_anomaly">E-commerce</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts List */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-6 sm:py-8 text-center text-muted-foreground text-sm">
              Caricamento...
            </CardContent>
          </Card>
        ) : alerts.length === 0 ? (
          <Card>
            <CardContent className="py-6 sm:py-8 text-center">
              <CheckCircle className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-green-500 mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg font-medium">Nessun alert</p>
              <p className="text-sm text-muted-foreground">
                Tutti i tuoi siti stanno funzionando correttamente
              </p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;

            return (
              <Card
                key={alert.id}
                className={
                  alert.status === 'resolved' ? 'opacity-60' : undefined
                }
              >
                <CardContent className="p-3 sm:py-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-2 sm:gap-4">
                      <div
                        className={`rounded-full p-1.5 sm:p-2 ${config.color} text-white flex-shrink-0`}
                      >
                        <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                          <span className="font-semibold text-sm sm:text-base">{alert.title}</span>
                          <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                            {typeLabels[alert.trigger_type] || alert.trigger_type}
                          </Badge>
                          <Badge
                            variant={
                              alert.status === 'triggered'
                                ? 'destructive'
                                : alert.status === 'acknowledged'
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className="text-[10px] sm:text-xs px-1.5 sm:px-2"
                          >
                            {alert.status === 'triggered'
                              ? 'Attivo'
                              : alert.status === 'acknowledged'
                                ? 'In gestione'
                                : 'Risolto'}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1 line-clamp-2">
                          {alert.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                          {alert.site_name && (
                            <Link
                              href={`/sites/${alert.site_id}`}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              <Globe className="h-3 w-3" />
                              {alert.site_name}
                            </Link>
                          )}
                          {alert.pending_updates > 0 && (
                            <Badge
                              variant={alert.critical_updates > 0 ? 'destructive' : 'secondary'}
                              className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${
                                alert.critical_updates > 0
                                  ? ''
                                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                              }`}
                            >
                              <Download className="h-2.5 w-2.5" />
                              {alert.pending_updates} update
                              {alert.critical_updates > 0 ? ` (${alert.critical_updates} critici)` : null}
                            </Badge>
                          )}
                          <span>
                            {formatDistanceToNow(new Date(alert.created_at), {
                              addSuffix: true,
                              locale: it,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-7 sm:ml-0 flex-shrink-0">
                      {alert.status === 'triggered' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          <span className="hidden sm:inline">Prendi in carico</span>
                          <span className="sm:hidden">Gestisci</span>
                        </Button>
                      )}
                      {alert.status !== 'resolved' && (
                        <Button
                          size="sm"
                          variant="default"
                          className="text-xs h-8"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Risolvi
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

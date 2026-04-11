'use client';

import { useState, useEffect } from 'react';
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
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/layout/stat-card';

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
    <div>
      <PageHeader
        title="Avvisi"
        description="Storico e gestione degli avvisi attivi"
        actions={
          <Button onClick={fetchAlerts} variant="outline" size="sm" className="h-8 text-sm">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Aggiorna
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Stats */}
        <div className="grid gap-3 grid-cols-3">
          <StatCard
            label="Alert Attivi"
            value={activeAlerts}
            icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          />
          <StatCard
            label="In Gestione"
            value={acknowledgedAlerts}
            icon={<Clock className="h-4 w-4 text-yellow-500" />}
          />
          <StatCard
            label="Totale"
            value={alerts.length}
            icon={<Bell className="h-4 w-4 text-zinc-400" />}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-zinc-400" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="triggered">Attivi</SelectItem>
              <SelectItem value="acknowledged">In gestione</SelectItem>
              <SelectItem value="resolved">Risolti</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-8 text-sm">
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
        {loading ? (
          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg px-4 py-8 text-center text-sm text-zinc-500">
            Caricamento...
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg py-10 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-emerald-500 mb-3" />
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Nessun alert</p>
            <p className="text-xs text-zinc-500 mt-1">
              Tutti i tuoi siti stanno funzionando correttamente
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg divide-y divide-zinc-200 dark:divide-white/5">
            {alerts.map((alert) => {
              const config = severityConfig[alert.severity];

              return (
                <div
                  key={alert.id}
                  className={`px-4 py-3 hover:bg-zinc-50 dark:hover:bg-white/[0.02] flex items-start justify-between gap-4 ${
                    alert.status === 'resolved' ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Severity dot */}
                    <span className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${config.color}`} />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">{alert.title}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider">
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
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          {alert.status === 'triggered'
                            ? 'Attivo'
                            : alert.status === 'acknowledged'
                              ? 'In gestione'
                              : 'Risolto'}
                        </Badge>
                      </div>

                      <p className="text-xs text-zinc-500 mb-1 line-clamp-1">{alert.message}</p>

                      <div className="flex flex-wrap items-center gap-3">
                        {alert.site_name && (
                          <Link
                            href={`/sites/${alert.site_id}`}
                            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
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
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-mono text-zinc-500">
                      {formatDistanceToNow(new Date(alert.created_at), {
                        addSuffix: true,
                        locale: it,
                      })}
                    </span>
                    {alert.status === 'triggered' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Gestisci
                      </Button>
                    )}
                    {alert.status !== 'resolved' && (
                      <Button
                        size="sm"
                        variant="default"
                        className="text-xs h-7 px-2"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Risolvi
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

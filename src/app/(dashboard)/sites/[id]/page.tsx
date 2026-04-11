'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Globe,
  Shield,
  Activity,
  Zap,
  ShoppingCart,
  RefreshCw,
  Settings,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Bell,
  Package,
  Server,
  Database,
  HardDrive,
  Cpu,
  Puzzle,
  Palette,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Download,
  Rocket,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/layout/stat-card';
import { AlertSettingsForm } from '@/components/sites/alert-settings-form';
import { UpdatesList } from '@/components/sites/updates-list';
import { SecurityTab } from '@/components/security/security-tab';
import { DateRangeSelector, getDateRangeFromPreset, type DateRange, type DateRangePreset } from '@/components/reports/date-range-selector';
import { UptimeChart } from '@/components/reports/uptime-chart';
import { ResponseTimeChart } from '@/components/reports/response-time-chart';
import { PerformanceChart } from '@/components/reports/performance-chart';
import { WebVitalsChart } from '@/components/reports/web-vitals-chart';
import { VercelConnectForm } from '@/components/sites/vercel-connect-form';
import { VercelDeploymentsList } from '@/components/sites/vercel-deployments-list';
import { NextJSInfoTab } from '@/components/sites/nextjs-info-tab';
import type { SiteAlertSettings } from '@/types/database';
import { formatDistanceToNow, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';

interface WPInfo {
  core?: {
    version: string;
    update_available: boolean;
    latest_version?: string;
    site_url?: string;
    home_url?: string;
    language?: string;
  };
  plugins?: {
    total: number;
    active: number;
    inactive: number;
    updates_available: number;
    list?: Array<{
      name: string;
      slug: string;
      version: string;
      active: boolean;
      update_available: boolean;
    }>;
  };
  themes?: {
    total: number;
    updates_available: number;
    active?: {
      name: string;
      version: string;
    };
    list?: Array<{
      name: string;
      slug: string;
      version: string;
      active: boolean;
      update_available: boolean;
    }>;
  };
  site_health?: {
    status: string;
  };
}

interface ServerInfo {
  php?: {
    version: string;
    memory_limit?: string;
    max_execution_time?: string;
    upload_max_filesize?: string;
  };
  database?: {
    type: string;
    version: string;
    charset?: string;
    total_size?: string;
    tables_count?: number;
  };
  server?: {
    software?: string;
    web_server?: string;
    os?: string;
    hostname?: string;
    https?: boolean;
  };
  disk?: {
    total?: string;
    free?: string;
    used?: string;
    used_percentage?: number;
    wordpress_size?: string;
  };
}

interface Site {
  id: string;
  name: string;
  url: string;
  platform: 'wordpress' | 'prestashop' | 'nextjs' | 'other';
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  ssl_status: 'valid' | 'expiring' | 'expired' | 'invalid' | null;
  ssl_expiry: string | null;
  uptime_percentage: number | null;
  response_time_avg: number | null;
  last_check: string | null;
  created_at: string;
  ssl_check_enabled: boolean;
  uptime_check_enabled: boolean;
  performance_check_enabled: boolean;
  updates_check_enabled: boolean;
  ecommerce_check_enabled: boolean;
  alert_settings: SiteAlertSettings | null;
  // WordPress specific
  wp_version?: string | null;
  php_version?: string | null;
  wp_info?: WPInfo | null;
  server_info?: ServerInfo | null;
  last_sync?: string | null;
  plugin_version?: string | null;
  api_key_encrypted?: string | null;
  // Vercel integration (Next.js)
  vercel_project_id?: string | null;
  vercel_team_id?: string | null;
  vercel_last_sync?: string | null;
}

interface UptimeCheck {
  id: string;
  status: 'up' | 'down' | 'degraded';
  response_time: number;
  status_code: number | null;
  created_at: string;
}

interface SSLCheck {
  id: string;
  valid: boolean;
  issuer: string | null;
  expires_at: string | null;
  created_at: string;
}

interface PerformanceCheck {
  id: string;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  performance_score: number | null;
  created_at: string;
}

export default function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [site, setSite] = useState<Site | null>(null);
  const [uptimeChecks, setUptimeChecks] = useState<UptimeCheck[]>([]);
  const [sslChecks, setSSLChecks] = useState<SSLCheck[]>([]);
  const [performanceChecks, setPerformanceChecks] = useState<PerformanceCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pluginsExpanded, setPluginsExpanded] = useState(false);
  const [themesExpanded, setThemesExpanded] = useState(false);
  // Report state
  const [reportDateRange, setReportDateRange] = useState<DateRange>(() => getDateRangeFromPreset('30d'));
  const [uptimeReportData, setUptimeReportData] = useState<any>(null);
  const [performanceReportData, setPerformanceReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('uptime');

  useEffect(() => {
    fetchSite();
    fetchChecks();
  }, [id]);

  const fetchSite = async () => {
    try {
      const res = await fetch(`/api/sites/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSite(data);
      } else if (res.status === 404) {
        router.push('/sites');
      }
    } catch (error) {
      console.error('Error fetching site:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChecks = async () => {
    try {
      const [uptimeRes, sslRes, perfRes] = await Promise.all([
        fetch(`/api/sites/${id}/uptime-checks?limit=50`),
        fetch(`/api/sites/${id}/ssl-checks?limit=10`),
        fetch(`/api/sites/${id}/performance-checks?limit=10`),
      ]);

      if (uptimeRes.ok) {
        const data = await uptimeRes.json();
        setUptimeChecks(data.checks || []);
      }
      if (sslRes.ok) {
        const data = await sslRes.json();
        setSSLChecks(data.checks || []);
      }
      if (perfRes.ok) {
        const data = await perfRes.json();
        setPerformanceChecks(data.checks || []);
      }
    } catch (error) {
      console.error('Error fetching checks:', error);
    }
  };

  const fetchReportData = async (range: DateRange) => {
    setReportLoading(true);
    const startISO = range.start.toISOString();
    const endISO = range.end.toISOString();

    try {
      const [uptimeRes, perfRes] = await Promise.all([
        fetch(`/api/sites/${id}/reports/uptime?start=${startISO}&end=${endISO}`),
        fetch(`/api/sites/${id}/reports/performance?start=${startISO}&end=${endISO}`),
      ]);

      if (uptimeRes.ok) {
        const data = await uptimeRes.json();
        setUptimeReportData(data);
      }
      if (perfRes.ok) {
        const data = await perfRes.json();
        setPerformanceReportData(data);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDateRangeChange = (range: DateRange) => {
    setReportDateRange(range);
    fetchReportData(range);
  };

  const exportCSV = () => {
    if (!uptimeReportData?.data || !performanceReportData?.data) {
      toast.error('Nessun dato disponibile per l\'esportazione');
      return;
    }

    // Merge uptime and performance data by date
    const dataMap = new Map<string, any>();

    uptimeReportData.data.forEach((d: any) => {
      dataMap.set(d.date, {
        date: d.date,
        uptime_percentage: d.uptime_percentage,
        total_checks: d.total_checks,
        avg_response_time: d.avg_response_time,
      });
    });

    performanceReportData.data.forEach((d: any) => {
      const existing = dataMap.get(d.date) || { date: d.date };
      dataMap.set(d.date, {
        ...existing,
        performance_score: d.avg_score,
        lcp: d.avg_lcp,
        fid: d.avg_fid,
        cls: d.avg_cls,
        fcp: d.avg_fcp,
        ttfb: d.avg_ttfb,
      });
    });

    const rows = Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Create CSV
    const headers = ['Data', 'Uptime %', 'Check Totali', 'Tempo Risposta (ms)', 'Performance Score', 'LCP (ms)', 'FID (ms)', 'CLS', 'FCP (ms)', 'TTFB (ms)'];
    const csvContent = [
      headers.join(','),
      ...rows.map(r => [
        r.date,
        r.uptime_percentage ?? '',
        r.total_checks ?? '',
        r.avg_response_time ?? '',
        r.performance_score ?? '',
        r.lcp ?? '',
        r.fid ?? '',
        r.cls ?? '',
        r.fcp ?? '',
        r.ttfb ?? '',
      ].join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `report-${site?.name || 'site'}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Report esportato con successo');
  };

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo sito? Questa azione non puo\' essere annullata.')) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/sites/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Sito eliminato');
        router.push('/sites');
      } else {
        toast.error('Errore nell\'eliminazione del sito');
      }
    } catch (error) {
      toast.error('Errore nell\'eliminazione del sito');
    } finally {
      setDeleting(false);
    }
  };

  const runSync = async () => {
    if (!site?.api_key_encrypted) {
      toast.error('API Key non configurata. Installa e configura il plugin WordPress.');
      return;
    }
    setSyncing(true);
    toast.info('Sincronizzazione in corso...');
    try {
      const res = await fetch(`/api/sites/${id}/sync`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Sincronizzazione completata');
        fetchSite();
      } else {
        toast.error(data.error || 'Errore durante la sincronizzazione');
      }
    } catch (error) {
      toast.error('Errore durante la sincronizzazione');
    } finally {
      setSyncing(false);
    }
  };

  const runCheck = async (type: 'uptime' | 'ssl' | 'performance') => {
    toast.info(`Controllo ${type} in corso...`);
    try {
      const res = await fetch(`/api/sites/${id}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Controllo completato');
        fetchSite();
        fetchChecks();
      } else if (data.error) {
        toast.error(data.error);
      } else if (!res.ok) {
        toast.error('Errore nel controllo');
      } else {
        toast.success('Controllo completato');
        fetchSite();
        fetchChecks();
      }
    } catch (error) {
      toast.error('Errore nel controllo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Sito non trovato</p>
        <Button variant="link" onClick={() => router.push('/sites')}>
          Torna alla lista siti
        </Button>
      </div>
    );
  }

  const statusConfig = {
    online: { color: 'bg-green-500', label: 'Online', icon: CheckCircle },
    offline: { color: 'bg-red-500', label: 'Offline', icon: XCircle },
    degraded: { color: 'bg-yellow-500', label: 'Degradato', icon: AlertTriangle },
    unknown: { color: 'bg-gray-500', label: 'Sconosciuto', icon: Clock },
  };

  const status = statusConfig[site.status] || statusConfig.unknown;
  const StatusIcon = status.icon;

  const tabDefs = [
    { label: 'Uptime', value: 'uptime' },
    { label: 'SSL', value: 'ssl' },
    { label: 'Performance', value: 'performance' },
    { label: 'Report', value: 'report' },
    ...(site.platform === 'wordpress' ? [{ label: 'Aggiornamenti', value: 'updates' }] : []),
    ...(site.platform === 'wordpress' ? [{ label: 'Server', value: 'wordpress' }] : []),
    ...(site.platform === 'nextjs' ? [{ label: 'Server', value: 'nextjs-info' }] : []),
    ...(site.ecommerce_check_enabled ? [{ label: 'E-commerce', value: 'ecommerce' }] : []),
    ...(site.platform === 'wordpress' ? [{ label: 'Sicurezza', value: 'security' }] : []),
    ...(site.platform === 'nextjs' ? [{ label: 'Vercel', value: 'vercel' }] : []),
    { label: 'Alert', value: 'alerts' },
  ];

  return (
    <div>
      <PageHeader
        title={site.name}
        description={site.url}
        tabs={tabDefs.map(t => ({
          ...t,
          active: activeTab === t.value,
        }))}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/sites/${id}/edit`)}>
              Modifica
            </Button>
            <Button
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={() => runCheck('uptime')}
            >
              Check ora
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border ${
            site.status === 'online'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              : site.status === 'offline'
              ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
              : site.status === 'degraded'
              ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/5'
          }`}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            {site.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Uptime"
            value={site.uptime_percentage !== null ? `${site.uptime_percentage.toFixed(2)}%` : 'N/A'}
            change={{ value: 'Ultimi 30 giorni' }}
            icon={<Activity className="h-4 w-4" />}
          />
          <StatCard
            label="Tempo Risposta"
            value={site.response_time_avg !== null ? `${site.response_time_avg}ms` : 'N/A'}
            change={{ value: 'Media' }}
            icon={<Zap className="h-4 w-4" />}
          />
          <StatCard
            label="SSL"
            value={
              site.ssl_status === 'valid' ? 'Valido' :
              site.ssl_status === 'expiring' ? 'In scadenza' :
              site.ssl_status === 'expired' ? 'Scaduto' : 'N/A'
            }
            change={site.ssl_expiry ? {
              value: `Scade: ${format(new Date(site.ssl_expiry), 'dd MMM yyyy', { locale: it })}`,
              positive: site.ssl_status === 'valid',
            } : undefined}
            icon={<Shield className="h-4 w-4" />}
          />
          <StatCard
            label="Ultimo Check"
            value={site.last_check
              ? formatDistanceToNow(new Date(site.last_check), { addSuffix: true, locale: it })
              : 'Mai'}
            icon={<Clock className="h-4 w-4" />}
          />
        </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val);
        if (val === 'report' && !uptimeReportData && !reportLoading) {
          fetchReportData(reportDateRange);
        }
      }} className="space-y-4">
        <TabsList className="hidden">
          {tabDefs.map(t => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* Uptime Tab */}
        <TabsContent value="uptime">
          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between">
              <span className="text-sm font-semibold">Cronologia Uptime</span>
              <Button size="sm" variant="outline" onClick={() => runCheck('uptime')}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Controlla ora
              </Button>
            </div>
            <div className="p-4">
              {uptimeChecks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun controllo disponibile
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-1 h-8">
                    {uptimeChecks.slice(0, 50).reverse().map((check) => (
                      <div
                        key={check.id}
                        className={`flex-1 rounded-sm ${
                          check.status === 'up'
                            ? 'bg-green-500'
                            : check.status === 'down'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                        }`}
                        title={`${format(new Date(check.created_at), 'dd/MM HH:mm')} - ${check.response_time}ms`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Meno recente</span>
                    <span>Piu' recente</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* SSL Tab */}
        <TabsContent value="ssl">
          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between">
              <span className="text-sm font-semibold">Certificato SSL</span>
              <Button size="sm" variant="outline" onClick={() => runCheck('ssl')}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Controlla ora
              </Button>
            </div>
            <div className="p-4">
              {sslChecks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun controllo SSL disponibile
                </p>
              ) : (
                <div className="space-y-2 sm:space-y-4">
                  {sslChecks.map((check) => (
                    <div
                      key={check.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-2 sm:gap-4"
                    >
                      <div className="flex items-center gap-2 sm:gap-4">
                        {check.valid ? (
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-sm sm:text-base">
                            {check.valid ? 'Certificato valido' : 'Certificato non valido'}
                          </p>
                          {check.issuer && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Emesso da: {check.issuer}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-left sm:text-right text-xs sm:text-sm text-muted-foreground ml-6 sm:ml-0">
                        {check.expires_at && (
                          <p>
                            Scade: {format(new Date(check.expires_at), 'dd MMM yyyy', { locale: it })}
                          </p>
                        )}
                        <p>
                          Controllato: {format(new Date(check.created_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between">
              <span className="text-sm font-semibold">Core Web Vitals</span>
              <Button size="sm" variant="outline" onClick={() => runCheck('performance')}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Controlla ora
              </Button>
            </div>
            <div className="p-4">
              {performanceChecks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun controllo performance disponibile
                </p>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {performanceChecks.slice(0, 1).map((check) => (
                    <div key={check.id} className="space-y-4">
                      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs sm:text-sm font-medium">LCP</span>
                            <span className="text-xs sm:text-sm">{check.lcp ? `${check.lcp}ms` : 'N/A'}</span>
                          </div>
                          <Progress
                            value={check.lcp ? Math.min((2500 / check.lcp) * 100, 100) : 0}
                            className="h-1.5 sm:h-2"
                          />
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            Obiettivo: &lt; 2500ms
                          </p>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs sm:text-sm font-medium">FID</span>
                            <span className="text-xs sm:text-sm">{check.fid ? `${check.fid}ms` : 'N/A'}</span>
                          </div>
                          <Progress
                            value={check.fid ? Math.min((100 / check.fid) * 100, 100) : 0}
                            className="h-1.5 sm:h-2"
                          />
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            Obiettivo: &lt; 100ms
                          </p>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs sm:text-sm font-medium">CLS</span>
                            <span className="text-xs sm:text-sm">{check.cls !== null ? check.cls.toFixed(3) : 'N/A'}</span>
                          </div>
                          <Progress
                            value={check.cls !== null ? Math.min((0.1 / check.cls) * 100, 100) : 0}
                            className="h-1.5 sm:h-2"
                          />
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            Obiettivo: &lt; 0.1
                          </p>
                        </div>
                      </div>
                      {check.performance_score !== null && (
                        <div className="text-center pt-3 sm:pt-4 border-t">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Performance Score</p>
                          <p className="text-3xl sm:text-4xl font-bold">{check.performance_score}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report">
          <div className="space-y-4">
            {/* Report Header with Date Selector */}
            <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold">Report Analitici</span>
                <div className="flex items-center gap-2">
                  <DateRangeSelector
                    value={reportDateRange}
                    onChange={handleDateRangeChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportCSV}
                    disabled={!uptimeReportData?.data?.length && !performanceReportData?.data?.length}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    CSV
                  </Button>
                </div>
              </div>
            </div>

            {reportLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                {(uptimeReportData?.summary || performanceReportData?.summary) && (
                  <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                    {uptimeReportData?.summary && (
                      <>
                        <StatCard
                          label="Uptime Medio"
                          value={`${uptimeReportData.summary.average_uptime.toFixed(2)}%`}
                          change={{ value: `${uptimeReportData.summary.total_checks} controlli totali` }}
                          icon={<Activity className="h-4 w-4" />}
                        />
                        <StatCard
                          label="Risposta Media"
                          value={`${uptimeReportData.summary.avg_response_time}ms`}
                          change={{ value: `P95: ${uptimeReportData.summary.p95_response_time}ms` }}
                          icon={<Zap className="h-4 w-4" />}
                        />
                      </>
                    )}
                    {performanceReportData?.summary && (
                      <>
                        <StatCard
                          label="Performance"
                          value={performanceReportData.summary.average_score}
                          change={{
                            value: performanceReportData.summary.score_trend === 'improving' ? 'In miglioramento' :
                                   performanceReportData.summary.score_trend === 'degrading' ? 'In peggioramento' : 'Stabile',
                            positive: performanceReportData.summary.score_trend === 'improving' ? true :
                                      performanceReportData.summary.score_trend === 'degrading' ? false : undefined,
                          }}
                          icon={<BarChart3 className="h-4 w-4" />}
                        />
                        <StatCard
                          label="LCP"
                          value={`${performanceReportData.summary.avg_lcp}ms`}
                          change={{ value: 'Largest Contentful Paint' }}
                          icon={<Clock className="h-4 w-4" />}
                        />
                      </>
                    )}
                  </div>
                )}

                {/* Uptime Chart */}
                <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
                    <span className="text-sm font-semibold">Uptime nel Tempo</span>
                  </div>
                  <div className="p-4">
                    <UptimeChart
                      data={uptimeReportData?.data || []}
                      slaTarget={99.9}
                      height={300}
                    />
                  </div>
                </div>

                {/* Response Time Chart */}
                <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
                    <span className="text-sm font-semibold">Tempi di Risposta</span>
                  </div>
                  <div className="p-4">
                    <ResponseTimeChart
                      data={uptimeReportData?.data || []}
                      height={300}
                      showRange={true}
                    />
                  </div>
                </div>

                {/* Performance Score Chart */}
                <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
                    <span className="text-sm font-semibold">Performance Score</span>
                  </div>
                  <div className="p-4">
                    <PerformanceChart
                      data={performanceReportData?.data || []}
                      height={300}
                    />
                  </div>
                </div>

                {/* Web Vitals Charts */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
                    <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
                      <span className="text-sm font-semibold">LCP (Largest Contentful Paint)</span>
                    </div>
                    <div className="p-4">
                      <WebVitalsChart
                        data={performanceReportData?.data || []}
                        metric="lcp"
                        height={250}
                      />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
                    <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
                      <span className="text-sm font-semibold">FID (First Input Delay)</span>
                    </div>
                    <div className="p-4">
                      <WebVitalsChart
                        data={performanceReportData?.data || []}
                        metric="fid"
                        height={250}
                      />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
                    <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
                      <span className="text-sm font-semibold">CLS (Cumulative Layout Shift)</span>
                    </div>
                    <div className="p-4">
                      <WebVitalsChart
                        data={performanceReportData?.data || []}
                        metric="cls"
                        height={250}
                      />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
                    <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
                      <span className="text-sm font-semibold">TTFB (Time To First Byte)</span>
                    </div>
                    <div className="p-4">
                      <WebVitalsChart
                        data={performanceReportData?.data || []}
                        metric="ttfb"
                        height={250}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Updates Tab */}
        {site.platform === 'wordpress' && (
          <TabsContent value="updates">
            <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
                <span className="text-sm font-semibold">Aggiornamenti</span>
              </div>
              <div className="p-4">
                <UpdatesList siteId={site.id} onSync={fetchSite} />
              </div>
            </div>
          </TabsContent>
        )}

        {/* WordPress/Server Tab */}
        {site.platform === 'wordpress' && (
          <TabsContent value="wordpress">
            <div className="grid gap-4 md:grid-cols-2">
              {/* WordPress Info Card */}
              <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm font-semibold">WordPress</span>
                </div>
                <div className="p-4">
                  {site.wp_info?.core ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Versione</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{site.wp_info.core.version}</span>
                          {site.wp_info.core.update_available && (
                            <Badge variant="destructive" className="text-xs">
                              Aggiornamento disponibile
                            </Badge>
                          )}
                        </div>
                      </div>
                      {site.wp_info.core.site_url && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Site URL</span>
                          <span className="text-sm truncate max-w-[200px]">{site.wp_info.core.site_url}</span>
                        </div>
                      )}
                      {site.wp_info.core.language && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Lingua</span>
                          <span className="text-sm">{site.wp_info.core.language}</span>
                        </div>
                      )}
                      {site.wp_info.plugins && (
                        <>
                          <hr className="my-2" />
                          <button
                            onClick={() => setPluginsExpanded(!pluginsExpanded)}
                            className="w-full flex justify-between items-center py-1 hover:bg-muted/50 rounded -mx-1 px-1"
                          >
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Puzzle className="h-3 w-3" /> Plugin ({site.wp_info.plugins.total})
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {site.wp_info.plugins.active} attivi, {site.wp_info.plugins.inactive} inattivi
                              </span>
                              {pluginsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </button>
                          {pluginsExpanded && site.wp_info.plugins.list && (
                            <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                              {site.wp_info.plugins.list.map((plugin, idx) => (
                                <div
                                  key={idx}
                                  className={`flex justify-between items-center p-2 rounded text-sm ${
                                    plugin.active ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${plugin.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    <span className="truncate">{plugin.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs text-muted-foreground">v{plugin.version}</span>
                                    {plugin.update_available && (
                                      <Badge variant="destructive" className="text-[10px] px-1">Update</Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {site.wp_info.plugins.updates_available > 0 && !pluginsExpanded && (
                            <div className="flex justify-between mt-1">
                              <span className="text-sm text-muted-foreground">Aggiornamenti disponibili</span>
                              <Badge variant="secondary">{site.wp_info.plugins.updates_available}</Badge>
                            </div>
                          )}
                        </>
                      )}
                      {site.wp_info.themes && (
                        <>
                          <hr className="my-2" />
                          <button
                            onClick={() => setThemesExpanded(!themesExpanded)}
                            className="w-full flex justify-between items-center py-1 hover:bg-muted/50 rounded -mx-1 px-1"
                          >
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Palette className="h-3 w-3" /> Temi ({site.wp_info.themes.total})
                            </span>
                            <div className="flex items-center gap-2">
                              {site.wp_info.themes.active && (
                                <span className="text-xs text-muted-foreground">
                                  Attivo: {site.wp_info.themes.active.name}
                                </span>
                              )}
                              {themesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </button>
                          {themesExpanded && site.wp_info.themes.list && (
                            <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                              {site.wp_info.themes.list.map((theme, idx) => (
                                <div
                                  key={idx}
                                  className={`flex justify-between items-center p-2 rounded text-sm ${
                                    theme.active ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${theme.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    <span className="truncate">{theme.name}</span>
                                    {theme.active && <Badge variant="outline" className="text-[10px]">Attivo</Badge>}
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs text-muted-foreground">v{theme.version}</span>
                                    {theme.update_available && (
                                      <Badge variant="destructive" className="text-[10px] px-1">Update</Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {site.wp_info.themes.updates_available > 0 && !themesExpanded && (
                            <div className="flex justify-between mt-1">
                              <span className="text-sm text-muted-foreground">Aggiornamenti disponibili</span>
                              <Badge variant="secondary">{site.wp_info.themes.updates_available}</Badge>
                            </div>
                          )}
                        </>
                      )}
                      {site.wp_info.site_health && (
                        <>
                          <hr className="my-2" />
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Site Health</span>
                            <Badge variant={
                              site.wp_info.site_health.status === 'good' ? 'default' :
                              site.wp_info.site_health.status === 'recommended' ? 'secondary' : 'destructive'
                            }>
                              {site.wp_info.site_health.status}
                            </Badge>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Dati WordPress non disponibili</p>
                      <p className="text-xs mt-1 mb-3">
                        {site.api_key_encrypted
                          ? 'Sincronizza il sito per ottenere i dati'
                          : 'Installa il plugin Webmaster Monitor e configura l\'API Key'}
                      </p>
                      {site.api_key_encrypted && (
                        <Button variant="outline" size="sm" onClick={runSync} disabled={syncing}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                          Sincronizza ora
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Server Info Card */}
              <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5 flex items-center gap-2">
                  <Server className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm font-semibold">Server</span>
                </div>
                <div className="p-4">
                  {site.server_info ? (
                    <div className="space-y-3">
                      {site.server_info.php && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Cpu className="h-3 w-3" /> PHP
                            </span>
                            <span className="font-medium">{site.server_info.php.version}</span>
                          </div>
                          {site.server_info.php.memory_limit && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Memory Limit</span>
                              <span className="text-sm">{site.server_info.php.memory_limit}</span>
                            </div>
                          )}
                          {site.server_info.php.max_execution_time && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Max Execution</span>
                              <span className="text-sm">{site.server_info.php.max_execution_time}s</span>
                            </div>
                          )}
                        </>
                      )}
                      {site.server_info.database && (
                        <>
                          <hr className="my-2" />
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Database className="h-3 w-3" /> Database
                            </span>
                            <span className="font-medium">{site.server_info.database.type} {site.server_info.database.version}</span>
                          </div>
                          {site.server_info.database.total_size && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Dimensione DB</span>
                              <span className="text-sm">{site.server_info.database.total_size}</span>
                            </div>
                          )}
                          {site.server_info.database.tables_count && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Tabelle</span>
                              <span className="text-sm">{site.server_info.database.tables_count}</span>
                            </div>
                          )}
                        </>
                      )}
                      {site.server_info.disk && (
                        <>
                          <hr className="my-2" />
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <HardDrive className="h-3 w-3" /> Disco
                            </span>
                            {site.server_info.disk.used_percentage !== undefined && (
                              <span className="font-medium">{site.server_info.disk.used_percentage}% usato</span>
                            )}
                          </div>
                          {site.server_info.disk.total && site.server_info.disk.free && (
                            <div className="space-y-1">
                              <Progress value={site.server_info.disk.used_percentage || 0} className="h-2" />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Libero: {site.server_info.disk.free}</span>
                                <span>Totale: {site.server_info.disk.total}</span>
                              </div>
                            </div>
                          )}
                          {site.server_info.disk.wordpress_size && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Dimensione WP</span>
                              <span className="text-sm">{site.server_info.disk.wordpress_size}</span>
                            </div>
                          )}
                        </>
                      )}
                      {site.server_info.server && (
                        <>
                          <hr className="my-2" />
                          {site.server_info.server.web_server && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Web Server</span>
                              <span className="text-sm">{site.server_info.server.web_server}</span>
                            </div>
                          )}
                          {site.server_info.server.os && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Sistema Op.</span>
                              <span className="text-sm">{site.server_info.server.os}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Dati server non disponibili</p>
                      <p className="text-xs mt-1 mb-3">
                        {site.api_key_encrypted
                          ? 'Sincronizza il sito per ottenere i dati'
                          : 'Installa il plugin e configura l\'API Key'}
                      </p>
                      {site.api_key_encrypted && (
                        <Button variant="outline" size="sm" onClick={runSync} disabled={syncing}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                          Sincronizza ora
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sync Info Card */}
              <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg md:col-span-2">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm font-semibold">Sincronizzazione</span>
                </div>
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-zinc-500">Ultima sincronizzazione: </span>
                        <span className="font-medium">
                          {site.last_sync
                            ? formatDistanceToNow(new Date(site.last_sync), { addSuffix: true, locale: it })
                            : 'Mai sincronizzato'}
                        </span>
                      </p>
                      {site.plugin_version && (
                        <p className="text-sm">
                          <span className="text-zinc-500">Versione plugin: </span>
                          <Badge variant="outline">{site.plugin_version}</Badge>
                        </p>
                      )}
                      {site.api_key_encrypted && (
                        <p className="text-sm text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Plugin collegato
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={runSync}
                      disabled={syncing || !site.api_key_encrypted}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Sincronizzazione...' : 'Sincronizza'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {/* E-commerce Tab */}
        {site.ecommerce_check_enabled && (
          <TabsContent value="ecommerce">
            <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
                <span className="text-sm font-semibold">E-commerce</span>
              </div>
              <div className="p-4">
                <p className="text-center text-zinc-500 py-8 text-sm">
                  Funzionalita' e-commerce in arrivo
                </p>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Security Tab */}
        {site.platform === 'wordpress' && (
          <TabsContent value="security">
            <SecurityTab siteId={site.id} siteName={site.name} />
          </TabsContent>
        )}

        {/* Vercel Tab (Next.js) */}
        {site.platform === 'nextjs' && (
          <TabsContent value="vercel">
            <div className="space-y-4">
              <VercelConnectForm
                siteId={site.id}
                isConnected={!!site.vercel_project_id}
                projectName={site.vercel_project_id || undefined}
                lastSync={site.vercel_last_sync || undefined}
                onConnect={fetchSite}
              />
              <VercelDeploymentsList
                siteId={site.id}
                isConnected={!!site.vercel_project_id}
              />
            </div>
          </TabsContent>
        )}

        {/* Next.js Server Info Tab */}
        {site.platform === 'nextjs' && (
          <TabsContent value="nextjs-info">
            <NextJSInfoTab
              siteId={site.id}
              nextjsInfo={site.wp_info as any}
              serverInfo={site.server_info as any}
              lastSync={site.last_sync || null}
              apiKeyConfigured={!!site.api_key_encrypted}
            />
          </TabsContent>
        )}

        {/* Alert Settings Tab */}
        <TabsContent value="alerts">
          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
              <span className="text-sm font-semibold">Impostazioni Alert</span>
            </div>
            <div className="p-4">
              <AlertSettingsForm
                siteId={site.id}
                initialSettings={site.alert_settings}
                onUpdate={fetchSite}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

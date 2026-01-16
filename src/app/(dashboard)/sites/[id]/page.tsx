'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" onClick={() => router.push('/sites')}>
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-3xl font-bold truncate">{site.name}</h1>
              <Badge className={`${status.color} text-xs sm:text-sm`}>
                <StatusIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm sm:text-base text-muted-foreground hover:text-primary flex items-center gap-1 mt-1 truncate"
            >
              <span className="truncate">{site.url}</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          </div>
        </div>
        <div className="flex gap-2 ml-10 sm:ml-0">
          <Button variant="outline" size="sm" onClick={() => router.push(`/sites/${id}/edit`)}>
            <Settings className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Modifica</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Elimina</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {site.uptime_percentage !== null
                ? `${site.uptime_percentage.toFixed(2)}%`
                : 'N/A'}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Ultimi 30 giorni</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Tempo Risposta</CardTitle>
            <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {site.response_time_avg !== null
                ? `${site.response_time_avg}ms`
                : 'N/A'}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Media</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">SSL</CardTitle>
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {site.ssl_status === 'valid' ? (
                <span className="text-green-500">Valido</span>
              ) : site.ssl_status === 'expiring' ? (
                <span className="text-yellow-500">In scadenza</span>
              ) : site.ssl_status === 'expired' ? (
                <span className="text-red-500">Scaduto</span>
              ) : (
                'N/A'
              )}
            </div>
            {site.ssl_expiry && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Scade: {format(new Date(site.ssl_expiry), 'dd MMM yyyy', { locale: it })}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Ultimo Check</CardTitle>
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {site.last_check
                ? formatDistanceToNow(new Date(site.last_check), {
                    addSuffix: true,
                    locale: it,
                  })
                : 'Mai'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="uptime" className="space-y-4">
        <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="uptime" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Uptime</span>
          </TabsTrigger>
          <TabsTrigger value="ssl" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">SSL</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Perf.</span>
          </TabsTrigger>
          <TabsTrigger
            value="report"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
            onClick={() => {
              if (!uptimeReportData && !reportLoading) {
                fetchReportData(reportDateRange);
              }
            }}
          >
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Report</span>
          </TabsTrigger>
          {site.platform === 'wordpress' && (
            <TabsTrigger value="updates" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Update</span>
            </TabsTrigger>
          )}
          {site.platform === 'wordpress' && (
            <TabsTrigger value="wordpress" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <Server className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Server</span>
            </TabsTrigger>
          )}
          {site.ecommerce_check_enabled && (
            <TabsTrigger value="ecommerce" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">E-com.</span>
            </TabsTrigger>
          )}
          {site.platform === 'wordpress' && (
            <TabsTrigger value="security" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Security</span>
            </TabsTrigger>
          )}
          {site.platform === 'nextjs' && (
            <TabsTrigger value="vercel" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <Rocket className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Vercel</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="alerts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Alert</span>
          </TabsTrigger>
        </TabsList>

        {/* Uptime Tab */}
        <TabsContent value="uptime">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg">Cronologia Uptime</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Ultimi 50 controlli</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => runCheck('uptime')}>
                  <RefreshCw className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Controlla ora</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* SSL Tab */}
        <TabsContent value="ssl">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg">Certificato SSL</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Dettagli e cronologia</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => runCheck('ssl')}>
                  <RefreshCw className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Controlla ora</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg">Core Web Vitals</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Metriche di performance</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => runCheck('performance')}>
                  <RefreshCw className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Controlla ora</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report">
          <div className="space-y-4">
            {/* Report Header with Date Selector */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Report Analitici</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Analisi dettagliata delle prestazioni del sito
                    </CardDescription>
                  </div>
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
                      <Download className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">CSV</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {reportLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                {(uptimeReportData?.summary || performanceReportData?.summary) && (
                  <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                    {uptimeReportData?.summary && (
                      <>
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">Uptime Medio</CardTitle>
                            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                            <div className={`text-xl sm:text-2xl font-bold ${
                              uptimeReportData.summary.average_uptime >= 99.5 ? 'text-green-500' :
                              uptimeReportData.summary.average_uptime >= 95 ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                              {uptimeReportData.summary.average_uptime.toFixed(2)}%
                            </div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              {uptimeReportData.summary.total_checks} controlli totali
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">Risposta Media</CardTitle>
                            <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-bold">
                              {uptimeReportData.summary.avg_response_time}ms
                            </div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              P95: {uptimeReportData.summary.p95_response_time}ms
                            </p>
                          </CardContent>
                        </Card>
                      </>
                    )}
                    {performanceReportData?.summary && (
                      <>
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">Performance</CardTitle>
                            <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                            <div className={`text-xl sm:text-2xl font-bold ${
                              performanceReportData.summary.average_score >= 90 ? 'text-green-500' :
                              performanceReportData.summary.average_score >= 50 ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                              {performanceReportData.summary.average_score}
                            </div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              Trend: {performanceReportData.summary.score_trend === 'improving' ? 'In miglioramento' :
                                      performanceReportData.summary.score_trend === 'degrading' ? 'In peggioramento' : 'Stabile'}
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">LCP</CardTitle>
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                            <div className={`text-xl sm:text-2xl font-bold ${
                              performanceReportData.summary.lcp_status === 'good' ? 'text-green-500' :
                              performanceReportData.summary.lcp_status === 'needs-improvement' ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                              {performanceReportData.summary.avg_lcp}ms
                            </div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              Largest Contentful Paint
                            </p>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                )}

                {/* Uptime Chart */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Uptime nel Tempo</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Percentuale di disponibilita' giornaliera
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                    <UptimeChart
                      data={uptimeReportData?.data || []}
                      slaTarget={99.9}
                      height={300}
                    />
                  </CardContent>
                </Card>

                {/* Response Time Chart */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Tempi di Risposta</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Media, minimo e massimo tempi di risposta
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                    <ResponseTimeChart
                      data={uptimeReportData?.data || []}
                      height={300}
                      showRange={true}
                    />
                  </CardContent>
                </Card>

                {/* Performance Score Chart */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Performance Score</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Punteggio complessivo delle prestazioni
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                    <PerformanceChart
                      data={performanceReportData?.data || []}
                      height={300}
                    />
                  </CardContent>
                </Card>

                {/* Web Vitals Charts */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg">LCP (Largest Contentful Paint)</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Tempo di caricamento dell'elemento principale
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                      <WebVitalsChart
                        data={performanceReportData?.data || []}
                        metric="lcp"
                        height={250}
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg">FID (First Input Delay)</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Tempo di risposta alla prima interazione
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                      <WebVitalsChart
                        data={performanceReportData?.data || []}
                        metric="fid"
                        height={250}
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg">CLS (Cumulative Layout Shift)</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Stabilita' visiva della pagina
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                      <WebVitalsChart
                        data={performanceReportData?.data || []}
                        metric="cls"
                        height={250}
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg">TTFB (Time To First Byte)</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Tempo di risposta del server
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                      <WebVitalsChart
                        data={performanceReportData?.data || []}
                        metric="ttfb"
                        height={250}
                      />
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Updates Tab */}
        {site.platform === 'wordpress' && (
          <TabsContent value="updates">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Aggiornamenti</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Plugin, temi e core WordPress disponibili per l'aggiornamento
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <UpdatesList siteId={site.id} onSync={fetchSite} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* WordPress/Server Tab */}
        {site.platform === 'wordpress' && (
          <TabsContent value="wordpress">
            <div className="grid gap-4 md:grid-cols-2">
              {/* WordPress Info Card */}
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    WordPress
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
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
                </CardContent>
              </Card>

              {/* Server Info Card */}
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Server
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
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
                </CardContent>
              </Card>

              {/* Sync Info Card */}
              <Card className="md:col-span-2">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Sincronizzazione
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Ultima sincronizzazione: </span>
                        <span className="font-medium">
                          {site.last_sync
                            ? formatDistanceToNow(new Date(site.last_sync), { addSuffix: true, locale: it })
                            : 'Mai sincronizzato'}
                        </span>
                      </p>
                      {site.plugin_version && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Versione plugin: </span>
                          <Badge variant="outline">{site.plugin_version}</Badge>
                        </p>
                      )}
                      {site.api_key_encrypted && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Plugin collegato
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={runSync}
                      disabled={syncing || !site.api_key_encrypted}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Sincronizzazione...' : 'Sincronizza'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* E-commerce Tab */}
        {site.ecommerce_check_enabled && (
          <TabsContent value="ecommerce">
            <Card>
              <CardHeader>
                <CardTitle>E-commerce</CardTitle>
                <CardDescription>Monitoraggio vendite e transazioni</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Funzionalita' e-commerce in arrivo
                </p>
              </CardContent>
            </Card>
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

        {/* Alert Settings Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Impostazioni Alert</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configura le soglie e le preferenze di notifica per questo sito
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <AlertSettingsForm
                siteId={site.id}
                initialSettings={site.alert_settings}
                onUpdate={fetchSite}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

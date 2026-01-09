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
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';

interface Site {
  id: string;
  name: string;
  url: string;
  platform: 'wordpress' | 'prestashop' | 'other';
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

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo sito? Questa azione non puo essere annullata.')) {
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

  const runCheck = async (type: 'uptime' | 'ssl' | 'performance') => {
    toast.info(`Controllo ${type} in corso...`);
    try {
      const res = await fetch(`/api/sites/${id}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        toast.success('Controllo completato');
        fetchSite();
        fetchChecks();
      } else {
        toast.error('Errore nel controllo');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/sites')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{site.name}</h1>
              <Badge className={status.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              {site.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/sites/${id}/edit`)}>
            <Settings className="h-4 w-4 mr-2" />
            Modifica
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            Elimina
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {site.uptime_percentage !== null
                ? `${site.uptime_percentage.toFixed(2)}%`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Ultimi 30 giorni</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tempo Risposta</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {site.response_time_avg !== null
                ? `${site.response_time_avg}ms`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Media</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SSL</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
              <p className="text-xs text-muted-foreground">
                Scade: {format(new Date(site.ssl_expiry), 'dd MMM yyyy', { locale: it })}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ultimo Check</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
        <TabsList>
          <TabsTrigger value="uptime" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Uptime
          </TabsTrigger>
          <TabsTrigger value="ssl" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            SSL
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          {site.ecommerce_check_enabled && (
            <TabsTrigger value="ecommerce" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              E-commerce
            </TabsTrigger>
          )}
        </TabsList>

        {/* Uptime Tab */}
        <TabsContent value="uptime">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cronologia Uptime</CardTitle>
                  <CardDescription>Ultimi 50 controlli</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => runCheck('uptime')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Controlla ora
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                    <span>Piu recente</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SSL Tab */}
        <TabsContent value="ssl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Certificato SSL</CardTitle>
                  <CardDescription>Dettagli e cronologia</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => runCheck('ssl')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Controlla ora
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sslChecks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun controllo SSL disponibile
                </p>
              ) : (
                <div className="space-y-4">
                  {sslChecks.map((check) => (
                    <div
                      key={check.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {check.valid ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">
                            {check.valid ? 'Certificato valido' : 'Certificato non valido'}
                          </p>
                          {check.issuer && (
                            <p className="text-sm text-muted-foreground">
                              Emesso da: {check.issuer}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
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
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Core Web Vitals</CardTitle>
                  <CardDescription>Metriche di performance</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => runCheck('performance')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Controlla ora
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {performanceChecks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun controllo performance disponibile
                </p>
              ) : (
                <div className="space-y-6">
                  {performanceChecks.slice(0, 1).map((check) => (
                    <div key={check.id} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">LCP (Largest Contentful Paint)</span>
                            <span className="text-sm">{check.lcp ? `${check.lcp}ms` : 'N/A'}</span>
                          </div>
                          <Progress
                            value={check.lcp ? Math.min((2500 / check.lcp) * 100, 100) : 0}
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground">
                            Obiettivo: &lt; 2500ms
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">FID (First Input Delay)</span>
                            <span className="text-sm">{check.fid ? `${check.fid}ms` : 'N/A'}</span>
                          </div>
                          <Progress
                            value={check.fid ? Math.min((100 / check.fid) * 100, 100) : 0}
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground">
                            Obiettivo: &lt; 100ms
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">CLS (Cumulative Layout Shift)</span>
                            <span className="text-sm">{check.cls !== null ? check.cls.toFixed(3) : 'N/A'}</span>
                          </div>
                          <Progress
                            value={check.cls !== null ? Math.min((0.1 / check.cls) * 100, 100) : 0}
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground">
                            Obiettivo: &lt; 0.1
                          </p>
                        </div>
                      </div>
                      {check.performance_score !== null && (
                        <div className="text-center pt-4 border-t">
                          <p className="text-sm text-muted-foreground mb-2">Performance Score</p>
                          <p className="text-4xl font-bold">{check.performance_score}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                  Funzionalita e-commerce in arrivo
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

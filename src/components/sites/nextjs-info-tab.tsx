'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  RefreshCw,
  Server,
  Cpu,
  HardDrive,
  Package,
  Code,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Clock,
  Layers,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';

interface NextJSInfo {
  framework?: {
    name: string;
    version: string | null;
    react_version: string | null;
  };
  node?: {
    version: string;
    arch: string;
    platform: string;
  };
  dependencies?: {
    total: number;
    production: number;
    dev: number;
    key_packages: Array<{ name: string; version: string }>;
  };
  build?: {
    node_env: string;
    build_id: string | null;
    deployment_id: string | null;
  };
  environment?: {
    is_production: boolean;
    is_vercel: boolean;
    is_docker: boolean;
    region: string | null;
  };
  performance?: {
    process_uptime_seconds: number;
    memory_usage_mb: number;
    heap_used_mb: number;
    heap_total_mb: number;
  };
  health?: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: string;
  };
  custom?: Record<string, unknown>;
  monitor_version?: string;
}

interface ServerInfo {
  hostname?: string;
  uptime_seconds?: number;
  memory?: {
    total: string;
    free: string;
    used_percentage: number;
  };
  cpu?: {
    model: string;
    cores: number;
    load_avg: number[];
  };
}

interface NextJSInfoTabProps {
  siteId: string;
  nextjsInfo: NextJSInfo | null;
  serverInfo: ServerInfo | null;
  lastSync: string | null;
  apiKeyConfigured: boolean;
}

export function NextJSInfoTab({
  siteId,
  nextjsInfo,
  serverInfo,
  lastSync,
  apiKeyConfigured,
}: NextJSInfoTabProps) {
  const [syncing, setSyncing] = useState(false);
  const [localInfo, setLocalInfo] = useState(nextjsInfo);
  const [localServerInfo, setLocalServerInfo] = useState(serverInfo);
  const [localLastSync, setLocalLastSync] = useState(lastSync);

  const runSync = async () => {
    if (!apiKeyConfigured) {
      toast.error('API Key non configurata. Installa lo script di monitoraggio sul tuo sito Next.js.');
      return;
    }

    setSyncing(true);
    toast.info('Sincronizzazione in corso...');

    try {
      const res = await fetch(`/api/sites/${siteId}/nextjs/sync`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Sincronizzazione completata');
        // Update local state with new data
        if (data.data) {
          setLocalInfo({
            framework: data.data.framework,
            node: data.data.node,
            dependencies: data.data.dependencies,
            build: data.data.build,
            environment: data.data.environment,
            performance: data.data.performance,
            health: data.data.health,
            custom: data.data.custom,
            monitor_version: data.data.monitor_version,
          });
          setLocalServerInfo(data.data.server);
          setLocalLastSync(new Date().toISOString());
        }
      } else {
        toast.error(data.error || 'Errore durante la sincronizzazione');
      }
    } catch (error) {
      toast.error('Errore durante la sincronizzazione');
    } finally {
      setSyncing(false);
    }
  };

  const healthStatusConfig = {
    healthy: { color: 'bg-green-500', label: 'Healthy', icon: CheckCircle },
    degraded: { color: 'bg-yellow-500', label: 'Degraded', icon: AlertTriangle },
    unhealthy: { color: 'bg-red-500', label: 'Unhealthy', icon: XCircle },
  };

  const info = localInfo;
  const server = localServerInfo;
  const syncTime = localLastSync;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Framework & Build Info */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Framework
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {info?.framework ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Next.js</span>
                <Badge variant="outline">{info.framework.version || 'N/A'}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">React</span>
                <Badge variant="outline">{info.framework.react_version || 'N/A'}</Badge>
              </div>
              {info.node && (
                <>
                  <hr className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Code className="h-3 w-3" /> Node.js
                    </span>
                    <span className="font-medium">{info.node.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Piattaforma</span>
                    <span className="text-sm">{info.node.platform} ({info.node.arch})</span>
                  </div>
                </>
              )}
              {info.build && (
                <>
                  <hr className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ambiente</span>
                    <Badge variant={info.build.node_env === 'production' ? 'default' : 'secondary'}>
                      {info.build.node_env}
                    </Badge>
                  </div>
                  {info.build.deployment_id && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Deploy ID</span>
                      <span className="text-xs font-mono">{info.build.deployment_id.substring(0, 12)}</span>
                    </div>
                  )}
                </>
              )}
              {info.environment && (
                <>
                  <hr className="my-2" />
                  <div className="flex flex-wrap gap-2">
                    {info.environment.is_vercel && (
                      <Badge variant="outline" className="text-xs">Vercel</Badge>
                    )}
                    {info.environment.is_docker && (
                      <Badge variant="outline" className="text-xs">Docker</Badge>
                    )}
                    {info.environment.region && (
                      <Badge variant="outline" className="text-xs">{info.environment.region}</Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Dati framework non disponibili</p>
              <p className="text-xs mt-1 mb-3">
                {apiKeyConfigured
                  ? 'Sincronizza il sito per ottenere i dati'
                  : 'Installa lo script di monitoraggio e configura l\'API Key'}
              </p>
              {apiKeyConfigured && (
                <Button variant="outline" size="sm" onClick={runSync} disabled={syncing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  Sincronizza ora
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Server Info */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Server className="h-5 w-5" />
            Server
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {server ? (
            <div className="space-y-3">
              {server.hostname && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Hostname</span>
                  <span className="text-sm font-mono">{server.hostname}</span>
                </div>
              )}
              {server.uptime_seconds !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="text-sm">{formatUptime(server.uptime_seconds)}</span>
                </div>
              )}
              {server.cpu && (
                <>
                  <hr className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Cpu className="h-3 w-3" /> CPU
                    </span>
                    <span className="text-sm">{server.cpu.cores} cores</span>
                  </div>
                  {server.cpu.load_avg && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Load Average</span>
                      <span className="text-xs font-mono">
                        {server.cpu.load_avg.map(l => l.toFixed(2)).join(' ')}
                      </span>
                    </div>
                  )}
                </>
              )}
              {server.memory && (
                <>
                  <hr className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <HardDrive className="h-3 w-3" /> Memoria
                    </span>
                    <span className="font-medium">{server.memory.used_percentage}% usata</span>
                  </div>
                  <Progress value={server.memory.used_percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Libera: {server.memory.free}</span>
                    <span>Totale: {server.memory.total}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Dati server non disponibili</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dependencies */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Dipendenze
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {info?.dependencies ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-muted rounded">
                  <p className="text-2xl font-bold">{info.dependencies.total}</p>
                  <p className="text-xs text-muted-foreground">Totali</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-2xl font-bold">{info.dependencies.production}</p>
                  <p className="text-xs text-muted-foreground">Prod</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-2xl font-bold">{info.dependencies.dev}</p>
                  <p className="text-xs text-muted-foreground">Dev</p>
                </div>
              </div>
              {info.dependencies.key_packages && info.dependencies.key_packages.length > 0 && (
                <>
                  <hr className="my-2" />
                  <p className="text-sm font-medium">Pacchetti principali</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {info.dependencies.key_packages.map((pkg, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm p-1 rounded hover:bg-muted"
                      >
                        <span>{pkg.name}</span>
                        <Badge variant="secondary" className="text-xs">{pkg.version}</Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Dati dipendenze non disponibili</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health & Performance */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Stato & Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {info?.health ? (
            <div className="space-y-3">
              {/* Health Status */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Stato</span>
                <Badge className={healthStatusConfig[info.health.status]?.color || 'bg-gray-500'}>
                  {healthStatusConfig[info.health.status]?.label || info.health.status}
                </Badge>
              </div>

              {/* Health Checks */}
              {Object.entries(info.health.checks).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(info.health.checks).map(([check, passed]) => (
                    <div key={check} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{check.replace(/_/g, ' ')}</span>
                      {passed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Performance */}
              {info.performance && (
                <>
                  <hr className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Memoria processo</span>
                    <span className="text-sm">{info.performance.memory_usage_mb} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Heap</span>
                    <span className="text-sm">
                      {info.performance.heap_used_mb} / {info.performance.heap_total_mb} MB
                    </span>
                  </div>
                  <Progress
                    value={(info.performance.heap_used_mb / info.performance.heap_total_mb) * 100}
                    className="h-2"
                  />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Uptime processo</span>
                    <span className="text-sm">{formatUptime(info.performance.process_uptime_seconds)}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Dati performance non disponibili</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Info - Full Width */}
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
                  {syncTime
                    ? formatDistanceToNow(new Date(syncTime), { addSuffix: true, locale: it })
                    : 'Mai sincronizzato'}
                </span>
              </p>
              {info?.monitor_version && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Versione monitor: </span>
                  <Badge variant="outline">{info.monitor_version}</Badge>
                </p>
              )}
              {apiKeyConfigured && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Monitor configurato
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={runSync}
              disabled={syncing || !apiKeyConfigured}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizzazione...' : 'Sincronizza'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}g ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

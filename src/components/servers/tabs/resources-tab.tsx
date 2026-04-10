'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, MemoryStick, HardDrive } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface ResourceSnapshot {
  id: string;
  cpu_usage_percent: number | null;
  ram_total_mb: number | null;
  ram_used_mb: number | null;
  disk_total_gb: number | null;
  disk_used_gb: number | null;
  recorded_at: string;
}

interface ResourcesTabProps {
  snapshots: ResourceSnapshot[];
  latestResource: ResourceSnapshot | null;
}

export function ResourcesTab({ snapshots, latestResource }: ResourcesTabProps) {
  const chartData = snapshots.map(s => ({
    time: new Date(s.recorded_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    cpu: s.cpu_usage_percent ?? 0,
    ramPercent: s.ram_total_mb && s.ram_used_mb
      ? Math.round((s.ram_used_mb / s.ram_total_mb) * 100)
      : 0,
    diskPercent: s.disk_total_gb && s.disk_used_gb
      ? Math.round((s.disk_used_gb / s.disk_total_gb) * 100)
      : 0,
  }));

  const latest = latestResource;
  const ramPercent = latest?.ram_total_mb && latest?.ram_used_mb
    ? Math.round((latest.ram_used_mb / latest.ram_total_mb) * 100)
    : null;
  const diskPercent = latest?.disk_total_gb && latest?.disk_used_gb
    ? Math.round((latest.disk_used_gb / latest.disk_total_gb) * 100)
    : null;

  return (
    <div className="space-y-4">
      {/* Current values */}
      <div className="grid grid-cols-3 gap-3">
        <ResourceCard
          icon={Cpu}
          label="CPU"
          value={latest?.cpu_usage_percent != null ? `${latest.cpu_usage_percent}%` : '—'}
          percent={latest?.cpu_usage_percent ?? null}
        />
        <ResourceCard
          icon={MemoryStick}
          label="RAM"
          value={latest?.ram_used_mb != null && latest?.ram_total_mb
            ? `${Math.round(latest.ram_used_mb / 1024)}/${Math.round(latest.ram_total_mb / 1024)} GB`
            : '—'}
          percent={ramPercent}
        />
        <ResourceCard
          icon={HardDrive}
          label="Disco"
          value={latest?.disk_used_gb != null && latest?.disk_total_gb
            ? `${latest.disk_used_gb}/${latest.disk_total_gb} GB`
            : '—'}
          percent={diskPercent}
        />
      </div>

      {/* Charts */}
      {chartData.length > 1 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">CPU (ultime 24h)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="cpu" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.1} name="CPU %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">RAM (ultime 24h)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="ramPercent" stroke="#10B981" fill="#10B981" fillOpacity={0.1} name="RAM %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Disco (ultime 24h)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="diskPercent" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} name="Disco %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          Dati insufficienti per i grafici. I dati appariranno dopo qualche ciclo di sincronizzazione.
        </p>
      )}
    </div>
  );
}

function ResourceCard({ icon: Icon, label, value, percent }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  percent: number | null;
}) {
  const getColor = (p: number | null) => {
    if (p === null) return 'text-muted-foreground';
    if (p > 90) return 'text-red-500';
    if (p > 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-lg font-bold ${getColor(percent)}`}>{value}</p>
        {percent !== null && (
          <div className="mt-1.5 w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Globe, ShieldAlert, Cpu, Download, X, Check, AlertTriangle, Mail, Database } from 'lucide-react';

interface OverviewTabProps {
  stats: {
    total_accounts: number;
    total_domains: number;
    ssl_expiring: number;
    ssl_expired: number;
    pending_imports_count: number;
    cms_breakdown: Record<string, number>;
    unresolved_errors?: number;
    latest_resource?: {
      cpu_usage_percent: number | null;
      ram_total_mb: number | null;
      ram_used_mb: number | null;
      disk_total_gb: number | null;
      disk_used_gb: number | null;
    } | null;
    total_emails?: number;
    total_databases?: number;
  };
  pendingImports: Array<{
    id: string;
    domain: string;
    cms_type: string | null;
    cms_version: string | null;
  }>;
  serverId: string;
  onImportAction: () => void;
}

export function OverviewTab({ stats, pendingImports, serverId: _serverId, onImportAction }: OverviewTabProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleImportAction = useCallback(async (importId: string, action: 'import' | 'ignore') => {
    setActionLoading(importId);
    try {
      const res = await fetch(`/api/agent/imports/${importId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) onImportAction();
    } catch {
      // Ignore
    } finally {
      setActionLoading(null);
    }
  }, [onImportAction]);

  const totalCms = Object.values(stats.cms_breakdown).reduce((a, b) => a + b, 0);
  const totalSslProblems = stats.ssl_expiring + stats.ssl_expired;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Account" value={stats.total_accounts} />
        <KpiCard icon={Globe} label="Domini" value={stats.total_domains} />
        <KpiCard
          icon={ShieldAlert}
          label="SSL Problemi"
          value={totalSslProblems}
          variant={totalSslProblems > 0 ? 'warning' : 'default'}
        />
        <KpiCard icon={Cpu} label="CMS Rilevati" value={totalCms} />
        {stats.unresolved_errors != null && stats.unresolved_errors > 0 && (
          <KpiCard
            icon={AlertTriangle}
            label="Errori"
            value={stats.unresolved_errors}
            variant="warning"
          />
        )}
        {stats.total_emails != null && stats.total_emails > 0 && (
          <KpiCard icon={Mail} label="Email" value={stats.total_emails} />
        )}
        {stats.total_databases != null && stats.total_databases > 0 && (
          <KpiCard icon={Database} label="Database" value={stats.total_databases} />
        )}
      </div>

      {/* CMS Breakdown */}
      {Object.keys(stats.cms_breakdown).length > 0 && (
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm">CMS Rilevati</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.cms_breakdown).map(([cms, count]) => (
                <Badge key={cms} variant="secondary">
                  {cms} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Imports */}
      {pendingImports.length > 0 && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="p-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Download className="h-4 w-4" />
              {pendingImports.length} nuovi siti trovati
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {pendingImports.map((item) => (
              <PendingImportRow
                key={item.id}
                item={item}
                isLoading={actionLoading === item.id}
                onAction={handleImportAction}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface PendingImportRowProps {
  item: {
    id: string;
    domain: string;
    cms_type: string | null;
    cms_version: string | null;
  };
  isLoading: boolean;
  onAction: (id: string, action: 'import' | 'ignore') => void;
}

function PendingImportRow({ item, isLoading, onAction }: PendingImportRowProps) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
      <div className="flex items-center gap-2">
        <span className="font-medium">{item.domain}</span>
        {item.cms_type && (
          <Badge variant="outline" className="text-[10px] h-5">
            {item.cms_type} {item.cms_version}
          </Badge>
        )}
      </div>
      <div className="flex gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-green-600 hover:text-green-700"
          disabled={isLoading}
          onClick={() => onAction(item.id, 'import')}
          title="Importa"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          disabled={isLoading}
          onClick={() => onAction(item.id, 'ignore')}
          title="Ignora"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  variant?: 'default' | 'warning';
}

function KpiCard({ icon: Icon, label, value, variant = 'default' }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${variant === 'warning' ? 'text-yellow-500' : 'text-muted-foreground'}`} />
        <div>
          <p className={`text-lg font-bold ${variant === 'warning' ? 'text-yellow-600' : ''}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

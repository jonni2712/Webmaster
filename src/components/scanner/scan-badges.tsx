'use client';

import { Badge } from '@/components/ui/badge';
import { Globe, Mail, Lock, Gauge, MonitorSmartphone } from 'lucide-react';

interface ScanData {
  cms_detected?: string | null;
  cms_version?: string | null;
  cms_confidence?: string | null;
  dns_provider?: string | null;
  dns_a_records?: string[];
  email_provider?: string | null;
  spf_configured?: boolean;
  dmarc_configured?: boolean;
  ssl_valid?: boolean | null;
  ssl_issuer?: string | null;
  ssl_expires_at?: string | null;
  http_status?: number | null;
  http_response_time_ms?: number | null;
}

export function CmsBadge({ data }: { data: ScanData }) {
  if (!data.cms_detected) return null;

  return (
    <Badge variant="outline" className="text-[10px] h-5 gap-1">
      <MonitorSmartphone className="h-3 w-3" />
      {data.cms_detected}
      {data.cms_version && ` ${data.cms_version}`}
    </Badge>
  );
}

export function DnsBadge({ data }: { data: ScanData }) {
  if (!data.dns_provider && (!data.dns_a_records || data.dns_a_records.length === 0)) return null;

  return (
    <Badge variant="outline" className="text-[10px] h-5 gap-1">
      <Globe className="h-3 w-3" />
      {data.dns_provider || 'DNS'}
      {data.dns_a_records?.[0] && (
        <span className="text-muted-foreground">→ {data.dns_a_records[0]}</span>
      )}
    </Badge>
  );
}

export function EmailBadge({ data }: { data: ScanData }) {
  if (!data.email_provider) return null;

  return (
    <Badge variant="outline" className="text-[10px] h-5 gap-1">
      <Mail className="h-3 w-3" />
      {data.email_provider}
    </Badge>
  );
}

export function SecurityBadges({ data }: { data: ScanData }) {
  return (
    <div className="flex gap-1">
      {data.spf_configured != null && (
        <Badge
          variant={data.spf_configured ? 'default' : 'destructive'}
          className="text-[9px] h-4 px-1"
        >
          SPF {data.spf_configured ? '✓' : '✗'}
        </Badge>
      )}
      {data.dmarc_configured != null && (
        <Badge
          variant={data.dmarc_configured ? 'default' : 'destructive'}
          className="text-[9px] h-4 px-1"
        >
          DMARC {data.dmarc_configured ? '✓' : '✗'}
        </Badge>
      )}
    </div>
  );
}

export function SslBadge({ data }: { data: ScanData }) {
  if (data.ssl_valid == null) return null;

  let daysLeft: number | null = null;
  if (data.ssl_expires_at) {
    daysLeft = Math.ceil(
      (new Date(data.ssl_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  }

  const variant = data.ssl_valid
    ? daysLeft !== null && daysLeft < 14
      ? 'default'
      : 'default'
    : 'destructive';

  const color = data.ssl_valid
    ? daysLeft !== null && daysLeft < 14
      ? 'bg-yellow-500'
      : 'bg-green-600'
    : '';

  return (
    <Badge variant={variant} className={`text-[10px] h-5 gap-1 ${color}`}>
      <Lock className="h-3 w-3" />
      {data.ssl_valid ? 'SSL' : 'SSL ✗'}
      {daysLeft !== null && daysLeft < 30 && ` (${daysLeft}g)`}
    </Badge>
  );
}

export function HttpBadge({ data }: { data: ScanData }) {
  if (data.http_status == null) return null;

  const variant = data.http_status < 300
    ? 'default'
    : data.http_status < 400
    ? 'secondary'
    : 'destructive';

  const color = data.http_status < 300 ? 'bg-green-600' : '';

  return (
    <Badge variant={variant} className={`text-[10px] h-5 gap-1 ${color}`}>
      <Gauge className="h-3 w-3" />
      {data.http_status}
      {data.http_response_time_ms != null && (
        <span className="text-muted-foreground">{data.http_response_time_ms}ms</span>
      )}
    </Badge>
  );
}

/** All badges in a compact row */
export function ScanBadgesRow({ data }: { data: ScanData }) {
  return (
    <div className="flex flex-wrap gap-1">
      <HttpBadge data={data} />
      <CmsBadge data={data} />
      <DnsBadge data={data} />
      <SslBadge data={data} />
      <EmailBadge data={data} />
      <SecurityBadges data={data} />
    </div>
  );
}

'use client';

import { Badge } from '@/components/ui/badge';

interface DnsZone {
  domain: string;
  records: Array<{ type: string; name: string; value: string; priority?: number }>;
  points_to_server: boolean;
  resolved_ip: string | null;
}

interface DnsTabProps {
  zones: DnsZone[];
}

export function DnsTab({ zones }: DnsTabProps) {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_80px_130px_120px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
        <span>Dominio</span>
        <span>Punta a</span>
        <span>IP Risolto</span>
        <span>Stato</span>
      </div>

      {zones.map(zone => (
        <div
          key={zone.domain}
          className="grid grid-cols-[1fr_80px_130px_120px] gap-2 px-3 py-2 text-sm border-b last:border-0 items-center"
        >
          <span className="font-medium truncate">{zone.domain}</span>
          <span className="text-xs text-muted-foreground">
            {zone.points_to_server ? 'Questo' : 'Altro'}
          </span>
          <span className="text-xs font-mono">{zone.resolved_ip ?? '—'}</span>
          <PointingBadge pointsHere={zone.points_to_server} resolvedIp={zone.resolved_ip} />
        </div>
      ))}

      {zones.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nessuna zona DNS trovata</p>
      )}
    </div>
  );
}

interface PointingBadgeProps {
  pointsHere: boolean;
  resolvedIp: string | null;
}

function PointingBadge({ pointsHere, resolvedIp }: PointingBadgeProps) {
  if (!resolvedIp) {
    return <Badge variant="outline" className="text-[10px]">⚪ Non risolto</Badge>;
  }
  if (pointsHere) {
    return <Badge variant="default" className="text-[10px] bg-green-600">🟢 Corretto</Badge>;
  }
  return <Badge variant="destructive" className="text-[10px]">🔴 Non punta qui</Badge>;
}

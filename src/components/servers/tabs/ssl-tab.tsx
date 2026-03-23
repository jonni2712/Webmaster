'use client';

import { Badge } from '@/components/ui/badge';

interface SslCert {
  domain: string;
  issuer: string | null;
  expires_at: string | null;
  auto_ssl: boolean;
  status: string;
}

interface SslTabProps {
  certs: SslCert[];
}

export function SslTab({ certs }: SslTabProps) {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_120px_100px_70px_80px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
        <span>Dominio</span>
        <span>Issuer</span>
        <span>Scadenza</span>
        <span>AutoSSL</span>
        <span>Stato</span>
      </div>

      {certs.map(cert => (
        <div
          key={cert.domain}
          className="grid grid-cols-[1fr_120px_100px_70px_80px] gap-2 px-3 py-2 text-sm border-b last:border-0 items-center"
        >
          <span className="font-medium truncate">{cert.domain}</span>
          <span className="text-xs text-muted-foreground truncate">{cert.issuer ?? '—'}</span>
          <span className="text-xs">
            {cert.expires_at
              ? new Date(cert.expires_at).toLocaleDateString('it-IT')
              : '—'}
          </span>
          <span className="text-xs">{cert.auto_ssl ? '✓' : '—'}</span>
          <SslStatusBadge status={cert.status} />
        </div>
      ))}

      {certs.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nessun certificato SSL trovato</p>
      )}
    </div>
  );
}

function SslStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'valid':
      return <Badge variant="default" className="text-[10px] bg-green-600">Valido</Badge>;
    case 'expiring':
      return <Badge variant="default" className="text-[10px] bg-yellow-500">In scadenza</Badge>;
    case 'expired':
      return <Badge variant="destructive" className="text-[10px]">Scaduto</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">Errore</Badge>;
  }
}

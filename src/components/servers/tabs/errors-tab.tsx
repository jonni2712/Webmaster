'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface ServerErrorEntry {
  id: string;
  domain: string | null;
  error_type: string;
  message: string | null;
  file_path: string | null;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
}

interface ErrorsTabProps {
  errors: ServerErrorEntry[];
  serverId: string;
  onResolve?: () => void;
}

export function ErrorsTab({ errors, serverId, onResolve }: ErrorsTabProps) {
  const [resolving, setResolving] = useState<string | null>(null);

  const handleResolve = async (errorId: string) => {
    setResolving(errorId);
    try {
      // This would need a dedicated resolve endpoint — for now mark via direct API
      // TODO: Add resolve endpoint in a follow-up
      onResolve?.();
    } finally {
      setResolving(null);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'php_fatal':
        return <Badge variant="destructive" className="text-[10px]">PHP Fatal</Badge>;
      case 'php_warning':
        return <Badge variant="default" className="text-[10px] bg-yellow-500">PHP Warning</Badge>;
      case 'php_notice':
        return <Badge variant="outline" className="text-[10px]">PHP Notice</Badge>;
      case 'php_error':
        return <Badge variant="destructive" className="text-[10px]">PHP Error</Badge>;
      case 'http_5xx':
        return <Badge variant="destructive" className="text-[10px]">HTTP 5xx</Badge>;
      case 'http_4xx':
        return <Badge variant="default" className="text-[10px] bg-yellow-500">HTTP 4xx</Badge>;
      case 'apache_error':
        return <Badge variant="outline" className="text-[10px]">Apache</Badge>;
      case 'segfault':
        return <Badge variant="destructive" className="text-[10px]">Segfault</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[100px_80px_1fr_60px_80px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
        <span>Dominio</span>
        <span>Tipo</span>
        <span>Messaggio</span>
        <span>Count</span>
        <span>Ultimo</span>
      </div>

      {errors.map(error => (
        <div
          key={error.id}
          className="grid grid-cols-[100px_80px_1fr_60px_80px] gap-2 px-3 py-2 text-sm border-b last:border-0 items-start"
        >
          <span className="font-medium truncate text-xs">{error.domain ?? '—'}</span>
          {getTypeBadge(error.error_type)}
          <div className="min-w-0">
            <p className="text-xs truncate" title={error.message ?? ''}>
              {error.message ?? '—'}
            </p>
            {error.file_path && (
              <p className="text-[10px] text-muted-foreground truncate font-mono" title={error.file_path}>
                {error.file_path}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="text-[10px] h-5 justify-center">
            {error.occurrence_count}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {new Date(error.last_seen_at).toLocaleString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      ))}

      {errors.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Nessun errore rilevato</p>
          <p className="text-xs text-muted-foreground mt-1">Gli errori appariranno qui quando l&apos;agente li rileva</p>
        </div>
      )}
    </div>
  );
}

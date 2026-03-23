'use client';

import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';

interface DatabaseEntry {
  id: string;
  name: string;
  engine: string;
  size_mb: number | null;
  server_account_id: string;
}

interface DatabasesTabProps {
  databases: DatabaseEntry[];
  accounts: Array<{ id: string; username: string; main_domain: string }>;
}

export function DatabasesTab({ databases, accounts }: DatabasesTabProps) {
  const grouped = accounts.map(account => ({
    ...account,
    databases: databases.filter(d => d.server_account_id === account.id),
  })).filter(g => g.databases.length > 0);

  const totalSize = databases.reduce((sum, db) => sum + (db.size_mb ?? 0), 0);

  return (
    <div className="space-y-1">
      {/* Summary */}
      <div className="flex items-center gap-4 px-3 py-2 text-sm text-muted-foreground border-b">
        <span>{databases.length} database totali</span>
        <span>•</span>
        <span>{totalSize > 1024 ? `${(totalSize / 1024).toFixed(1)} GB` : `${Math.round(totalSize)} MB`} totali</span>
      </div>

      <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
        <span>Database</span>
        <span>Engine</span>
        <span>Dimensione</span>
      </div>

      {grouped.map(group => (
        <div key={group.id}>
          <div className="px-3 py-1.5 bg-muted/30 text-xs font-medium text-muted-foreground">
            {group.main_domain} ({group.username})
          </div>
          {group.databases.map(db => (
            <div
              key={db.id}
              className="grid grid-cols-[1fr_80px_80px] gap-2 px-3 py-1.5 text-sm border-b last:border-0 items-center"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Database className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate font-mono text-xs">{db.name}</span>
              </div>
              <Badge variant="outline" className="text-[10px] h-5 w-fit">
                {db.engine}
              </Badge>
              <span className="text-xs">
                {db.size_mb != null
                  ? db.size_mb > 1024
                    ? `${(db.size_mb / 1024).toFixed(1)} GB`
                    : `${Math.round(db.size_mb)} MB`
                  : '—'}
              </span>
            </div>
          ))}
        </div>
      ))}

      {grouped.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nessun database trovato</p>
      )}
    </div>
  );
}

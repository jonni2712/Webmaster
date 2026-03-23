'use client';

import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CmsDetection {
  domain: string;
  cms_type: string;
  cms_version: string | null;
  server_account_id: string;
  matched_site_id: string | null;
}

interface ServerAccount {
  id: string;
  username: string;
  main_domain: string;
  addon_domains: string[];
  subdomains: string[];
  parked_domains: string[];
  php_version: string | null;
  disk_used_mb: number | null;
  disk_limit_mb: number | null;
  status: string;
}

interface AccountsTabProps {
  accounts: ServerAccount[];
  cmsDetections: CmsDetection[];
}

export function AccountsTab({ accounts, cmsDetections }: AccountsTabProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const getCms = useCallback((accountId: string, domain: string) =>
    cmsDetections.find(d => d.server_account_id === accountId && d.domain === domain),
    [cmsDetections]
  );

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-[1fr_100px_60px_80px_60px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
        <span>Dominio</span>
        <span>CMS</span>
        <span>PHP</span>
        <span>Disco</span>
        <span>Stato</span>
      </div>

      {accounts.map(account => {
        const isOpen = expanded.has(account.id);
        const mainCms = getCms(account.id, account.main_domain);
        const diskPercent = account.disk_used_mb != null && account.disk_limit_mb != null
          ? Math.round((account.disk_used_mb / account.disk_limit_mb) * 100)
          : null;
        const subDomains: Array<{ domain: string; type: 'addon' | 'sub' | 'parked' }> = [
          ...account.addon_domains.map(d => ({ domain: d, type: 'addon' as const })),
          ...account.subdomains.map(d => ({ domain: d, type: 'sub' as const })),
          ...account.parked_domains.map(d => ({ domain: d, type: 'parked' as const })),
        ];

        return (
          <div key={account.id} className="border-b last:border-0">
            {/* Main row */}
            <div
              role={subDomains.length > 0 ? 'button' : undefined}
              tabIndex={subDomains.length > 0 ? 0 : undefined}
              onKeyDown={subDomains.length > 0 ? (e) => { if (e.key === 'Enter' || e.key === ' ') toggle(account.id); } : undefined}
              className="grid grid-cols-[1fr_100px_60px_80px_60px] gap-2 px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer items-center"
              onClick={() => subDomains.length > 0 && toggle(account.id)}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {subDomains.length > 0 ? (
                  isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <span className="w-3.5" />
                )}
                <span className="font-medium truncate">{account.main_domain}</span>
                <span className="text-[10px] text-muted-foreground">({account.username})</span>
              </div>
              <div>
                {mainCms ? (
                  <Badge variant="outline" className="text-[10px] h-5">
                    {mainCms.cms_type} {mainCms.cms_version ?? ''}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <span className="text-xs">{account.php_version ?? '—'}</span>
              <DiskUsage diskPercent={diskPercent} />
              <Badge variant={account.status === 'active' ? 'default' : 'destructive'} className="text-[10px] h-5">
                {account.status === 'active' ? '✓' : '✗'}
              </Badge>
            </div>

            {/* Expanded sub-domains */}
            {isOpen && subDomains.map(({ domain, type }) => {
              const subCms = getCms(account.id, domain);
              return (
                <div
                  key={domain}
                  className="grid grid-cols-[1fr_100px_60px_80px_60px] gap-2 px-3 py-1.5 text-sm bg-muted/30 items-center"
                >
                  <div className="flex items-center gap-1.5 pl-7 min-w-0">
                    <span className="text-muted-foreground">└</span>
                    <span className="truncate">{domain}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                      {type}
                    </Badge>
                  </div>
                  <div>
                    {subCms ? (
                      <Badge variant="outline" className="text-[10px] h-5">
                        {subCms.cms_type} {subCms.cms_version ?? ''}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                  <span />
                  <span />
                  <span />
                </div>
              );
            })}
          </div>
        );
      })}

      {accounts.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nessun account trovato</p>
      )}
    </div>
  );
}

function DiskUsage({ diskPercent }: { diskPercent: number | null }) {
  if (diskPercent === null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const colorClass =
    diskPercent > 90 ? 'bg-red-500' :
    diskPercent > 70 ? 'bg-yellow-500' :
    'bg-green-500';

  return (
    <div className="flex items-center gap-1">
      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${Math.min(diskPercent, 100)}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground">{diskPercent}%</span>
    </div>
  );
}

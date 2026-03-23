'use client';

import { Badge } from '@/components/ui/badge';

interface EmailEntry {
  id: string;
  email: string;
  quota_mb: number | null;
  used_mb: number | null;
  has_forwarder: boolean;
  forwarder_target: string | null;
  server_account_id: string;
}

interface EmailTabProps {
  emails: EmailEntry[];
  accounts: Array<{ id: string; username: string; main_domain: string }>;
}

export function EmailTab({ emails, accounts }: EmailTabProps) {
  // Group emails by account
  const grouped = accounts.map(account => ({
    ...account,
    emails: emails.filter(e => e.server_account_id === account.id),
  })).filter(g => g.emails.length > 0);

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_80px_80px_60px_120px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
        <span>Email</span>
        <span>Quota</span>
        <span>Usato</span>
        <span>%</span>
        <span>Forwarder</span>
      </div>

      {grouped.map(group => (
        <div key={group.id}>
          <div className="px-3 py-1.5 bg-muted/30 text-xs font-medium text-muted-foreground">
            {group.main_domain} ({group.username})
          </div>
          {group.emails.map(email => {
            const usagePercent = email.quota_mb && email.used_mb
              ? Math.round((email.used_mb / email.quota_mb) * 100)
              : null;
            return (
              <div
                key={email.id}
                className="grid grid-cols-[1fr_80px_80px_60px_120px] gap-2 px-3 py-1.5 text-sm border-b last:border-0 items-center"
              >
                <span className="truncate font-mono text-xs">{email.email}</span>
                <span className="text-xs">{email.quota_mb ? `${email.quota_mb} MB` : '∞'}</span>
                <span className="text-xs">{email.used_mb != null ? `${email.used_mb} MB` : '—'}</span>
                <span className="text-xs">
                  {usagePercent != null ? (
                    <Badge
                      variant={usagePercent > 90 ? 'destructive' : usagePercent > 70 ? 'default' : 'secondary'}
                      className="text-[10px] h-5"
                    >
                      {usagePercent}%
                    </Badge>
                  ) : '—'}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {email.has_forwarder ? `→ ${email.forwarder_target ?? '?'}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      ))}

      {grouped.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nessun account email trovato</p>
      )}
    </div>
  );
}

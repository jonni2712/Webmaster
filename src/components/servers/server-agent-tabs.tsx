'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { AgentSetup } from './agent-setup';
import { OverviewTab } from './tabs/overview-tab';
import { AccountsTab } from './tabs/accounts-tab';
import { DnsTab } from './tabs/dns-tab';
import { SslTab } from './tabs/ssl-tab';
import { ResourcesTab } from './tabs/resources-tab';
import { ErrorsTab } from './tabs/errors-tab';
import { EmailTab } from './tabs/email-tab';
import { DatabasesTab } from './tabs/databases-tab';

interface ServerAgentTabsProps {
  serverId: string;
  serverName: string;
  panelType: string;
  agentStatus: string;
}

interface AgentData {
  ok: boolean;
  server: {
    last_sync_at: string | null;
    agent_version: string | null;
  };
  accounts: React.ComponentProps<typeof AccountsTab>['accounts'];
  cms_detections: React.ComponentProps<typeof AccountsTab>['cmsDetections'];
  dns_zones: React.ComponentProps<typeof DnsTab>['zones'];
  ssl_certs: React.ComponentProps<typeof SslTab>['certs'];
  pending_imports: React.ComponentProps<typeof OverviewTab>['pendingImports'];
  stats: React.ComponentProps<typeof OverviewTab>['stats'] & {
    unresolved_errors?: number;
    latest_resource?: React.ComponentProps<typeof ResourcesTab>['latestResource'];
    total_emails?: number;
    total_databases?: number;
  };
  resource_snapshots: React.ComponentProps<typeof ResourcesTab>['snapshots'];
  errors: React.ComponentProps<typeof ErrorsTab>['errors'];
  emails: React.ComponentProps<typeof EmailTab>['emails'];
  databases: React.ComponentProps<typeof DatabasesTab>['databases'];
}

export function ServerAgentTabs({ serverId, serverName, panelType, agentStatus: initialStatus }: ServerAgentTabsProps) {
  const [agentStatus, setAgentStatus] = useState(initialStatus);
  const [data, setData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAgentConnected = useCallback(() => {
    setAgentStatus('online');
  }, []);

  const fetchData = useCallback(async () => {
    if (agentStatus === 'not_installed') return;
    setLoading(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/agent-data`);
      if (res.ok) {
        const json = await res.json();
        if (json.ok) setData(json);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [serverId, agentStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (agentStatus === 'not_installed') {
    return (
      <AgentSetup
        serverId={serverId}
        serverName={serverName}
        panelType={panelType}
        agentStatus={agentStatus}
        onConnected={handleAgentConnected}
      />
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={agentStatus === 'online' ? 'default' : 'destructive'}>
          {agentStatus === 'online' ? '🟢 Online' : '🔴 Offline'}
        </Badge>
        {data.server.last_sync_at && (
          <span className="text-muted-foreground">
            Ultima sync: {new Date(data.server.last_sync_at).toLocaleString('it-IT')}
          </span>
        )}
        {data.server.agent_version && (
          <span className="text-muted-foreground">v{data.server.agent_version}</span>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">
            Account ({data.stats.total_accounts})
          </TabsTrigger>
          <TabsTrigger value="dns">DNS</TabsTrigger>
          <TabsTrigger value="ssl">
            SSL
            {(data.stats.ssl_expiring > 0 || data.stats.ssl_expired > 0) && (
              <Badge variant="destructive" className="ml-1 h-5 px-1 text-[10px]">
                {data.stats.ssl_expiring + data.stats.ssl_expired}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resources">Risorse</TabsTrigger>
          <TabsTrigger value="errors">
            Errori
            {(data.stats.unresolved_errors ?? 0) > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1 text-[10px]">
                {data.stats.unresolved_errors ?? 0}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="databases">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            stats={data.stats}
            pendingImports={data.pending_imports}
            serverId={serverId}
            onImportAction={fetchData}
          />
        </TabsContent>
        <TabsContent value="accounts">
          <AccountsTab
            accounts={data.accounts}
            cmsDetections={data.cms_detections}
          />
        </TabsContent>
        <TabsContent value="dns">
          <DnsTab zones={data.dns_zones} />
        </TabsContent>
        <TabsContent value="ssl">
          <SslTab certs={data.ssl_certs} />
        </TabsContent>
        <TabsContent value="resources">
          <ResourcesTab
            snapshots={data.resource_snapshots || []}
            latestResource={data.stats.latest_resource ?? null}
          />
        </TabsContent>
        <TabsContent value="errors">
          <ErrorsTab
            errors={data.errors || []}
            serverId={serverId}
            onResolve={fetchData}
          />
        </TabsContent>
        <TabsContent value="email">
          <EmailTab
            emails={data.emails || []}
            accounts={data.accounts || []}
          />
        </TabsContent>
        <TabsContent value="databases">
          <DatabasesTab
            databases={data.databases || []}
            accounts={data.accounts || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

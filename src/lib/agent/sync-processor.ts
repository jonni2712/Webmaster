// src/lib/agent/sync-processor.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { AgentSyncPayload } from './schemas';

interface SyncResult {
  accounts_synced: number;
  domains_matched: number;
  domains_pending_import: number;
  dns_zones_synced: number;
  ssl_certs_synced: number;
  emails_synced: number;
  databases_synced: number;
  resources_recorded: boolean;
  errors_synced: number;
  backups_synced: number;
  errors: string[];
}

export async function processSyncPayload(
  serverId: string,
  tenantId: string,
  payload: AgentSyncPayload
): Promise<SyncResult> {
  const supabase = createAdminClient();
  const result: SyncResult = {
    accounts_synced: 0,
    domains_matched: 0,
    domains_pending_import: 0,
    dns_zones_synced: 0,
    ssl_certs_synced: 0,
    emails_synced: 0,
    databases_synced: 0,
    resources_recorded: false,
    errors_synced: 0,
    backups_synced: 0,
    errors: [],
  };

  // 1. Upsert accounts
  for (const account of payload.accounts) {
    try {
      const { data: upsertedAccount, error: accountError } = await supabase
        .from('server_accounts')
        .upsert(
          {
            server_id: serverId,
            tenant_id: tenantId,
            username: account.username,
            main_domain: account.main_domain,
            addon_domains: account.addon_domains,
            subdomains: account.subdomains,
            parked_domains: account.parked_domains,
            document_roots: account.document_roots,
            php_version: account.php_version ?? null,
            disk_used_mb: account.disk_used_mb ?? null,
            disk_limit_mb: account.disk_limit_mb ?? null,
            bandwidth_used_mb: account.bandwidth_used_mb ?? null,
            status: 'active',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'server_id,username' }
        )
        .select('id')
        .single();

      if (accountError || !upsertedAccount) {
        result.errors.push(`Account ${account.username}: ${accountError?.message}`);
        continue;
      }

      result.accounts_synced++;

      // 2. Process CMS detections
      for (const [domain, cms] of Object.entries(account.cms)) {
        await processCmsDetection(
          supabase, serverId, upsertedAccount.id, tenantId, domain, cms, result
        );
      }

      // 3. Process SSL certs
      for (const [domain, ssl] of Object.entries(account.ssl)) {
        await processSslCert(supabase, serverId, tenantId, domain, ssl, result);
      }

      // 4. Process emails for this account
      if (account.emails && account.emails.length > 0) {
        for (const email of account.emails) {
          try {
            await supabase
              .from('server_emails')
              .upsert(
                {
                  server_account_id: upsertedAccount.id,
                  tenant_id: tenantId,
                  email: email.account,
                  quota_mb: email.quota_mb ?? null,
                  used_mb: email.used_mb ?? null,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'server_account_id,email' }
              );
            result.emails_synced++;
          } catch (err) {
            result.errors.push(`Email ${email.account}: ${String(err)}`);
          }
        }
      }

      // 5. Process databases for this account
      if (account.databases && account.databases.length > 0) {
        for (const db of account.databases) {
          try {
            await supabase
              .from('server_databases')
              .upsert(
                {
                  server_account_id: upsertedAccount.id,
                  tenant_id: tenantId,
                  name: db.name,
                  engine: db.engine || 'mysql',
                  size_mb: db.size_mb ?? null,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'server_account_id,name' }
              );
            result.databases_synced++;
          } catch (err) {
            result.errors.push(`DB ${db.name}: ${String(err)}`);
          }
        }
      }
    } catch (err) {
      result.errors.push(`Account ${account.username}: ${String(err)}`);
    }
  }

  // 4. Process DNS zones
  for (const zone of payload.dns_zones) {
    try {
      const { error } = await supabase
        .from('server_dns_zones')
        .upsert(
          {
            server_id: serverId,
            tenant_id: tenantId,
            domain: zone.domain,
            records: zone.records,
            points_to_server: zone.points_to_this_server,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'server_id,domain' }
        );

      if (error) {
        result.errors.push(`DNS ${zone.domain}: ${error.message}`);
      } else {
        result.dns_zones_synced++;
      }
    } catch (err) {
      result.errors.push(`DNS ${zone.domain}: ${String(err)}`);
    }
  }

  // 5. Record server resources snapshot
  if (payload.server_resources) {
    try {
      const { error } = await supabase
        .from('server_resource_snapshots')
        .insert({
          server_id: serverId,
          tenant_id: tenantId,
          cpu_cores: payload.server_resources.cpu_cores ?? null,
          cpu_usage_percent: payload.server_resources.cpu_usage_percent ?? null,
          ram_total_mb: payload.server_resources.ram_total_mb ?? null,
          ram_used_mb: payload.server_resources.ram_used_mb ?? null,
          disk_total_gb: payload.server_resources.disk_total_gb ?? null,
          disk_used_gb: payload.server_resources.disk_used_gb ?? null,
          recorded_at: new Date().toISOString(),
        });
      if (!error) result.resources_recorded = true;
      else result.errors.push(`Resources: ${error.message}`);
    } catch (err) {
      result.errors.push(`Resources: ${String(err)}`);
    }
  }

  // 6. Process errors
  if (payload.errors && payload.errors.length > 0) {
    for (const errorEntry of payload.errors) {
      try {
        // Try to find existing unresolved error with same domain+type+message
        const { data: existing } = await supabase
          .from('server_errors')
          .select('id, occurrence_count')
          .eq('server_id', serverId)
          .eq('tenant_id', tenantId)
          .eq('domain', errorEntry.domain ?? '')
          .eq('error_type', errorEntry.type)
          .eq('resolved', false)
          .limit(1)
          .single();

        if (existing) {
          // Update count and last_seen
          await supabase
            .from('server_errors')
            .update({
              occurrence_count: existing.occurrence_count + (errorEntry.count || 1),
              last_seen_at: new Date().toISOString(),
              message: errorEntry.message,
            })
            .eq('id', existing.id);
        } else {
          // Insert new error
          await supabase.from('server_errors').insert({
            server_id: serverId,
            tenant_id: tenantId,
            domain: errorEntry.domain ?? null,
            error_type: errorEntry.type,
            message: errorEntry.message,
            file_path: errorEntry.file ?? null,
            occurrence_count: errorEntry.count || 1,
            first_seen_at: errorEntry.timestamp ? new Date(errorEntry.timestamp).toISOString() : new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
          });
        }
        result.errors_synced++;
      } catch (err) {
        result.errors.push(`Error entry: ${String(err)}`);
      }
    }
  }

  // 7. Update server last_sync_at
  await supabase
    .from('servers')
    .update({
      last_sync_at: new Date().toISOString(),
      agent_status: 'online',
      agent_version: payload.agent_version,
    })
    .eq('id', serverId);

  return result;
}

async function processCmsDetection(
  supabase: ReturnType<typeof createAdminClient>,
  serverId: string,
  accountId: string,
  tenantId: string,
  domain: string,
  cms: { type: string; version?: string | null },
  result: SyncResult
): Promise<void> {
  // Try to auto-match with existing site (try multiple URL formats)
  const urlVariants = [
    domain,
    `https://${domain}`,
    `http://${domain}`,
    `https://www.${domain}`,
    `http://www.${domain}`,
  ];

  let matchedSiteId: string | null = null;

  for (const variant of urlVariants) {
    const { data: matchedSite } = await supabase
      .from('sites')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('url', variant)
      .single();

    if (matchedSite) {
      matchedSiteId = matchedSite.id;
      break;
    }
  }

  if (matchedSiteId) {
    result.domains_matched++;
  }

  // Upsert CMS detection
  const { error } = await supabase
    .from('server_cms_detections')
    .upsert(
      {
        server_account_id: accountId,
        tenant_id: tenantId,
        domain,
        cms_type: cms.type,
        cms_version: cms.version ?? null,
        matched_site_id: matchedSiteId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'server_account_id,domain' }
    );

  if (error) {
    result.errors.push(`CMS ${domain}: ${error.message}`);
    return;
  }

  // If no match, create pending import (unless already exists)
  if (!matchedSiteId) {
    const { data: existing } = await supabase
      .from('pending_site_imports')
      .select('id')
      .eq('server_id', serverId)
      .eq('domain', domain)
      .single();

    if (!existing) {
      await supabase.from('pending_site_imports').insert({
        server_id: serverId,
        tenant_id: tenantId,
        domain,
        cms_type: cms.type,
        cms_version: cms.version ?? null,
      });
      result.domains_pending_import++;
    }
  }
}

async function processSslCert(
  supabase: ReturnType<typeof createAdminClient>,
  serverId: string,
  tenantId: string,
  domain: string,
  ssl: { issuer?: string | null; expires?: string | null; auto_ssl?: boolean },
  result: SyncResult
): Promise<void> {
  let status: 'valid' | 'expiring' | 'expired' | 'error' = 'valid';
  if (ssl.expires) {
    const expiresDate = new Date(ssl.expires);
    const now = new Date();
    const daysUntilExpiry = (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry < 0) status = 'expired';
    else if (daysUntilExpiry < 14) status = 'expiring';
  }

  const { error } = await supabase
    .from('server_ssl_certs')
    .upsert(
      {
        server_id: serverId,
        tenant_id: tenantId,
        domain,
        issuer: ssl.issuer ?? null,
        expires_at: ssl.expires ?? null,
        auto_ssl: ssl.auto_ssl ?? false,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'server_id,domain' }
    );

  if (error) {
    result.errors.push(`SSL ${domain}: ${error.message}`);
  } else {
    result.ssl_certs_synced++;
  }
}

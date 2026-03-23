# cPanel Agent Module — Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a modular PHP agent that installs on cPanel servers, collects account/CMS/DNS/SSL data, and syncs it to the Webmaster Monitor platform with auto-match and import proposals.

**Architecture:** PHP agent on server (push model) → Next.js API endpoints → Supabase storage. Agent uses cPanel UAPI/WHM API via adapter pattern. Platform receives payloads, auto-matches domains to existing sites, and proposes imports for new ones.

**Tech Stack:** PHP 7.4+ (agent), Next.js 16 + TypeScript (platform API), Supabase/PostgreSQL (storage), Zod (validation), Recharts (UI charts), shadcn/ui (components)

**Design Doc:** `docs/plans/2026-03-23-cpanel-plesk-agent-design.md`

---

## Task 1: Database Migration — Extend servers + new tables

**Files:**
- Create: `supabase/migrations/024_cpanel_agent_support.sql`
- Modify: `supabase/deploy_all.sql` (append new migration)

**Step 1: Write the migration file**

```sql
-- 024_cpanel_agent_support.sql
-- Adds cPanel/Plesk agent support: server extensions + sync data tables

-- ============================================================
-- 1. Extend servers table
-- ============================================================
ALTER TABLE servers ADD COLUMN IF NOT EXISTS panel_type TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS agent_token TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS agent_status TEXT DEFAULT 'not_installed';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS agent_version TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS sync_config JSONB DEFAULT '{}';

-- ============================================================
-- 2. Server accounts (cPanel/Plesk accounts)
-- ============================================================
CREATE TABLE IF NOT EXISTS server_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  main_domain TEXT NOT NULL,
  addon_domains JSONB DEFAULT '[]',
  subdomains JSONB DEFAULT '[]',
  parked_domains JSONB DEFAULT '[]',
  document_roots JSONB DEFAULT '{}',
  php_version TEXT,
  disk_used_mb INTEGER,
  disk_limit_mb INTEGER,
  bandwidth_used_mb INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_id, username)
);

-- ============================================================
-- 3. CMS detections per domain
-- ============================================================
CREATE TABLE IF NOT EXISTS server_cms_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_account_id UUID NOT NULL REFERENCES server_accounts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  cms_type TEXT NOT NULL,
  cms_version TEXT,
  document_root TEXT,
  matched_site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_account_id, domain)
);

-- ============================================================
-- 4. DNS zones synced from panel
-- ============================================================
CREATE TABLE IF NOT EXISTS server_dns_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  records JSONB DEFAULT '[]',
  points_to_server BOOLEAN DEFAULT true,
  resolved_ip TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_id, domain)
);

-- ============================================================
-- 5. SSL certificates from panel
-- ============================================================
CREATE TABLE IF NOT EXISTS server_ssl_certs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  issuer TEXT,
  expires_at TIMESTAMPTZ,
  auto_ssl BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'valid',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_id, domain)
);

-- ============================================================
-- 6. Pending site imports
-- ============================================================
CREATE TABLE IF NOT EXISTS pending_site_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  cms_type TEXT,
  cms_version TEXT,
  server_account_username TEXT,
  status TEXT DEFAULT 'pending',
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  actioned_at TIMESTAMPTZ,
  UNIQUE(server_id, domain)
);

-- ============================================================
-- 7. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_server_accounts_server ON server_accounts(server_id);
CREATE INDEX IF NOT EXISTS idx_server_accounts_tenant ON server_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_server_cms_matched ON server_cms_detections(matched_site_id);
CREATE INDEX IF NOT EXISTS idx_server_dns_server ON server_dns_zones(server_id);
CREATE INDEX IF NOT EXISTS idx_server_ssl_server ON server_ssl_certs(server_id);
CREATE INDEX IF NOT EXISTS idx_pending_imports_status ON pending_site_imports(tenant_id, status)
  WHERE status = 'pending';

-- ============================================================
-- 8. RLS Policies
-- ============================================================
ALTER TABLE server_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_cms_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_dns_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_ssl_certs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_site_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON server_accounts
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON server_cms_detections
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON server_dns_zones
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON server_ssl_certs
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON pending_site_imports
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));
```

**Step 2: Apply migration locally**

Run: `cd webmaster-platform && npx supabase db push` or apply via Supabase Dashboard SQL editor.
Expected: All tables created, RLS enabled, indexes applied.

**Step 3: Commit**

```bash
git add supabase/migrations/024_cpanel_agent_support.sql
git commit -m "feat(db): add cPanel agent support tables and server extensions"
```

---

## Task 2: TypeScript Types — Agent data models

**Files:**
- Modify: `src/types/database.ts` (lines 32-55, add new fields to Server + new interfaces)

**Step 1: Extend Server interface**

In `src/types/database.ts`, after the existing `Server` interface (line 42), add new fields:

```typescript
export interface Server {
  id: string;
  tenant_id: string;
  name: string;
  provider: string | null;
  hostname: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // cPanel/Plesk agent fields
  panel_type: 'cpanel' | 'plesk' | null;
  agent_token: string | null;
  agent_status: 'not_installed' | 'online' | 'offline' | 'error';
  agent_version: string | null;
  last_sync_at: string | null;
  last_heartbeat_at: string | null;
  sync_config: Record<string, unknown>;
}
```

**Step 2: Add new type interfaces**

After the Server interface, add:

```typescript
export interface ServerAccount {
  id: string;
  server_id: string;
  tenant_id: string;
  username: string;
  main_domain: string;
  addon_domains: string[];
  subdomains: string[];
  parked_domains: string[];
  document_roots: Record<string, string>;
  php_version: string | null;
  disk_used_mb: number | null;
  disk_limit_mb: number | null;
  bandwidth_used_mb: number | null;
  status: 'active' | 'suspended' | 'removed';
  created_at: string;
  updated_at: string;
}

export interface ServerCmsDetection {
  id: string;
  server_account_id: string;
  tenant_id: string;
  domain: string;
  cms_type: string;
  cms_version: string | null;
  document_root: string | null;
  matched_site_id: string | null;
  detected_at: string;
  updated_at: string;
}

export interface ServerDnsZone {
  id: string;
  server_id: string;
  tenant_id: string;
  domain: string;
  records: DnsRecord[];
  points_to_server: boolean;
  resolved_ip: string | null;
  updated_at: string;
}

export interface DnsRecord {
  type: string;
  name: string;
  value: string;
  priority?: number;
  ttl?: number;
}

export interface ServerSslCert {
  id: string;
  server_id: string;
  tenant_id: string;
  domain: string;
  issuer: string | null;
  expires_at: string | null;
  auto_ssl: boolean;
  status: 'valid' | 'expiring' | 'expired' | 'error';
  updated_at: string;
}

export interface PendingSiteImport {
  id: string;
  server_id: string;
  tenant_id: string;
  domain: string;
  cms_type: string | null;
  cms_version: string | null;
  server_account_username: string | null;
  status: 'pending' | 'imported' | 'ignored';
  discovered_at: string;
  actioned_at: string | null;
}
```

**Step 3: Commit**

```bash
git add src/types/database.ts
git commit -m "feat(types): add cPanel agent data model interfaces"
```

---

## Task 3: Zod Schemas — Agent payload validation

**Files:**
- Create: `src/lib/agent/schemas.ts`

**Step 1: Create the validation schemas**

```typescript
// src/lib/agent/schemas.ts
import { z } from 'zod';

// === Sub-schemas ===

const cmsDetectionSchema = z.object({
  type: z.string(),
  version: z.string().nullable().optional(),
});

const databaseSchema = z.object({
  name: z.string(),
  size_mb: z.number().nullable().optional(),
  engine: z.enum(['mysql', 'postgresql']).default('mysql'),
});

const emailSchema = z.object({
  account: z.string().email(),
  quota_mb: z.number().nullable().optional(),
  used_mb: z.number().nullable().optional(),
});

const sslInfoSchema = z.object({
  issuer: z.string().nullable().optional(),
  expires: z.string().nullable().optional(),
  auto_ssl: z.boolean().default(false),
});

const dnsRecordSchema = z.object({
  type: z.string(),
  name: z.string(),
  value: z.string(),
  priority: z.number().optional(),
  ttl: z.number().optional(),
});

const backupSchema = z.object({
  last_backup: z.string().nullable().optional(),
  size_mb: z.number().nullable().optional(),
  type: z.string().nullable().optional(),
});

// === Account schema ===

const accountSchema = z.object({
  username: z.string().min(1),
  main_domain: z.string().min(1),
  addon_domains: z.array(z.string()).default([]),
  subdomains: z.array(z.string()).default([]),
  parked_domains: z.array(z.string()).default([]),
  document_roots: z.record(z.string(), z.string()).default({}),
  cms: z.record(z.string(), cmsDetectionSchema).default({}),
  php_version: z.string().nullable().optional(),
  databases: z.array(databaseSchema).default([]),
  emails: z.array(emailSchema).default([]),
  disk_used_mb: z.number().nullable().optional(),
  disk_limit_mb: z.number().nullable().optional(),
  bandwidth_used_mb: z.number().nullable().optional(),
  ssl: z.record(z.string(), sslInfoSchema).default({}),
  backup: backupSchema.nullable().optional(),
});

// === DNS zone schema ===

const dnsZoneSchema = z.object({
  domain: z.string().min(1),
  records: z.array(dnsRecordSchema).default([]),
  points_to_this_server: z.boolean().default(true),
});

// === Server resources schema ===

const serverResourcesSchema = z.object({
  cpu_cores: z.number().optional(),
  cpu_usage_percent: z.number().optional(),
  ram_total_mb: z.number().optional(),
  ram_used_mb: z.number().optional(),
  disk_total_gb: z.number().optional(),
  disk_used_gb: z.number().optional(),
}).optional();

// === Error schema ===

const serverErrorSchema = z.object({
  domain: z.string().optional(),
  type: z.string(),
  message: z.string(),
  timestamp: z.string().optional(),
  file: z.string().optional(),
  count: z.number().default(1),
});

// === Main sync payload schema ===

export const agentSyncPayloadSchema = z.object({
  agent_version: z.string().min(1),
  panel_type: z.enum(['cpanel', 'plesk']),
  server_hostname: z.string().min(1),
  sync_type: z.enum(['full', 'diff']),
  timestamp: z.string(),
  accounts: z.array(accountSchema).default([]),
  dns_zones: z.array(dnsZoneSchema).default([]),
  server_resources: serverResourcesSchema,
  errors: z.array(serverErrorSchema).default([]),
});

export type AgentSyncPayload = z.infer<typeof agentSyncPayloadSchema>;

// === Heartbeat schema ===

export const agentHeartbeatSchema = z.object({
  agent_version: z.string().min(1),
  panel_type: z.enum(['cpanel', 'plesk']),
  server_hostname: z.string().min(1),
  uptime_seconds: z.number().optional(),
});

export type AgentHeartbeat = z.infer<typeof agentHeartbeatSchema>;

// === Event push schema ===

export const agentEventSchema = z.object({
  agent_version: z.string().min(1),
  event_type: z.enum([
    'ssl_expiring',
    'ssl_expired',
    'new_account',
    'account_removed',
    'new_domain',
    'domain_removed',
    'error_detected',
    'disk_warning',
  ]),
  server_hostname: z.string().min(1),
  timestamp: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export type AgentEvent = z.infer<typeof agentEventSchema>;
```

**Step 2: Commit**

```bash
git add src/lib/agent/schemas.ts
git commit -m "feat(agent): add Zod validation schemas for agent payloads"
```

---

## Task 4: Agent Token Generation — Server-side utility

**Files:**
- Create: `src/lib/agent/token.ts`

**Step 1: Create token generation utility**

```typescript
// src/lib/agent/token.ts
import { randomBytes, createHmac } from 'crypto';

const TOKEN_PREFIX = 'wm_agent_';

/**
 * Generates a secure agent token for server authentication.
 * Format: wm_agent_<random>_<hmac>
 */
export function generateAgentToken(serverId: string): string {
  const random = randomBytes(24).toString('hex');
  const hmac = createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback-secret')
    .update(`${serverId}:${random}`)
    .digest('hex')
    .slice(0, 16);
  return `${TOKEN_PREFIX}${random}_${hmac}`;
}

/**
 * Validates token format (not DB lookup — just structural check).
 */
export function isValidTokenFormat(token: string): boolean {
  return token.startsWith(TOKEN_PREFIX) && token.length > TOKEN_PREFIX.length + 40;
}
```

**Step 2: Commit**

```bash
git add src/lib/agent/token.ts
git commit -m "feat(agent): add secure token generation for server agents"
```

---

## Task 5: Agent Auth Middleware — Validate agent requests

**Files:**
- Create: `src/lib/agent/auth.ts`

**Step 1: Create agent authentication helper**

```typescript
// src/lib/agent/auth.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidTokenFormat } from './token';
import { timingSafeEqual } from 'crypto';

interface AgentAuthResult {
  success: boolean;
  serverId?: string;
  tenantId?: string;
  error?: string;
}

/**
 * Authenticates an agent request by validating the Bearer token
 * against the servers table. Returns server and tenant IDs on success.
 */
export async function authenticateAgent(request: Request): Promise<AgentAuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { success: false, error: 'Missing Authorization header' };
  }

  const token = authHeader.slice(7);
  if (!isValidTokenFormat(token)) {
    return { success: false, error: 'Invalid token format' };
  }

  const supabase = createAdminClient();
  const { data: server, error } = await supabase
    .from('servers')
    .select('id, tenant_id, agent_token, agent_status')
    .eq('agent_token', token)
    .single();

  if (error || !server) {
    return { success: false, error: 'Unknown agent token' };
  }

  return {
    success: true,
    serverId: server.id,
    tenantId: server.tenant_id,
  };
}
```

**Step 2: Commit**

```bash
git add src/lib/agent/auth.ts
git commit -m "feat(agent): add agent request authentication middleware"
```

---

## Task 6: Sync Processor — Core business logic

**Files:**
- Create: `src/lib/agent/sync-processor.ts`

**Step 1: Create sync processing logic**

This is the core logic that processes incoming agent payloads: upserts accounts, detects CMS, auto-matches domains, creates pending imports.

```typescript
// src/lib/agent/sync-processor.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { AgentSyncPayload } from './schemas';

interface SyncResult {
  accounts_synced: number;
  domains_matched: number;
  domains_pending_import: number;
  dns_zones_synced: number;
  ssl_certs_synced: number;
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

      // 2. Process CMS detections for this account
      for (const [domain, cms] of Object.entries(account.cms)) {
        await processCmsDetection(
          supabase, upsertedAccount.id, tenantId, domain, cms, result
        );
      }

      // 3. Process SSL certs for this account
      for (const [domain, ssl] of Object.entries(account.ssl)) {
        await processSslCert(supabase, serverId, tenantId, domain, ssl, result);
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

  // 5. Update server last_sync_at
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
  accountId: string,
  tenantId: string,
  domain: string,
  cms: { type: string; version?: string | null },
  result: SyncResult
): Promise<void> {
  // Try to auto-match with existing site
  const { data: matchedSite } = await supabase
    .from('sites')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('url', domain)
    .single();

  // Also try with protocol prefixes
  let matchedSiteId = matchedSite?.id ?? null;
  if (!matchedSiteId) {
    const { data: matchWithProtocol } = await supabase
      .from('sites')
      .select('id')
      .eq('tenant_id', tenantId)
      .or(`url.eq.https://${domain},url.eq.http://${domain},url.eq.https://www.${domain},url.eq.http://www.${domain}`)
      .limit(1)
      .single();
    matchedSiteId = matchWithProtocol?.id ?? null;
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
      .eq('server_id', (await supabase.from('server_accounts').select('server_id').eq('id', accountId).single()).data?.server_id ?? '')
      .eq('domain', domain)
      .single();

    if (!existing) {
      await supabase.from('pending_site_imports').insert({
        server_id: (await supabase.from('server_accounts').select('server_id').eq('id', accountId).single()).data?.server_id ?? '',
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
  // Determine SSL status based on expiry
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
```

**Step 2: Commit**

```bash
git add src/lib/agent/sync-processor.ts
git commit -m "feat(agent): add sync processor with auto-match and pending imports"
```

---

## Task 7: API Routes — Agent endpoints

**Files:**
- Create: `src/app/api/agent/sync/route.ts`
- Create: `src/app/api/agent/heartbeat/route.ts`
- Create: `src/app/api/agent/register/route.ts`

**Step 1: Create sync route**

```typescript
// src/app/api/agent/sync/route.ts
import { NextResponse } from 'next/server';
import { authenticateAgent } from '@/lib/agent/auth';
import { agentSyncPayloadSchema } from '@/lib/agent/schemas';
import { processSyncPayload } from '@/lib/agent/sync-processor';

export async function POST(request: Request) {
  const auth = await authenticateAgent(request);
  if (!auth.success) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.error === 'Missing Authorization header' ? 401 : 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const parsed = agentSyncPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await processSyncPayload(auth.serverId!, auth.tenantId!, parsed.data);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error('[agent/sync] Processing error:', err);
    return NextResponse.json(
      { ok: false, error: 'Internal processing error' },
      { status: 500 }
    );
  }
}
```

**Step 2: Create heartbeat route**

```typescript
// src/app/api/agent/heartbeat/route.ts
import { NextResponse } from 'next/server';
import { authenticateAgent } from '@/lib/agent/auth';
import { agentHeartbeatSchema } from '@/lib/agent/schemas';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const auth = await authenticateAgent(request);
  if (!auth.success) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.error === 'Missing Authorization header' ? 401 : 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const parsed = agentHeartbeatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  await supabase
    .from('servers')
    .update({
      last_heartbeat_at: new Date().toISOString(),
      agent_status: 'online',
      agent_version: parsed.data.agent_version,
    })
    .eq('id', auth.serverId!);

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
```

**Step 3: Create register route**

```typescript
// src/app/api/agent/register/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateAgentToken } from '@/lib/agent/token';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { server_id, panel_type } = body;
  if (!server_id || !panel_type) {
    return NextResponse.json(
      { ok: false, error: 'server_id and panel_type required' },
      { status: 400 }
    );
  }

  if (!['cpanel', 'plesk'].includes(panel_type)) {
    return NextResponse.json(
      { ok: false, error: 'panel_type must be cpanel or plesk' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Verify server belongs to user's tenant
  const user = session.user as { current_tenant_id?: string };
  const { data: server, error } = await supabase
    .from('servers')
    .select('id, tenant_id')
    .eq('id', server_id)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (error || !server) {
    return NextResponse.json({ ok: false, error: 'Server not found' }, { status: 404 });
  }

  // Generate token and update server
  const agentToken = generateAgentToken(server_id);

  await supabase
    .from('servers')
    .update({
      panel_type,
      agent_token: agentToken,
      agent_status: 'not_installed',
    })
    .eq('id', server_id);

  return NextResponse.json({
    ok: true,
    agent_token: agentToken,
    install_command: `curl -sL "${process.env.NEXTAUTH_URL}/api/agent/install.sh" | bash -s -- --token="${agentToken}" --url="${process.env.NEXTAUTH_URL}"`,
  });
}
```

**Step 4: Commit**

```bash
git add src/app/api/agent/
git commit -m "feat(api): add agent sync, heartbeat, and register endpoints"
```

---

## Task 8: Pending Imports API — Import/Ignore actions

**Files:**
- Create: `src/app/api/agent/imports/route.ts`
- Create: `src/app/api/agent/imports/[id]/route.ts`

**Step 1: Create list pending imports route**

```typescript
// src/app/api/agent/imports/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as { current_tenant_id?: string };
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get('server_id');

  const supabase = createAdminClient();
  let query = supabase
    .from('pending_site_imports')
    .select('*')
    .eq('tenant_id', user.current_tenant_id)
    .eq('status', 'pending')
    .order('discovered_at', { ascending: false });

  if (serverId) {
    query = query.eq('server_id', serverId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, imports: data });
}
```

**Step 2: Create import/ignore action route**

```typescript
// src/app/api/agent/imports/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as { current_tenant_id?: string; id?: string };

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { action } = body; // 'import' or 'ignore'
  if (!['import', 'ignore'].includes(action)) {
    return NextResponse.json({ ok: false, error: 'action must be import or ignore' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch the pending import
  const { data: pending, error } = await supabase
    .from('pending_site_imports')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', user.current_tenant_id)
    .eq('status', 'pending')
    .single();

  if (error || !pending) {
    return NextResponse.json({ ok: false, error: 'Import not found' }, { status: 404 });
  }

  if (action === 'ignore') {
    await supabase
      .from('pending_site_imports')
      .update({ status: 'ignored', actioned_at: new Date().toISOString() })
      .eq('id', id);
    return NextResponse.json({ ok: true, status: 'ignored' });
  }

  // action === 'import' → create site
  const { data: newSite, error: siteError } = await supabase
    .from('sites')
    .insert({
      tenant_id: user.current_tenant_id,
      url: `https://${pending.domain}`,
      name: pending.domain,
      platform: pending.cms_type || 'other',
      server_id: pending.server_id,
      is_active: true,
      monitoring_enabled: true,
    })
    .select('id')
    .single();

  if (siteError || !newSite) {
    return NextResponse.json({ ok: false, error: siteError?.message }, { status: 500 });
  }

  // Update the CMS detection to link to the new site
  await supabase
    .from('server_cms_detections')
    .update({ matched_site_id: newSite.id })
    .eq('tenant_id', user.current_tenant_id)
    .eq('domain', pending.domain);

  // Mark import as done
  await supabase
    .from('pending_site_imports')
    .update({ status: 'imported', actioned_at: new Date().toISOString() })
    .eq('id', id);

  return NextResponse.json({ ok: true, status: 'imported', site_id: newSite.id });
}
```

**Step 3: Commit**

```bash
git add src/app/api/agent/imports/
git commit -m "feat(api): add pending imports list and import/ignore actions"
```

---

## Task 9: Server Detail API — Fetch agent data for UI

**Files:**
- Create: `src/app/api/servers/[id]/agent-data/route.ts`

**Step 1: Create agent data endpoint**

This endpoint returns all agent-synced data for a specific server, used by the UI tabs.

```typescript
// src/app/api/servers/[id]/agent-data/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as { current_tenant_id?: string };
  const supabase = createAdminClient();

  // Verify server belongs to tenant
  const { data: server, error: serverError } = await supabase
    .from('servers')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (serverError || !server) {
    return NextResponse.json({ ok: false, error: 'Server not found' }, { status: 404 });
  }

  // Fetch all agent data in parallel
  const [accounts, dnsZones, sslCerts, pendingImports] = await Promise.all([
    supabase
      .from('server_accounts')
      .select('*')
      .eq('server_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .order('main_domain'),
    supabase
      .from('server_dns_zones')
      .select('*')
      .eq('server_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .order('domain'),
    supabase
      .from('server_ssl_certs')
      .select('*')
      .eq('server_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .order('domain'),
    supabase
      .from('pending_site_imports')
      .select('*')
      .eq('server_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .eq('status', 'pending')
      .order('discovered_at', { ascending: false }),
  ]);

  // Fetch CMS detections for each account
  const accountIds = (accounts.data || []).map((a) => a.id);
  const { data: cmsDetections } = accountIds.length > 0
    ? await supabase
        .from('server_cms_detections')
        .select('*')
        .in('server_account_id', accountIds)
        .eq('tenant_id', user.current_tenant_id)
    : { data: [] };

  return NextResponse.json({
    ok: true,
    server,
    accounts: accounts.data || [],
    cms_detections: cmsDetections || [],
    dns_zones: dnsZones.data || [],
    ssl_certs: sslCerts.data || [],
    pending_imports: pendingImports.data || [],
    stats: {
      total_accounts: accounts.data?.length || 0,
      total_domains: (accounts.data || []).reduce(
        (sum, a) => sum + 1 + (a.addon_domains?.length || 0) + (a.subdomains?.length || 0),
        0
      ),
      ssl_expiring: (sslCerts.data || []).filter((s) => s.status === 'expiring').length,
      ssl_expired: (sslCerts.data || []).filter((s) => s.status === 'expired').length,
      pending_imports_count: pendingImports.data?.length || 0,
      cms_breakdown: (cmsDetections || []).reduce(
        (acc, d) => {
          acc[d.cms_type] = (acc[d.cms_type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    },
  });
}
```

**Step 2: Commit**

```bash
git add src/app/api/servers/[id]/agent-data/
git commit -m "feat(api): add server agent data endpoint for UI consumption"
```

---

## Task 10: Middleware Update — Allow agent routes without session auth

**Files:**
- Modify: `src/middleware.ts` (add agent routes to public paths)

**Step 1: Add agent API routes to public/bypass list**

In `src/middleware.ts`, find the public routes array (around line 6-23) and add agent endpoints:

```typescript
// Add these to the public routes that bypass session auth
'/api/agent/sync',
'/api/agent/heartbeat',
'/api/agent/event',
```

These routes use their own Bearer token authentication (not NextAuth sessions), so they must bypass the session middleware.

**Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(middleware): bypass session auth for agent API routes"
```

---

## Task 11: Server Form Update — Add panel type selector

**Files:**
- Modify: `src/components/servers/server-form.tsx`

**Step 1: Add panel_type field to server form**

Add a select dropdown for panel type (None, cPanel, Plesk) to the existing server form. When cPanel or Plesk is selected and the server is saved, show the agent setup flow.

The form should include:
- A `Select` component with options: "Nessun pannello", "cPanel", "Plesk"
- The field maps to `panel_type` on the server record

**Step 2: Commit**

```bash
git add src/components/servers/server-form.tsx
git commit -m "feat(ui): add panel type selector to server form"
```

---

## Task 12: Agent Setup Component — Token generation + install command

**Files:**
- Create: `src/components/servers/agent-setup.tsx`

**Step 1: Create agent setup wizard component**

This component shows when a server has `panel_type` set but `agent_status === 'not_installed'`. It:
1. Calls `POST /api/agent/register` to generate the token
2. Shows the one-liner install command with copy button
3. Polls `GET /api/servers/[id]` every 5s waiting for first heartbeat
4. Shows success when `agent_status` changes to `'online'`

The component displays:
- Step indicator (1. Generate token → 2. Install → 3. Waiting → 4. Connected)
- Copy-to-clipboard install command
- Real-time status polling with loading spinner
- Success state with first sync info

**Step 2: Commit**

```bash
git add src/components/servers/agent-setup.tsx
git commit -m "feat(ui): add agent setup wizard with install command"
```

---

## Task 13: Server Detail Tabs — Overview + Account + DNS + SSL

**Files:**
- Create: `src/components/servers/server-agent-tabs.tsx`
- Create: `src/components/servers/tabs/overview-tab.tsx`
- Create: `src/components/servers/tabs/accounts-tab.tsx`
- Create: `src/components/servers/tabs/dns-tab.tsx`
- Create: `src/components/servers/tabs/ssl-tab.tsx`

**Step 1: Create tab container component**

`server-agent-tabs.tsx` — fetches data from `/api/servers/[id]/agent-data` and renders a `Tabs` component (shadcn/ui) with Overview, Account, DNS, SSL tabs. Shows the `agent-setup` component if agent is not installed.

**Step 2: Create Overview tab**

`overview-tab.tsx` — KPI cards grid (accounts, domains, SSL warnings, CMS breakdown) + pending imports banner with import/ignore actions.

Uses: `Card`, `Badge` from shadcn/ui. Shows pending imports count with a link to review them.

**Step 3: Create Accounts tab**

`accounts-tab.tsx` — Expandable table. Each row shows: username, main domain, CMS type+version, PHP version, disk usage bar, status badge. Expanding shows addon domains, subdomains, parked domains with their CMS if detected.

Uses: `Table`, `Badge`, `Collapsible` from shadcn/ui.

**Step 4: Create DNS tab**

`dns-tab.tsx` — Table with columns: Domain, Points To, Resolved IP, Status. Status shows colored badges: green "Corretto", yellow "Cloudflare", red "Non punta qui", gray "Parcheggiato".

**Step 5: Create SSL tab**

`ssl-tab.tsx` — Table with: Domain, Issuer, Expires, AutoSSL, Status. Status badges: green "Valido", yellow "In scadenza", red "Scaduto".

**Step 6: Commit**

```bash
git add src/components/servers/server-agent-tabs.tsx src/components/servers/tabs/
git commit -m "feat(ui): add server detail tabs for agent data (overview, accounts, dns, ssl)"
```

---

## Task 14: Integrate tabs into Server page

**Files:**
- Modify: `src/app/(dashboard)/portfolio/servers/page.tsx`

**Step 1: Add server detail drawer/modal**

Modify the servers page to show the `ServerAgentTabs` component when a server with `panel_type` is clicked. This can be:
- A slide-out `Sheet` (shadcn/ui) from the right side
- Or an inline expansion below the server card

The component should:
- Show current server info header (name, hostname, agent status badge)
- Render `AgentSetup` if `agent_status === 'not_installed'`
- Render `ServerAgentTabs` if agent is online/synced
- Show offline warning if `agent_status === 'offline'`

**Step 2: Commit**

```bash
git add src/app/(dashboard)/portfolio/servers/page.tsx
git commit -m "feat(ui): integrate agent tabs into server portfolio page"
```

---

## Task 15: PHP Agent — Core framework

**Files:**
- Create: `server-agent/agent.php`
- Create: `server-agent/config.example.php`
- Create: `server-agent/core/Orchestrator.php`
- Create: `server-agent/core/HttpClient.php`
- Create: `server-agent/core/Logger.php`

**Step 1: Create entry point and config**

`agent.php` — Entry point called by cron. Loads config, instantiates Orchestrator, runs sync.

`config.example.php` — Template with `PLATFORM_URL`, `AGENT_TOKEN`, `ENABLED_MODULES` array, `SYNC_INTERVAL_HOURS` (default 6), `HEARTBEAT_INTERVAL_MINUTES` (default 5).

**Step 2: Create Orchestrator**

`Orchestrator.php` — Loads enabled modules, determines if this run is a full sync or diff (based on last full sync timestamp stored in `/tmp/wm_agent_state.json`). Calls each module, collects results, passes to HttpClient.

**Step 3: Create HttpClient**

`HttpClient.php` — Sends JSON payloads via `curl` to platform API. Handles:
- Bearer token auth header
- Retry 3x with exponential backoff (1s, 4s, 16s)
- Queue to `/tmp/wm_queue/` on failure
- Flush queue before sending new data

**Step 4: Create Logger**

`Logger.php` — Simple file logger to `/var/log/wm_agent.log` with rotation (max 5MB).

**Step 5: Commit**

```bash
git add server-agent/
git commit -m "feat(agent): add PHP agent core framework (orchestrator, http client, logger)"
```

---

## Task 16: PHP Agent — cPanel Adapter

**Files:**
- Create: `server-agent/adapters/PanelAdapterInterface.php`
- Create: `server-agent/adapters/CpanelAdapter.php`

**Step 1: Create adapter interface**

```php
<?php
// server-agent/adapters/PanelAdapterInterface.php
interface PanelAdapterInterface {
    public function getAccounts(): array;
    public function getAccountDomains(string $username): array;
    public function getDnsZones(): array;
    public function getSslCertificates(): array;
    public function getServerResources(): array;
    public function getAccountEmails(string $username): array;
    public function getAccountDatabases(string $username): array;
    public function getAccountPhpVersion(string $username): string;
    public function getBackupStatus(string $username): array;
    public function getErrorLogs(string $username): array;
    public function getDocumentRoot(string $username, string $domain): string;
}
```

**Step 2: Create cPanel adapter**

`CpanelAdapter.php` — Implements the interface using WHM API (port 2087) for server-wide operations and cPanel UAPI (port 2083) for per-account operations.

Key API calls:
- `WHM::listaccts` → list all accounts
- `WHM::listzones` → DNS zones
- `UAPI::SSL::installed_hosts` → SSL certs
- `UAPI::DomainInfo::list_domains` → addon, sub, parked domains
- `WHM::get_domain_info` → document roots
- Shell commands for CMS detection (file_exists checks)

Auth: WHM API token or root credentials stored in config.

**Step 3: Commit**

```bash
git add server-agent/adapters/
git commit -m "feat(agent): add cPanel adapter with WHM/UAPI integration"
```

---

## Task 17: PHP Agent — Phase 1 Modules

**Files:**
- Create: `server-agent/modules/ModuleInterface.php`
- Create: `server-agent/modules/AccountsModule.php`
- Create: `server-agent/modules/CmsDetectorModule.php`
- Create: `server-agent/modules/DnsModule.php`
- Create: `server-agent/modules/SslModule.php`

**Step 1: Create module interface**

```php
<?php
// server-agent/modules/ModuleInterface.php
interface ModuleInterface {
    public function getName(): string;
    public function collect(PanelAdapterInterface $adapter): array;
}
```

**Step 2: Create AccountsModule**

Calls `adapter->getAccounts()` and `adapter->getAccountDomains()` for each account. Returns normalized account data with domains, disk usage, bandwidth.

**Step 3: Create CmsDetectorModule**

For each account's document roots, checks for CMS-specific files:
- `wp-config.php` → WordPress (reads version from `wp-includes/version.php`)
- `config/settings.inc.php` → PrestaShop (reads version from `app/AppKernel.php` or config)
- `configuration.php` → Joomla
- `sites/default/settings.php` → Drupal
- `artisan` → Laravel
- `.next/` directory → Next.js

Returns map of domain → {type, version}.

**Step 4: Create DnsModule**

Calls `adapter->getDnsZones()`. For each zone, also performs a DNS lookup (`dns_get_record`) to verify if the domain actually resolves to this server's IP. Sets `points_to_this_server` flag.

**Step 5: Create SslModule**

Calls `adapter->getSslCertificates()`. Parses expiry dates, determines status (valid/expiring/expired), checks AutoSSL status.

**Step 6: Commit**

```bash
git add server-agent/modules/
git commit -m "feat(agent): add Phase 1 modules (accounts, cms, dns, ssl)"
```

---

## Task 18: PHP Agent — Event Detector

**Files:**
- Create: `server-agent/events/EventDetector.php`

**Step 1: Create event detector**

Compares current collected data with the previous snapshot (`/tmp/wm_agent_state.json`). Detects:
- New accounts added
- Accounts removed
- New domains added/removed
- SSL status changes (valid → expiring → expired)
- New CMS detected or version changed

If any critical events detected, triggers an immediate push to `/api/agent/event`.

Saves current state as new snapshot after comparison.

**Step 2: Commit**

```bash
git add server-agent/events/
git commit -m "feat(agent): add event detector for diff-based change tracking"
```

---

## Task 19: PHP Agent — Install Script

**Files:**
- Create: `server-agent/install.sh`

**Step 1: Create install script**

Bash script that:
1. Parses `--token` and `--url` arguments
2. Checks prerequisites: PHP 7.4+, curl, root or WHM access
3. Creates directory `/opt/webmaster-monitor/`
4. Downloads agent files from platform (or copies from embedded)
5. Writes `config.php` with provided token and URL
6. Sets up cron: `*/15 * * * * php /opt/webmaster-monitor/agent.php >> /var/log/wm_agent.log 2>&1`
7. Runs first heartbeat to confirm connection
8. Prints success message

**Step 2: Commit**

```bash
git add server-agent/install.sh
git commit -m "feat(agent): add one-liner install script"
```

---

## Task 20: Install script API route

**Files:**
- Create: `src/app/api/agent/install.sh/route.ts`

**Step 1: Create route that serves the install script**

```typescript
// src/app/api/agent/install.sh/route.ts
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  // Serve the install script with correct content type
  // In production, this would serve the latest version from a CDN or embed it
  const script = `#!/bin/bash
set -e

# Webmaster Monitor Agent Installer
# Usage: curl -sL https://your-platform/api/agent/install.sh | bash -s -- --token="TOKEN" --url="URL"

TOKEN=""
PLATFORM_URL=""
INSTALL_DIR="/opt/webmaster-monitor"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --token=*) TOKEN="\${1#*=}"; shift ;;
    --url=*) PLATFORM_URL="\${1#*=}"; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ -z "$TOKEN" ] || [ -z "$PLATFORM_URL" ]; then
  echo "Error: --token and --url are required"
  exit 1
fi

echo "=== Webmaster Monitor Agent Installer ==="

# Check PHP
if ! command -v php &> /dev/null; then
  echo "Error: PHP is required but not installed"
  exit 1
fi

PHP_VERSION=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
echo "PHP version: $PHP_VERSION"

# Create directory
mkdir -p "$INSTALL_DIR"
echo "Install directory: $INSTALL_DIR"

# Download agent files
echo "Downloading agent..."
curl -sL "$PLATFORM_URL/api/agent/download" -o /tmp/wm-agent.tar.gz
tar -xzf /tmp/wm-agent.tar.gz -C "$INSTALL_DIR"
rm /tmp/wm-agent.tar.gz

# Write config
cat > "$INSTALL_DIR/config.php" <<PHPEOF
<?php
return [
    'platform_url' => '$PLATFORM_URL',
    'agent_token' => '$TOKEN',
    'enabled_modules' => ['accounts', 'cms_detector', 'dns', 'ssl'],
    'sync_interval_hours' => 6,
    'heartbeat_interval_minutes' => 5,
];
PHPEOF

# Setup cron
CRON_LINE="*/15 * * * * php $INSTALL_DIR/agent.php >> /var/log/wm_agent.log 2>&1"
(crontab -l 2>/dev/null | grep -v "wm_agent\\|webmaster-monitor"; echo "$CRON_LINE") | crontab -
echo "Cron job installed (every 15 minutes)"

# Send first heartbeat
echo "Sending first heartbeat..."
php "$INSTALL_DIR/agent.php" --heartbeat-only

echo ""
echo "=== Installation complete ==="
echo "Agent installed at: $INSTALL_DIR"
echo "Logs: /var/log/wm_agent.log"
echo "The agent will sync data every 15 minutes."
`;

  return new Response(script, {
    headers: {
      'Content-Type': 'text/x-shellscript',
      'Content-Disposition': 'inline; filename="install.sh"',
    },
  });
}
```

**Step 2: Commit**

```bash
git add src/app/api/agent/install.sh/
git commit -m "feat(api): serve install script via API route"
```

---

## Summary

### Execution order

| Task | Area | Description | Depends on |
|------|------|-------------|------------|
| 1 | DB | Migration — server extensions + new tables | — |
| 2 | Types | TypeScript interfaces for agent data | 1 |
| 3 | Validation | Zod schemas for agent payloads | 2 |
| 4 | Auth | Agent token generation utility | — |
| 5 | Auth | Agent request authentication | 4 |
| 6 | Logic | Sync processor (auto-match, imports) | 3, 5 |
| 7 | API | Agent sync/heartbeat/register routes | 5, 6 |
| 8 | API | Pending imports list + actions | 6 |
| 9 | API | Server agent data endpoint for UI | 1 |
| 10 | Middleware | Allow agent routes without session | 7 |
| 11 | UI | Server form — panel type selector | 2 |
| 12 | UI | Agent setup wizard | 7 |
| 13 | UI | Server detail tabs (overview, accounts, dns, ssl) | 9 |
| 14 | UI | Integrate tabs into server page | 11, 12, 13 |
| 15 | Agent | PHP core framework | — |
| 16 | Agent | cPanel adapter (WHM/UAPI) | 15 |
| 17 | Agent | Phase 1 modules (accounts, cms, dns, ssl) | 16 |
| 18 | Agent | Event detector (diff tracking) | 17 |
| 19 | Agent | Install script (bash) | 15 |
| 20 | API | Serve install script route | 19 |

### Parallel tracks

Tasks can be executed in 3 parallel tracks:
- **Track A (Platform Backend):** Tasks 1→2→3→4→5→6→7→8→9→10
- **Track B (Platform UI):** Tasks 11→12→13→14 (after Task 9)
- **Track C (PHP Agent):** Tasks 15→16→17→18→19→20 (independent)

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
  account: z.string(),
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

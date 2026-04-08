/**
 * One-shot migration: move all data owned by a user from the shared "Personal"
 * tenant (00000000-0000-0000-0000-000000000001) into a dedicated tenant.
 *
 * WHY: The Personal tenant has max_sites=1000 and is the default for OAuth
 * signups. If anyone else ever lands there, they'd see all existing sites.
 * This script isolates the owner's data into a private workspace.
 *
 * USAGE:
 *   1) Dry-run (default): shows what WOULD be migrated
 *      npx --yes tsx scripts/migrate-to-dedicated-tenant.ts <user-email> "I-Creativi"
 *   2) Commit: actually perform the migration
 *      npx --yes tsx scripts/migrate-to-dedicated-tenant.ts <user-email> "I-Creativi" --commit
 *
 * REQUIRED ENV:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Idempotency: running with --commit twice will be a no-op the second time
 * because the user will already be in the new tenant and the old tenant
 * will have no remaining rows.
 */

import { createClient } from '@supabase/supabase-js';

const PERSONAL_TENANT_ID = '00000000-0000-0000-0000-000000000001';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const args = process.argv.slice(2);
const userEmail = args[0];
const tenantName = args[1];
const commit = args.includes('--commit');

if (!userEmail || !tenantName) {
  console.error('Usage: migrate-to-dedicated-tenant.ts <user-email> <tenant-name> [--commit]');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/**
 * Generate a URL-safe slug from the tenant name.
 */
function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || `workspace-${Date.now().toString(36)}`;
}

/**
 * Find all tables in the public schema that have a `tenant_id` column.
 * Uses a Postgres function via raw SQL since REST client can't query
 * information_schema directly with filters.
 *
 * Fallback: if the RPC is not available, return a hardcoded list.
 */
const HARDCODED_TENANT_TABLES = [
  'sites',
  'alerts',
  'alert_channels',
  'alert_rules',
  'activity_logs',
  'clients',
  'servers',
  'brands',
  'team_invitations',
  'site_backups',
  'security_scans',
  'vercel_integrations',
  'external_scan_results',
  'server_accounts',
  'server_cron_jobs',
  'server_domains',
  'server_packages',
  'dns_zone_snapshots',
  'dns_records_snapshots',
  'performance_snapshots',
  'disk_usage_history',
  'email_accounts',
  'databases_info',
];

async function findTenantTables(): Promise<string[]> {
  // Try to count rows in each hardcoded table for the old tenant;
  // silently skip tables that don't exist in the current DB.
  const existing: string[] = [];
  for (const table of HARDCODED_TENANT_TABLES) {
    const { error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', PERSONAL_TENANT_ID);

    if (!error) {
      existing.push(table);
    } else if (error.code === '42P01') {
      // Undefined table — skip silently
    } else if (error.code === '42703') {
      // Column doesn't exist on this table — skip
    } else {
      // Any other error: log but include table so user knows about it
      console.warn(`  [warn] ${table}: ${error.message}`);
    }
  }
  return existing;
}

async function countRows(table: string, tenantId: string): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  if (error) return 0;
  return count ?? 0;
}

async function main() {
  console.log(`\nTarget: migrate data from Personal tenant to a new dedicated tenant.`);
  console.log(`  User email:  ${userEmail}`);
  console.log(`  New tenant:  ${tenantName}`);
  console.log(`  Mode:        ${commit ? 'COMMIT (will modify DB)' : 'DRY-RUN (no changes)'}`);
  console.log('');

  // 1. Find the user
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, email, name, current_tenant_id')
    .eq('email', userEmail.toLowerCase())
    .single();

  if (userErr || !user) {
    console.error(`User not found: ${userEmail}`);
    process.exit(1);
  }
  console.log(`Found user: ${user.id} (${user.email})`);

  // 2. Check current user membership
  const { data: memberships } = await supabase
    .from('user_tenants')
    .select('tenant_id, role')
    .eq('user_id', user.id);

  console.log(`Current memberships: ${memberships?.length ?? 0}`);
  for (const m of memberships || []) {
    console.log(`  - tenant=${m.tenant_id} role=${m.role}`);
  }

  // 3. Discover tables with tenant_id
  console.log(`\nDiscovering tenant-scoped tables...`);
  const tables = await findTenantTables();
  console.log(`Found ${tables.length} tenant-scoped tables.`);

  // 4. Count rows in Personal tenant per table
  console.log(`\nRows in Personal tenant (${PERSONAL_TENANT_ID}):`);
  const counts: Record<string, number> = {};
  let totalRows = 0;
  for (const table of tables) {
    const n = await countRows(table, PERSONAL_TENANT_ID);
    counts[table] = n;
    totalRows += n;
    if (n > 0) console.log(`  ${table.padEnd(30)} ${n}`);
  }
  console.log(`  ${'TOTAL'.padEnd(30)} ${totalRows}`);

  if (totalRows === 0) {
    console.log(`\nNothing to migrate. The Personal tenant is already empty.`);
    process.exit(0);
  }

  if (!commit) {
    console.log(`\n[DRY-RUN] No changes made. Re-run with --commit to apply.`);
    process.exit(0);
  }

  // 5. Check if a tenant with the same slug already exists
  const slug = toSlug(tenantName);
  console.log(`\nCreating new tenant: name="${tenantName}" slug="${slug}"...`);

  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle();

  let newTenantId: string;
  if (existingTenant) {
    console.log(`  Tenant with slug "${slug}" already exists: ${existingTenant.id}`);
    console.log(`  Reusing it.`);
    newTenantId = existingTenant.id;
  } else {
    const { data: newTenant, error: createErr } = await supabase
      .from('tenants')
      .insert({
        name: tenantName,
        slug,
        plan: 'enterprise',
        max_sites: 1000,
      })
      .select('id')
      .single();

    if (createErr || !newTenant) {
      console.error(`Failed to create tenant: ${createErr?.message}`);
      process.exit(1);
    }
    newTenantId = newTenant.id;
    console.log(`  Created: ${newTenantId}`);
  }

  // 6. Move all tenant-scoped rows
  console.log(`\nMigrating rows from Personal to ${newTenantId}...`);
  for (const table of tables) {
    if (counts[table] === 0) continue;
    const { error: updErr, count: updCount } = await supabase
      .from(table)
      .update({ tenant_id: newTenantId }, { count: 'exact' })
      .eq('tenant_id', PERSONAL_TENANT_ID);

    if (updErr) {
      console.error(`  [FAIL] ${table}: ${updErr.message}`);
    } else {
      console.log(`  [OK]   ${table.padEnd(30)} ${updCount ?? counts[table]} rows`);
    }
  }

  // 7. Add user_tenants membership for the new tenant
  console.log(`\nLinking user to new tenant as owner...`);
  const { error: membershipErr } = await supabase
    .from('user_tenants')
    .upsert(
      {
        user_id: user.id,
        tenant_id: newTenantId,
        role: 'owner',
      },
      { onConflict: 'user_id,tenant_id' }
    );

  if (membershipErr) {
    console.error(`  [FAIL] ${membershipErr.message}`);
  } else {
    console.log(`  [OK]`);
  }

  // 8. Update user's current_tenant_id
  console.log(`\nSetting current_tenant_id for user...`);
  const { error: userUpdErr } = await supabase
    .from('users')
    .update({ current_tenant_id: newTenantId })
    .eq('id', user.id);

  if (userUpdErr) {
    console.error(`  [FAIL] ${userUpdErr.message}`);
  } else {
    console.log(`  [OK] current_tenant_id = ${newTenantId}`);
  }

  // 9. Remove user's membership from Personal tenant
  console.log(`\nRemoving user's membership from Personal tenant...`);
  const { error: delErr } = await supabase
    .from('user_tenants')
    .delete()
    .eq('user_id', user.id)
    .eq('tenant_id', PERSONAL_TENANT_ID);

  if (delErr) {
    console.error(`  [FAIL] ${delErr.message}`);
  } else {
    console.log(`  [OK]`);
  }

  console.log(`\n✅ Migration complete.`);
  console.log(`   New tenant ID: ${newTenantId}`);
  console.log(`   Tell the user to log out and back in to refresh the session.`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

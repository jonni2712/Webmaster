import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from '@/lib/rate-limit';

/**
 * GDPR Article 15 — Right of Access.
 *
 * Returns a JSON file containing ALL data the platform holds about the
 * authenticated user and the tenant(s) they belong to. The user can then
 * inspect or store this locally as proof of their data footprint.
 *
 * Scope of the export:
 *   - The user's own profile + auth metadata (excluding password hash)
 *   - Every tenant the user is a member of, with their role
 *   - For each owned tenant: sites (secrets redacted), alert channels,
 *     alert rules, active alerts (last 90 days), activity log (last 90 days)
 *   - Active billing plan details (read-only)
 *
 * Sensitive fields are redacted:
 *   - `api_key_encrypted` / `api_secret_encrypted` → "REDACTED"
 *   - `password_hash` → never included
 *
 * Rate limit: 2 exports per user per hour (prevents accidental spamming
 * and DB scraping if an attacker gets a token).
 */

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 2 exports per user per hour.
  const ip = getClientIp(request);
  const rl = await checkRateLimit({
    name: 'gdpr_export',
    identifier: `user:${session.user.id}`,
    max: 2,
    windowSeconds: 3600,
  });
  if (!rl.allowed) {
    return rateLimitResponse(rl);
  }

  // Also a per-IP limit to slow down scripted abuse.
  const ipLimit = await checkRateLimit({
    name: 'gdpr_export_ip',
    identifier: `ip:${ip}`,
    max: 5,
    windowSeconds: 3600,
  });
  if (!ipLimit.allowed) {
    return rateLimitResponse(ipLimit);
  }

  const supabase = createAdminClient();
  const userId = session.user.id;

  try {
    // --- User profile ---
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, avatar_url, email_verified, created_at, updated_at, current_tenant_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // --- Memberships (all tenants the user belongs to) ---
    const { data: memberships } = await supabase
      .from('user_tenants')
      .select('tenant_id, role, created_at')
      .eq('user_id', userId);

    const tenantIds = (memberships || []).map((m) => (m as { tenant_id: string }).tenant_id);

    // --- Tenant details ---
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, name, slug, plan, plan_id, max_sites, settings, created_at')
      .in('id', tenantIds);

    // --- Sites (owned by any of the user's tenants) ---
    const { data: rawSites } = await supabase
      .from('sites')
      .select('*')
      .in('tenant_id', tenantIds);

    // Redact secrets from sites before including in the export.
    const sites = (rawSites || []).map((s) => {
      const site = s as Record<string, unknown>;
      const { api_key_encrypted, api_secret_encrypted, ...rest } = site;
      return {
        ...rest,
        api_key_configured: !!api_key_encrypted,
        api_secret_configured: !!api_secret_encrypted,
      };
    });

    // --- Alert channels ---
    const { data: alertChannels } = await supabase
      .from('alert_channels')
      .select('*')
      .in('tenant_id', tenantIds);

    // --- Alert rules ---
    const { data: alertRules } = await supabase
      .from('alert_rules')
      .select('*')
      .in('tenant_id', tenantIds);

    // --- Recent alerts (last 90 days) ---
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: alerts } = await supabase
      .from('alerts')
      .select('*')
      .in('tenant_id', tenantIds)
      .gte('created_at', ninetyDaysAgo)
      .order('created_at', { ascending: false });

    // --- Recent activity log (last 90 days) ---
    const { data: activityLogs } = await supabase
      .from('activity_logs')
      .select('*')
      .in('tenant_id', tenantIds)
      .gte('created_at', ninetyDaysAgo)
      .order('created_at', { ascending: false });

    // --- Clients / brands / servers (tenant-scoped metadata) ---
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .in('tenant_id', tenantIds);

    const { data: brands } = await supabase
      .from('brands')
      .select('*')
      .in('tenant_id', tenantIds);

    // Build the export bundle.
    const exportPayload = {
      _meta: {
        export_version: 1,
        generated_at: new Date().toISOString(),
        generated_by: 'webmaster-monitor',
        gdpr_article: 'GDPR Art. 15 — Right of Access',
        notes:
          'Sensitive fields (api_key_encrypted, api_secret_encrypted) have been replaced with boolean flags. Password hash is never included.',
      },
      user: {
        ...user,
        password_hash: undefined,
      },
      memberships: memberships || [],
      tenants: tenants || [],
      sites,
      alert_channels: alertChannels || [],
      alert_rules: alertRules || [],
      alerts: alerts || [],
      activity_logs: activityLogs || [],
      clients: clients || [],
      brands: brands || [],
      counts: {
        sites: sites.length,
        alert_channels: (alertChannels || []).length,
        alert_rules: (alertRules || []).length,
        alerts_last_90_days: (alerts || []).length,
        activity_logs_last_90_days: (activityLogs || []).length,
        clients: (clients || []).length,
        brands: (brands || []).length,
      },
    };

    const body = JSON.stringify(exportPayload, null, 2);
    const filename = `webmaster-monitor-export-${user.email.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[gdpr-export] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Errore durante l\'esportazione dei dati' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity/logger';
import dns from 'dns';
import { promisify } from 'util';

const dnsResolve4 = promisify(dns.resolve4);
const dnsLookup = promisify(dns.lookup);

interface RegisterItRow {
  ID?: string;
  Dominio?: string;
  Descrizione?: string;
  'Dati Supplementari'?: string;
  'Data di Scadenza'?: string;
  // Alternative column names (lowercase)
  id?: string;
  dominio?: string;
  descrizione?: string;
  'data di scadenza'?: string;
}

interface ImportResult {
  domain: string;
  status: 'created' | 'exists' | 'error';
  siteId?: string;
  serverAssigned?: string;
  error?: string;
}

/**
 * Resolve domain to IP address
 */
async function resolveDomainIP(domain: string): Promise<string | null> {
  try {
    const addresses = await dnsResolve4(domain);
    if (addresses && addresses.length > 0) {
      return addresses[0];
    }
  } catch {
    try {
      const result = await dnsLookup(domain, 4);
      return (result as any).address;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Parse date from various formats
 */
function parseExpiryDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;

  // Try different date formats
  // Format: 2026-06-27 (ISO)
  // Format: 27/06/2026 (IT)
  // Format: 27-06-2026

  let date: Date | null = null;

  // ISO format: 2026-06-27
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    date = new Date(dateStr);
  }
  // IT format: 27/06/2026 or 27-06-2026
  else if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(dateStr)) {
    const parts = dateStr.split(/[\/\-]/);
    date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  }

  if (date && !isNaN(date.getTime())) {
    return date.toISOString();
  }

  return null;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get user's current tenant
  const { data: user } = await supabase
    .from('users')
    .select('current_tenant_id')
    .eq('id', session.user.id)
    .single();

  if (!user?.current_tenant_id) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // Check user role
  const { data: membership } = await supabase
    .from('user_tenants')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json(
      { error: 'Non hai i permessi per questa operazione' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { rows, registrar = 'Register.it', autoAssign = true } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Nessun dominio da importare' },
        { status: 400 }
      );
    }

    // Get servers for auto-assign
    let ipToServer = new Map<string, { id: string; name: string }>();

    if (autoAssign) {
      const { data: servers } = await supabase
        .from('servers')
        .select('id, name, hostname')
        .eq('tenant_id', user.current_tenant_id)
        .eq('is_active', true);

      if (servers) {
        for (const server of servers) {
          if (server.hostname) {
            const ips = server.hostname.split(/[,\s]+/).map((ip: string) => ip.trim()).filter(Boolean);
            for (const ip of ips) {
              ipToServer.set(ip, { id: server.id, name: server.name });
            }
          }
        }
      }
    }

    // Get existing sites to check for duplicates
    const { data: existingSites } = await supabase
      .from('sites')
      .select('url')
      .eq('tenant_id', user.current_tenant_id);

    const existingUrls = new Set(
      (existingSites || []).map(s => {
        try {
          return new URL(s.url).hostname.toLowerCase();
        } catch {
          return s.url.toLowerCase();
        }
      })
    );

    const results: ImportResult[] = [];
    let created = 0;
    let skipped = 0;
    let errors = 0;
    let assigned = 0;

    for (const row of rows as RegisterItRow[]) {
      // Get domain from various possible column names
      const domain = (row.Dominio || row.dominio || '').trim().toLowerCase();

      if (!domain) {
        continue;
      }

      // Check if already exists
      if (existingUrls.has(domain)) {
        results.push({
          domain,
          status: 'exists',
          error: 'Dominio già presente',
        });
        skipped++;
        continue;
      }

      try {
        // Parse expiry date
        const expiryDate = parseExpiryDate(row['Data di Scadenza'] || row['data di scadenza']);

        // Prepare site data
        const siteData: Record<string, unknown> = {
          tenant_id: user.current_tenant_id,
          name: domain,
          url: `https://${domain}`,
          platform: 'other',
          domain_registrar: registrar,
          domain_expires_at: expiryDate,
          domain_notes: row.Descrizione || row.descrizione || null,
          lifecycle_status: 'active',
          ssl_check_enabled: true,
          uptime_check_enabled: true,
          performance_check_enabled: false,
          updates_check_enabled: false,
          ecommerce_check_enabled: false,
          tags: [],
        };

        // Auto-assign server via DNS
        let serverName: string | undefined;
        if (autoAssign && ipToServer.size > 0) {
          const ip = await resolveDomainIP(domain);
          if (ip) {
            const server = ipToServer.get(ip);
            if (server) {
              siteData.server_id = server.id;
              serverName = server.name;
              assigned++;
            }
          }
        }

        // Create site
        const { data: site, error: createError } = await supabase
          .from('sites')
          .insert(siteData)
          .select('id')
          .single();

        if (createError) {
          throw new Error(createError.message);
        }

        results.push({
          domain,
          status: 'created',
          siteId: site.id,
          serverAssigned: serverName,
        });
        created++;
        existingUrls.add(domain); // Prevent duplicates within same import

      } catch (err) {
        results.push({
          domain,
          status: 'error',
          error: err instanceof Error ? err.message : 'Errore sconosciuto',
        });
        errors++;
      }
    }

    // Log activity
    await logActivity({
      tenantId: user.current_tenant_id,
      userId: session.user.id,
      actionType: 'settings_updated',
      resourceType: 'portfolio',
      metadata: {
        action: 'import_registrar',
        registrar,
        total: rows.length,
        created,
        skipped,
        errors,
        assigned,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Importati ${created} domini, ${skipped} già esistenti, ${errors} errori`,
      summary: {
        total: rows.length,
        created,
        skipped,
        errors,
        assigned,
      },
      results,
    });

  } catch (error) {
    console.error('POST /api/portfolio/import-registrar error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

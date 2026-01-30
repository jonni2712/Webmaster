import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity/logger';
import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);
const dnsResolve4 = promisify(dns.resolve4);

interface AssignmentResult {
  siteId: string;
  siteName: string;
  domain: string;
  resolvedIp: string | null;
  assignedServerId: string | null;
  assignedServerName: string | null;
  status: 'assigned' | 'no_match' | 'error';
  error?: string;
}

/**
 * Resolve domain to IP address
 */
async function resolveDomainIP(domain: string): Promise<string | null> {
  try {
    // Try resolve4 first (gets all A records)
    const addresses = await dnsResolve4(domain);
    if (addresses && addresses.length > 0) {
      return addresses[0];
    }
  } catch {
    // Fallback to lookup
    try {
      const result = await dnsLookup(domain, 4);
      return result.address;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
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
    const body = await request.json().catch(() => ({}));
    const onlyUnassigned = body.onlyUnassigned !== false; // Default true
    const dryRun = body.dryRun === true; // Default false

    // Get all servers with their IPs
    const { data: servers, error: serversError } = await supabase
      .from('servers')
      .select('id, name, hostname')
      .eq('tenant_id', user.current_tenant_id)
      .eq('is_active', true);

    if (serversError) {
      return NextResponse.json({ error: serversError.message }, { status: 500 });
    }

    if (!servers || servers.length === 0) {
      return NextResponse.json(
        { error: 'Nessun server configurato. Aggiungi almeno un server con il suo IP.' },
        { status: 400 }
      );
    }

    // Build IP to server map
    const ipToServer = new Map<string, { id: string; name: string }>();
    for (const server of servers) {
      if (server.hostname) {
        // Handle multiple IPs separated by comma or space
        const ips = server.hostname.split(/[,\s]+/).map((ip: string) => ip.trim()).filter(Boolean);
        for (const ip of ips) {
          ipToServer.set(ip, { id: server.id, name: server.name });
        }
      }
    }

    if (ipToServer.size === 0) {
      return NextResponse.json(
        { error: 'Nessun server ha un IP configurato. Aggiungi gli IP nel campo Hostname dei server.' },
        { status: 400 }
      );
    }

    // Get sites to process
    let sitesQuery = supabase
      .from('sites')
      .select('id, name, url, server_id')
      .eq('tenant_id', user.current_tenant_id)
      .is('parent_site_id', null); // Exclude subsites

    if (onlyUnassigned) {
      sitesQuery = sitesQuery.is('server_id', null);
    }

    const { data: sites, error: sitesError } = await sitesQuery;

    if (sitesError) {
      return NextResponse.json({ error: sitesError.message }, { status: 500 });
    }

    if (!sites || sites.length === 0) {
      return NextResponse.json({
        success: true,
        message: onlyUnassigned
          ? 'Tutti i siti hanno già un server assegnato'
          : 'Nessun sito da processare',
        results: [],
        summary: { total: 0, assigned: 0, noMatch: 0, errors: 0 }
      });
    }

    // Process each site
    const results: AssignmentResult[] = [];
    const updates: { id: string; server_id: string }[] = [];

    for (const site of sites) {
      const domain = extractDomain(site.url);
      let result: AssignmentResult = {
        siteId: site.id,
        siteName: site.name,
        domain,
        resolvedIp: null,
        assignedServerId: null,
        assignedServerName: null,
        status: 'error',
      };

      try {
        const ip = await resolveDomainIP(domain);
        result.resolvedIp = ip;

        if (ip) {
          const server = ipToServer.get(ip);
          if (server) {
            result.assignedServerId = server.id;
            result.assignedServerName = server.name;
            result.status = 'assigned';
            updates.push({ id: site.id, server_id: server.id });
          } else {
            result.status = 'no_match';
            result.error = `IP ${ip} non corrisponde a nessun server configurato`;
          }
        } else {
          result.status = 'error';
          result.error = 'Impossibile risolvere il dominio';
        }
      } catch (err) {
        result.status = 'error';
        result.error = err instanceof Error ? err.message : 'Errore sconosciuto';
      }

      results.push(result);
    }

    // Apply updates if not dry run
    if (!dryRun && updates.length > 0) {
      for (const update of updates) {
        await supabase
          .from('sites')
          .update({ server_id: update.server_id })
          .eq('id', update.id);
      }

      // Log activity
      await logActivity({
        tenantId: user.current_tenant_id,
        userId: session.user.id,
        actionType: 'settings_updated',
        resourceType: 'portfolio',
        metadata: {
          action: 'auto_assign_servers',
          assigned: updates.length,
          total: sites.length
        },
      });
    }

    const summary = {
      total: results.length,
      assigned: results.filter(r => r.status === 'assigned').length,
      noMatch: results.filter(r => r.status === 'no_match').length,
      errors: results.filter(r => r.status === 'error').length,
    };

    return NextResponse.json({
      success: true,
      dryRun,
      message: dryRun
        ? `Simulazione completata: ${summary.assigned} siti verrebbero assegnati`
        : `Assegnati ${summary.assigned} siti su ${summary.total}`,
      summary,
      results,
      serverIps: Object.fromEntries(ipToServer.entries()),
    });

  } catch (error) {
    console.error('POST /api/portfolio/auto-assign error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

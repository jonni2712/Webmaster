import { createAdminClient } from '@/lib/supabase/admin';

export interface DomainEntry {
  domain: string;
  site_id: string;
  tenant_id: string;
}

/**
 * Extracts a clean domain from a URL string.
 * "https://www.example.com/path" → "example.com"
 */
function extractDomain(url: string): string {
  try {
    let clean = url.trim();
    if (!clean.includes('://')) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0]
      .trim();
  }
}

/**
 * Collects all unique domains from the sites table for a tenant.
 * Includes all sites regardless of lifecycle status (active, archived, redirect, etc.)
 */
export async function collectDomains(tenantId: string): Promise<DomainEntry[]> {
  const supabase = createAdminClient();
  const domainMap = new Map<string, DomainEntry>();

  const { data: sites } = await supabase
    .from('sites')
    .select('id, url')
    .eq('tenant_id', tenantId);

  if (sites) {
    for (const site of sites) {
      if (!site.url) continue;
      const domain = extractDomain(site.url);
      if (!domain) continue;

      if (!domainMap.has(domain)) {
        domainMap.set(domain, {
          domain,
          site_id: site.id,
          tenant_id: tenantId,
        });
      }
    }
  }

  return Array.from(domainMap.values());
}

/**
 * Fetches all active tenant IDs.
 */
export async function getAllTenantIds(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('tenants')
    .select('id');

  return (data || []).map(t => t.id);
}

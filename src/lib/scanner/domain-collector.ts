import { createAdminClient } from '@/lib/supabase/admin';

export interface DomainEntry {
  domain: string;
  site_id: string | null;
  portfolio_site_id: string | null;
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
    // Fallback: strip protocol and path manually
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0]
      .trim();
  }
}

/**
 * Collects all unique domains across sites and portfolio_sites for a tenant.
 */
export async function collectDomains(tenantId: string): Promise<DomainEntry[]> {
  const supabase = createAdminClient();
  const domainMap = new Map<string, DomainEntry>();

  // Fetch from sites table
  const { data: sites } = await supabase
    .from('sites')
    .select('id, url')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (sites) {
    for (const site of sites) {
      if (!site.url) continue;
      const domain = extractDomain(site.url);
      if (!domain) continue;

      const existing = domainMap.get(domain);
      if (existing) {
        existing.site_id = site.id;
      } else {
        domainMap.set(domain, {
          domain,
          site_id: site.id,
          portfolio_site_id: null,
          tenant_id: tenantId,
        });
      }
    }
  }

  // Fetch from portfolio_sites table
  const { data: portfolioSites } = await supabase
    .from('portfolio_sites')
    .select('id, domain')
    .eq('tenant_id', tenantId);

  if (portfolioSites) {
    for (const ps of portfolioSites) {
      if (!ps.domain) continue;
      const domain = extractDomain(ps.domain);
      if (!domain) continue;

      const existing = domainMap.get(domain);
      if (existing) {
        existing.portfolio_site_id = ps.id;
      } else {
        domainMap.set(domain, {
          domain,
          site_id: null,
          portfolio_site_id: ps.id,
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

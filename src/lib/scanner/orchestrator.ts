import { createAdminClient } from '@/lib/supabase/admin';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
import { collectDomains, type DomainEntry } from './domain-collector';
import { scanDns } from './dns-scanner';
import { scanSsl } from './ssl-scanner';
import { scanHttp } from './http-scanner';
import { detectCms } from './cms-detector';
import { scanWhois } from './whois-scanner';

export interface ScanSummary {
  total_domains: number;
  scanned: number;
  errors: number;
  duration_ms: number;
}

const BATCH_SIZE = 5;
const WHOIS_DELAY_MS = 1200; // Rate limit: ~1 query/sec

/**
 * Run DNS + SSL + HTTP scan for all domains of a tenant.
 * Called every 6 hours.
 */
export async function runDnsSslScan(tenantId: string): Promise<ScanSummary> {
  const startTime = Date.now();
  const domains = await collectDomains(tenantId);
  const summary: ScanSummary = {
    total_domains: domains.length,
    scanned: 0,
    errors: 0,
    duration_ms: 0,
  };

  // Process in batches
  for (let i = 0; i < domains.length; i += BATCH_SIZE) {
    const batch = domains.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(entry => scanDomainDnsSsl(entry))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        summary.scanned++;
      } else {
        summary.errors++;
      }
    }
  }

  summary.duration_ms = Date.now() - startTime;
  return summary;
}

/**
 * Run CMS + WHOIS scan for all domains of a tenant.
 * Called every 24 hours.
 */
export async function runCmsWhoisScan(tenantId: string): Promise<ScanSummary> {
  const startTime = Date.now();
  const domains = await collectDomains(tenantId);
  const summary: ScanSummary = {
    total_domains: domains.length,
    scanned: 0,
    errors: 0,
    duration_ms: 0,
  };

  // Process sequentially for WHOIS rate limiting
  for (const entry of domains) {
    try {
      await scanDomainCmsWhois(entry);
      summary.scanned++;
    } catch {
      summary.errors++;
    }

    // Rate limit for WHOIS
    await sleep(WHOIS_DELAY_MS);
  }

  summary.duration_ms = Date.now() - startTime;
  return summary;
}

async function scanDomainDnsSsl(entry: DomainEntry): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Run DNS, SSL, HTTP in parallel
  const [dnsResult, sslResult, httpResult] = await Promise.allSettled([
    scanDns(entry.domain),
    scanSsl(entry.domain),
    scanHttp(entry.domain),
  ]);

  const dns = dnsResult.status === 'fulfilled' ? dnsResult.value : null;
  const ssl = sslResult.status === 'fulfilled' ? sslResult.value : null;
  const http = httpResult.status === 'fulfilled' ? httpResult.value : null;

  await supabase
    .from('external_scan_results')
    .upsert(
      {
        tenant_id: entry.tenant_id,
        site_id: entry.site_id,
        domain: entry.domain,
        // DNS
        ...(dns ? {
          dns_a_records: dns.a_records,
          dns_mx_records: dns.mx_records,
          dns_ns_records: dns.ns_records,
          dns_txt_records: dns.txt_records,
          dns_cname: dns.cname,
          dns_provider: dns.dns_provider,
          email_provider: dns.email_provider,
          spf_configured: dns.spf_configured,
          dmarc_configured: dns.dmarc_configured,
        } : {}),
        // SSL
        ...(ssl ? {
          ssl_issuer: ssl.issuer,
          ssl_expires_at: ssl.expires_at,
          ssl_valid: ssl.valid,
          ssl_protocol: ssl.protocol,
        } : {}),
        // HTTP
        ...(http ? {
          http_status: http.status,
          http_redirect_chain: http.redirect_chain,
          http_final_url: http.final_url,
          http_response_time_ms: http.response_time_ms,
        } : {}),
        last_dns_scan_at: now,
        updated_at: now,
      },
      { onConflict: 'tenant_id,domain' }
    );
}

async function scanDomainCmsWhois(entry: DomainEntry): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // First get HTTP result for CMS detection (need HTML body)
  const httpResult = await scanHttp(entry.domain);
  const cmsResult = await detectCms(entry.domain, httpResult);
  const whoisResult = await scanWhois(entry.domain);

  await supabase
    .from('external_scan_results')
    .upsert(
      {
        tenant_id: entry.tenant_id,
        site_id: entry.site_id,
        domain: entry.domain,
        // CMS
        cms_detected: cmsResult.cms_type,
        cms_version: cmsResult.version,
        cms_confidence: cmsResult.confidence,
        cms_detection_method: cmsResult.method,
        cms_extras: cmsResult.extras,
        // WHOIS
        whois_registrar: whoisResult.registrar,
        whois_expires_at: whoisResult.expires_at,
        whois_nameservers: whoisResult.nameservers,
        whois_updated_at: whoisResult.updated_at,
        // Timestamps
        last_cms_scan_at: now,
        last_whois_scan_at: now,
        updated_at: now,
      },
      { onConflict: 'tenant_id,domain' }
    );
}

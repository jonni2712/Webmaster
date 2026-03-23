import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { collectDomains } from '@/lib/scanner/domain-collector';
import { scanDns } from '@/lib/scanner/dns-scanner';
import { scanSsl } from '@/lib/scanner/ssl-scanner';
import { scanHttp } from '@/lib/scanner/http-scanner';
import { detectCms } from '@/lib/scanner/cms-detector';
import { scanWhois } from '@/lib/scanner/whois-scanner';

type RouteContext = { params: Promise<{ domain: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { domain } = await params;
  const user = session.user as { current_tenant_id?: string };
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('external_scan_results')
    .select('*')
    .eq('tenant_id', user.current_tenant_id)
    .eq('domain', decodeURIComponent(domain))
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, result: data });
}

// Manual re-scan trigger
export async function POST(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { domain: rawDomain } = await params;
  const domain = decodeURIComponent(rawDomain);
  const user = session.user as { current_tenant_id?: string };
  const tenantId = user.current_tenant_id!;
  const supabase = createAdminClient();

  // Find the domain entry
  const domains = await collectDomains(tenantId);
  const entry = domains.find(d => d.domain === domain);

  if (!entry) {
    return NextResponse.json({ ok: false, error: 'Domain not found in your sites/portfolio' }, { status: 404 });
  }

  const now = new Date().toISOString();

  // Run all scans
  const [dnsResult, sslResult, httpResult, whoisResult] = await Promise.allSettled([
    scanDns(domain),
    scanSsl(domain),
    scanHttp(domain),
    scanWhois(domain),
  ]);

  const dns = dnsResult.status === 'fulfilled' ? dnsResult.value : null;
  const ssl = sslResult.status === 'fulfilled' ? sslResult.value : null;
  const http = httpResult.status === 'fulfilled' ? httpResult.value : null;
  const whois = whoisResult.status === 'fulfilled' ? whoisResult.value : null;

  // CMS detection needs HTTP result
  let cms = null;
  if (http) {
    try {
      cms = await detectCms(domain, http);
    } catch {
      // CMS detection failed
    }
  }

  const upsertData: Record<string, unknown> = {
    tenant_id: tenantId,
    site_id: entry.site_id,
    portfolio_site_id: entry.portfolio_site_id,
    domain,
    updated_at: now,
    last_dns_scan_at: now,
    last_cms_scan_at: now,
    last_whois_scan_at: now,
  };

  if (dns) {
    Object.assign(upsertData, {
      dns_a_records: dns.a_records,
      dns_mx_records: dns.mx_records,
      dns_ns_records: dns.ns_records,
      dns_txt_records: dns.txt_records,
      dns_cname: dns.cname,
      dns_provider: dns.dns_provider,
      email_provider: dns.email_provider,
      spf_configured: dns.spf_configured,
      dmarc_configured: dns.dmarc_configured,
    });
  }

  if (ssl) {
    Object.assign(upsertData, {
      ssl_issuer: ssl.issuer,
      ssl_expires_at: ssl.expires_at,
      ssl_valid: ssl.valid,
      ssl_protocol: ssl.protocol,
    });
  }

  if (http) {
    Object.assign(upsertData, {
      http_status: http.status,
      http_redirect_chain: http.redirect_chain,
      http_final_url: http.final_url,
      http_response_time_ms: http.response_time_ms,
    });
  }

  if (cms) {
    Object.assign(upsertData, {
      cms_detected: cms.cms_type,
      cms_version: cms.version,
      cms_confidence: cms.confidence,
      cms_detection_method: cms.method,
      cms_extras: cms.extras,
    });
  }

  if (whois) {
    Object.assign(upsertData, {
      whois_registrar: whois.registrar,
      whois_expires_at: whois.expires_at,
      whois_nameservers: whois.nameservers,
      whois_updated_at: whois.updated_at,
    });
  }

  const { data, error } = await supabase
    .from('external_scan_results')
    .upsert(upsertData, { onConflict: 'tenant_id,domain' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result: data });
}

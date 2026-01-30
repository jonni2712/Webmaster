import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import https from 'https';
import http from 'http';
import { URL } from 'url';

interface RedirectStep {
  url: string;
  status: number;
}

interface CheckResult {
  domainId: string;
  url: string;
  httpStatusCode: number | null;
  detectedRedirectUrl: string | null;
  redirectChain: RedirectStep[];
  isParkingPage: boolean;
  parkingPageType: string | null;
  httpCheckError: string | null;
  sslValid: boolean | null;
  sslError: string | null;
  dnsResolves: boolean;
}

// Patterns per rilevare pagine parking/default
const PARKING_PATTERNS = [
  // Index of
  { pattern: /<title>Index of/i, type: 'index_of' },
  { pattern: /Index of \//i, type: 'index_of' },
  // Registrar parking
  { pattern: /domain.*parking/i, type: 'registrar_parking' },
  { pattern: /this domain.*for sale/i, type: 'registrar_parking' },
  { pattern: /buy this domain/i, type: 'registrar_parking' },
  { pattern: /domain.*available/i, type: 'registrar_parking' },
  { pattern: /parked.*domain/i, type: 'registrar_parking' },
  { pattern: /godaddy.*parked/i, type: 'registrar_parking' },
  { pattern: /sedo.*parking/i, type: 'registrar_parking' },
  { pattern: /namecheap.*parking/i, type: 'registrar_parking' },
  // Hosting default
  { pattern: /apache.*default/i, type: 'hosting_default' },
  { pattern: /nginx.*welcome/i, type: 'hosting_default' },
  { pattern: /it works!/i, type: 'hosting_default' },
  { pattern: /default web site page/i, type: 'hosting_default' },
  { pattern: /congratulations.*new.*site/i, type: 'hosting_default' },
  { pattern: /plesk.*default/i, type: 'hosting_default' },
  { pattern: /cpanel.*default/i, type: 'hosting_default' },
  { pattern: /directadmin.*default/i, type: 'hosting_default' },
  // Coming soon / Under construction
  { pattern: /coming soon/i, type: 'coming_soon' },
  { pattern: /under construction/i, type: 'under_construction' },
  { pattern: /site.*under.*development/i, type: 'under_construction' },
  { pattern: /website.*coming/i, type: 'coming_soon' },
  { pattern: /launching soon/i, type: 'coming_soon' },
  // Empty/minimal pages
  { pattern: /^[\s]*$/, type: 'empty_page' },
];

async function checkDomain(url: string, domainId: string): Promise<CheckResult> {
  const result: CheckResult = {
    domainId,
    url,
    httpStatusCode: null,
    detectedRedirectUrl: null,
    redirectChain: [],
    isParkingPage: false,
    parkingPageType: null,
    httpCheckError: null,
    sslValid: null,
    sslError: null,
    dnsResolves: false,
  };

  try {
    // Normalize URL
    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Follow redirects manually to track chain
    let currentUrl = targetUrl;
    let redirectCount = 0;
    const maxRedirects = 10;
    let finalResponse: { statusCode: number; body: string } | null = null;

    while (redirectCount < maxRedirects) {
      const response = await fetchWithTimeout(currentUrl, 10000);

      result.dnsResolves = true;

      // Check SSL
      if (currentUrl.startsWith('https://')) {
        result.sslValid = response.sslValid ?? null;
        if (response.sslError) {
          result.sslError = response.sslError;
        }
      }

      // Track redirect
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.location) {
        result.redirectChain.push({
          url: currentUrl,
          status: response.statusCode,
        });

        // Resolve relative URL
        try {
          const parsedLocation = new URL(response.location, currentUrl);
          currentUrl = parsedLocation.href;
        } catch {
          currentUrl = response.location;
        }

        redirectCount++;
        continue;
      }

      // Final destination
      result.httpStatusCode = response.statusCode;
      if (result.redirectChain.length > 0) {
        result.detectedRedirectUrl = currentUrl;
      }
      finalResponse = { statusCode: response.statusCode, body: response.body };
      break;
    }

    if (redirectCount >= maxRedirects) {
      result.httpCheckError = 'Too many redirects';
      return result;
    }

    // Check for parking page
    if (finalResponse && finalResponse.statusCode === 200) {
      for (const { pattern, type } of PARKING_PATTERNS) {
        if (pattern.test(finalResponse.body)) {
          result.isParkingPage = true;
          result.parkingPageType = type;
          break;
        }
      }

      // Check for very short content (likely placeholder)
      if (!result.isParkingPage && finalResponse.body.length < 500) {
        const strippedContent = finalResponse.body.replace(/<[^>]*>/g, '').trim();
        if (strippedContent.length < 100) {
          result.isParkingPage = true;
          result.parkingPageType = 'minimal_content';
        }
      }
    }

  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      result.httpCheckError = 'DNS_ERROR';
      result.dnsResolves = false;
    } else if (error.code === 'ECONNREFUSED') {
      result.httpCheckError = 'CONNECTION_REFUSED';
      result.dnsResolves = true;
    } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      result.httpCheckError = 'TIMEOUT';
      result.dnsResolves = true;
    } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      result.httpCheckError = 'SSL_ERROR';
      result.sslValid = false;
      result.sslError = error.code;
      result.dnsResolves = true;
    } else {
      result.httpCheckError = error.message || 'UNKNOWN_ERROR';
    }
  }

  return result;
}

interface FetchResponse {
  statusCode: number;
  body: string;
  location?: string;
  sslValid?: boolean;
  sslError?: string;
}

function fetchWithTimeout(url: string, timeout: number): Promise<FetchResponse> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebmasterMonitor/1.0; +https://webmaster-monitor.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      rejectUnauthorized: false, // Allow self-signed certs but track validity
    };

    const req = lib.request(options, (res) => {
      let body = '';
      const maxBodySize = 100000; // 100KB max

      res.on('data', (chunk) => {
        if (body.length < maxBodySize) {
          body += chunk.toString();
        }
      });

      res.on('end', () => {
        const result: FetchResponse = {
          statusCode: res.statusCode || 0,
          body: body.substring(0, maxBodySize),
          location: res.headers.location,
        };

        // Check SSL validity for HTTPS
        if (isHttps && (res.socket as any)?.authorized !== undefined) {
          result.sslValid = (res.socket as any).authorized;
          if (!result.sslValid && (res.socket as any).authorizationError) {
            result.sslError = (res.socket as any).authorizationError;
          }
        }

        resolve(result);
      });
    });

    req.on('error', (error: any) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });

    req.end();
  });
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

  try {
    const body = await request.json();
    const { domainIds } = body;

    if (!domainIds || !Array.isArray(domainIds) || domainIds.length === 0) {
      return NextResponse.json({ error: 'domainIds richiesti' }, { status: 400 });
    }

    // Limit batch size
    const limitedIds = domainIds.slice(0, 20);

    // Get domains
    const { data: domains, error: domainsError } = await supabase
      .from('sites')
      .select('id, url')
      .in('id', limitedIds)
      .eq('tenant_id', user.current_tenant_id);

    if (domainsError) {
      return NextResponse.json({ error: domainsError.message }, { status: 500 });
    }

    if (!domains || domains.length === 0) {
      return NextResponse.json({ error: 'Nessun dominio trovato' }, { status: 404 });
    }

    // Check each domain
    const results: CheckResult[] = [];
    for (const domain of domains) {
      const result = await checkDomain(domain.url, domain.id);
      results.push(result);

      // Update database
      await supabase
        .from('sites')
        .update({
          http_status_code: result.httpStatusCode,
          detected_redirect_url: result.detectedRedirectUrl,
          detected_redirect_chain: result.redirectChain,
          is_parking_page: result.isParkingPage,
          parking_page_type: result.parkingPageType,
          last_http_check: new Date().toISOString(),
          http_check_error: result.httpCheckError,
          ssl_valid: result.sslValid,
          ssl_error: result.sslError,
          dns_resolves: result.dnsResolves,
          // Auto-update domain_relation if redirect detected
          ...(result.redirectChain.length > 0 && !result.httpCheckError ? {
            is_redirect_source: true,
            domain_relation: 'redirect',
          } : {}),
        })
        .eq('id', domain.id);
    }

    return NextResponse.json({
      success: true,
      checked: results.length,
      results,
    });

  } catch (error) {
    console.error('POST /api/portfolio/domains/check-status error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

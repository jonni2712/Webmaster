import type { HttpScanResult } from './http-scanner';

export interface CmsDetectionResult {
  cms_type: string | null;
  version: string | null;
  confidence: 'high' | 'medium' | 'low';
  method: string;
  extras: Record<string, boolean>;
}

interface ProbeTarget {
  path: string;
  cms: string;
  successCodes?: number[];
}

const PROBE_TARGETS: ProbeTarget[] = [
  { path: '/wp-login.php', cms: 'wordpress', successCodes: [200, 302] },
  { path: '/wp-includes/js/wp-embed.min.js', cms: 'wordpress' },
  { path: '/administrator/', cms: 'joomla' },
  { path: '/media/jui/js/jquery.min.js', cms: 'joomla' },
  { path: '/admin/login', cms: 'prestashop' },
  { path: '/modules/blockcart/blockcart.js', cms: 'prestashop' },
  { path: '/user/login', cms: 'drupal' },
  { path: '/core/misc/drupal.js', cms: 'drupal' },
  { path: '/_next/static/', cms: 'nextjs' },
  { path: '/static/admin/', cms: 'django' },
  { path: '/index.php/admin/', cms: 'magento' },
];

const HTML_PATTERNS: Array<{ pattern: RegExp; cms: string; extra?: string }> = [
  { pattern: /\/wp-content\//i, cms: 'wordpress' },
  { pattern: /\/wp-includes\//i, cms: 'wordpress' },
  { pattern: /wp-emoji/i, cms: 'wordpress', extra: 'emoji' },
  { pattern: /woocommerce|wc-blocks/i, cms: 'wordpress', extra: 'woocommerce' },
  { pattern: /elementor/i, cms: 'wordpress', extra: 'elementor' },
  { pattern: /yoast/i, cms: 'wordpress', extra: 'yoast_seo' },
  { pattern: /\/sites\/default\/files\//i, cms: 'drupal' },
  { pattern: /\/media\/jui\//i, cms: 'joomla' },
  { pattern: /com_content/i, cms: 'joomla' },
  { pattern: /\/modules\/.*\.js/i, cms: 'prestashop' },
  { pattern: /prestashop/i, cms: 'prestashop' },
  { pattern: /Shopify\.theme/i, cms: 'shopify' },
  { pattern: /cdn\.shopify\.com/i, cms: 'shopify' },
  { pattern: /\/_next\/static\//i, cms: 'nextjs' },
  { pattern: /__NEXT_DATA__/i, cms: 'nextjs' },
  { pattern: /nuxt/i, cms: 'nuxtjs' },
  { pattern: /gatsby/i, cms: 'gatsby' },
  { pattern: /squarespace/i, cms: 'squarespace' },
  { pattern: /wix\.com/i, cms: 'wix' },
  { pattern: /webflow/i, cms: 'webflow' },
];

const VERSION_PATTERNS: Array<{ cms: string; pattern: RegExp; group: number }> = [
  { cms: 'wordpress', pattern: /ver=(\d+\.\d+(?:\.\d+)?)/i, group: 1 },
  { cms: 'wordpress', pattern: /WordPress\s+(\d+\.\d+(?:\.\d+)?)/i, group: 1 },
  { cms: 'joomla', pattern: /Joomla!\s+(\d+\.\d+)/i, group: 1 },
  { cms: 'drupal', pattern: /Drupal\s+(\d+)/i, group: 1 },
  { cms: 'prestashop', pattern: /PrestaShop\s+(\d+\.\d+(?:\.\d+)?)/i, group: 1 },
];

export async function detectCms(
  domain: string,
  httpResult: HttpScanResult
): Promise<CmsDetectionResult> {
  const result: CmsDetectionResult = {
    cms_type: null,
    version: null,
    confidence: 'low',
    method: 'none',
    extras: {},
  };

  // Phase 1: Headers + Meta generator
  const fromHeaders = detectFromHeaders(httpResult);
  if (fromHeaders) {
    result.cms_type = fromHeaders.cms;
    result.version = fromHeaders.version;
    result.confidence = 'high';
    result.method = 'generator_tag';
  }

  // Phase 2: HTML analysis (always run to collect extras)
  if (httpResult.html) {
    const fromHtml = detectFromHtml(httpResult.html);

    if (!result.cms_type && fromHtml.cms) {
      result.cms_type = fromHtml.cms;
      result.confidence = 'medium';
      result.method = 'html_analysis';
    }

    // Collect extras regardless
    Object.assign(result.extras, fromHtml.extras);

    // Try to extract version from HTML
    if (result.cms_type && !result.version && httpResult.html) {
      result.version = extractVersion(result.cms_type, httpResult.html);
    }
  }

  // Phase 3: Path probing (only if still no CMS detected)
  if (!result.cms_type) {
    const fromProbe = await detectFromProbing(domain);
    if (fromProbe) {
      result.cms_type = fromProbe;
      result.confidence = 'medium';
      result.method = 'path_probe';
    }
  }

  return result;
}

function detectFromHeaders(httpResult: HttpScanResult): { cms: string; version: string | null } | null {
  // Check X-Powered-By
  const poweredBy = httpResult.headers['x-powered-by'] || '';
  if (poweredBy.toLowerCase().includes('wordpress')) return { cms: 'wordpress', version: null };
  if (poweredBy.toLowerCase().includes('drupal')) return { cms: 'drupal', version: null };
  if (poweredBy.toLowerCase().includes('joomla')) return { cms: 'joomla', version: null };
  if (poweredBy.toLowerCase().includes('next.js')) return { cms: 'nextjs', version: null };
  if (poweredBy.toLowerCase().includes('express')) return { cms: 'express', version: null };

  // Check X-Generator
  const generator = httpResult.headers['x-generator'] || '';
  if (generator) {
    const match = generator.match(/^(\w+)\s*([\d.]+)?/);
    if (match) return { cms: match[1].toLowerCase(), version: match[2] || null };
  }

  // Check meta generator from HTML
  if (httpResult.html) {
    const metaMatch = httpResult.html.match(/<meta\s+name=["']generator["']\s+content=["']([^"']+)["']/i);
    if (metaMatch) {
      const content = metaMatch[1];

      if (/wordpress/i.test(content)) {
        const ver = content.match(/WordPress\s+([\d.]+)/i);
        return { cms: 'wordpress', version: ver?.[1] || null };
      }
      if (/joomla/i.test(content)) {
        const ver = content.match(/Joomla!\s+([\d.]+)/i);
        return { cms: 'joomla', version: ver?.[1] || null };
      }
      if (/drupal/i.test(content)) {
        const ver = content.match(/Drupal\s+([\d.]+)/i);
        return { cms: 'drupal', version: ver?.[1] || null };
      }
      if (/prestashop/i.test(content)) {
        return { cms: 'prestashop', version: null };
      }

      // Generic: use first word as CMS name
      const parts = content.split(/\s+/);
      return { cms: parts[0].toLowerCase(), version: parts[1] || null };
    }
  }

  return null;
}

function detectFromHtml(html: string): { cms: string | null; extras: Record<string, boolean> } {
  const detected: Record<string, number> = {};
  const extras: Record<string, boolean> = {};

  for (const { pattern, cms, extra } of HTML_PATTERNS) {
    if (pattern.test(html)) {
      detected[cms] = (detected[cms] || 0) + 1;
      if (extra) {
        extras[extra] = true;
      }
    }
  }

  // Pick the CMS with the most pattern matches
  let topCms: string | null = null;
  let topCount = 0;
  for (const [cms, count] of Object.entries(detected)) {
    if (count > topCount) {
      topCms = cms;
      topCount = count;
    }
  }

  return { cms: topCms, extras };
}

function extractVersion(cmsType: string, html: string): string | null {
  for (const { cms, pattern, group } of VERSION_PATTERNS) {
    if (cms === cmsType) {
      const match = html.match(pattern);
      if (match && match[group]) {
        return match[group];
      }
    }
  }
  return null;
}

async function detectFromProbing(domain: string): Promise<string | null> {
  for (const target of PROBE_TARGETS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const url = `https://${domain}${target.path}`;
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'Webmaster-Monitor-Scanner/1.0' },
      });

      clearTimeout(timeoutId);

      const validCodes = target.successCodes || [200];
      if (validCodes.includes(response.status)) {
        return target.cms;
      }
    } catch {
      // Timeout or network error — skip this probe
    }
  }

  return null;
}

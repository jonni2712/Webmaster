export interface PerformanceResult {
  success: boolean;
  performanceScore: number | null;
  lcpMs: number | null;
  fidMs: number | null;
  cls: number | null;
  fcpMs: number | null;
  ttfbMs: number | null;
  ttiMs: number | null;
  tbtMs: number | null;
  speedIndex: number | null;
  totalBytes: number | null;
  errorMessage: string | null;
}

interface PageSpeedAudit {
  numericValue?: number;
  score?: number;
}

interface PageSpeedResponse {
  lighthouseResult?: {
    categories?: {
      performance?: {
        score?: number;
      };
    };
    audits?: {
      'largest-contentful-paint'?: PageSpeedAudit;
      'max-potential-fid'?: PageSpeedAudit;
      'cumulative-layout-shift'?: PageSpeedAudit;
      'first-contentful-paint'?: PageSpeedAudit;
      'server-response-time'?: PageSpeedAudit;
      'interactive'?: PageSpeedAudit;
      'total-blocking-time'?: PageSpeedAudit;
      'speed-index'?: PageSpeedAudit;
      'total-byte-weight'?: PageSpeedAudit;
    };
  };
  error?: {
    message?: string;
  };
}

export async function checkPerformance(url: string): Promise<PerformanceResult> {
  const apiKey = process.env.PAGESPEED_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      performanceScore: null,
      lcpMs: null,
      fidMs: null,
      cls: null,
      fcpMs: null,
      ttfbMs: null,
      ttiMs: null,
      tbtMs: null,
      speedIndex: null,
      totalBytes: null,
      errorMessage: 'PageSpeed API key not configured',
    };
  }

  try {
    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    apiUrl.searchParams.set('url', url);
    apiUrl.searchParams.set('key', apiKey);
    apiUrl.searchParams.set('strategy', 'mobile');
    apiUrl.searchParams.set('category', 'performance');

    const response = await fetch(apiUrl.toString(), {
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        performanceScore: null,
        lcpMs: null,
        fidMs: null,
        cls: null,
        fcpMs: null,
        ttfbMs: null,
        ttiMs: null,
        tbtMs: null,
        speedIndex: null,
        totalBytes: null,
        errorMessage: errorData.error?.message || `API error: ${response.status}`,
      };
    }

    const data: PageSpeedResponse = await response.json();

    const audits = data.lighthouseResult?.audits || {};
    const performanceScore = data.lighthouseResult?.categories?.performance?.score;

    return {
      success: true,
      performanceScore: performanceScore !== undefined ? Math.round(performanceScore * 100) : null,
      lcpMs: audits['largest-contentful-paint']?.numericValue ? Math.round(audits['largest-contentful-paint'].numericValue) : null,
      fidMs: audits['max-potential-fid']?.numericValue ? Math.round(audits['max-potential-fid'].numericValue) : null,
      cls: audits['cumulative-layout-shift']?.numericValue ?? null,
      fcpMs: audits['first-contentful-paint']?.numericValue ? Math.round(audits['first-contentful-paint'].numericValue) : null,
      ttfbMs: audits['server-response-time']?.numericValue ? Math.round(audits['server-response-time'].numericValue) : null,
      ttiMs: audits['interactive']?.numericValue ? Math.round(audits['interactive'].numericValue) : null,
      tbtMs: audits['total-blocking-time']?.numericValue ? Math.round(audits['total-blocking-time'].numericValue) : null,
      speedIndex: audits['speed-index']?.numericValue ? Math.round(audits['speed-index'].numericValue) : null,
      totalBytes: audits['total-byte-weight']?.numericValue ? Math.round(audits['total-byte-weight'].numericValue) : null,
      errorMessage: null,
    };
  } catch (error) {
    return {
      success: false,
      performanceScore: null,
      lcpMs: null,
      fidMs: null,
      cls: null,
      fcpMs: null,
      ttfbMs: null,
      ttiMs: null,
      tbtMs: null,
      speedIndex: null,
      totalBytes: null,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

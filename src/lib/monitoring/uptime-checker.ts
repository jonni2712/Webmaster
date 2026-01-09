export interface UptimeResult {
  isUp: boolean;
  statusCode: number | null;
  responseTimeMs: number | null;
  errorType: string | null;
  errorMessage: string | null;
}

export async function checkUptime(url: string): Promise<UptimeResult> {
  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'WebmasterMonitor/1.0',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Math.round(performance.now() - startTime);

    return {
      isUp: response.ok || response.status < 500,
      statusCode: response.status,
      responseTimeMs,
      errorType: null,
      errorMessage: response.ok ? null : response.statusText,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const responseTimeMs = Math.round(performance.now() - startTime);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          isUp: false,
          statusCode: null,
          responseTimeMs,
          errorType: 'timeout',
          errorMessage: 'Request timeout after 30 seconds',
        };
      }

      let errorType = 'unknown';
      if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        errorType = 'dns_error';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorType = 'connection_refused';
      } else if (error.message.includes('CERT') || error.message.includes('SSL')) {
        errorType = 'ssl_error';
      } else if (error.message.includes('ETIMEDOUT')) {
        errorType = 'timeout';
      }

      return {
        isUp: false,
        statusCode: null,
        responseTimeMs,
        errorType,
        errorMessage: error.message,
      };
    }

    return {
      isUp: false,
      statusCode: null,
      responseTimeMs,
      errorType: 'unknown',
      errorMessage: 'Unknown error occurred',
    };
  }
}

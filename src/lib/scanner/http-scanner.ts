export interface HttpScanResult {
  status: number | null;
  redirect_chain: Array<{ url: string; status: number }>;
  final_url: string | null;
  response_time_ms: number;
  html: string | null;
  headers: Record<string, string>;
}

export async function scanHttp(domain: string): Promise<HttpScanResult> {
  const result: HttpScanResult = {
    status: null,
    redirect_chain: [],
    final_url: null,
    response_time_ms: 0,
    html: null,
    headers: {},
  };

  const startUrl = `https://${domain}`;
  const startTime = Date.now();
  let currentUrl = startUrl;
  const maxRedirects = 10;

  try {
    for (let i = 0; i < maxRedirects; i++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Webmaster-Monitor-Scanner/1.0',
            'Accept': 'text/html,application/xhtml+xml',
          },
        });

        clearTimeout(timeoutId);

        const status = response.status;

        // If redirect, record and follow
        if ([301, 302, 303, 307, 308].includes(status)) {
          const location = response.headers.get('location');
          result.redirect_chain.push({ url: currentUrl, status });

          if (!location) break;

          // Handle relative redirects
          currentUrl = location.startsWith('http')
            ? location
            : new URL(location, currentUrl).toString();

          continue;
        }

        // Final response
        result.status = status;
        result.final_url = currentUrl;
        result.response_time_ms = Date.now() - startTime;

        // Collect headers
        response.headers.forEach((value, key) => {
          result.headers[key.toLowerCase()] = value;
        });

        // Read HTML body (limit to 200KB)
        if (status === 200) {
          try {
            const text = await response.text();
            result.html = text.slice(0, 200_000);
          } catch {
            // Body read failed
          }
        }

        break;
      } catch (fetchError) {
        clearTimeout(timeoutId);

        // If HTTPS fails, try HTTP
        if (i === 0 && currentUrl.startsWith('https://')) {
          currentUrl = `http://${domain}`;
          continue;
        }

        break;
      }
    }
  } catch {
    result.response_time_ms = Date.now() - startTime;
  }

  return result;
}

export interface SSLResult {
  isValid: boolean;
  validFrom: string | null;
  validTo: string | null;
  daysUntilExpiry: number | null;
  issuer: string | null;
  subject: string | null;
  serialNumber: string | null;
  errorMessage: string | null;
}

export async function checkSSL(url: string): Promise<SSLResult> {
  try {
    const urlObj = new URL(url);

    // For Vercel Edge runtime, we use a simple HTTPS check
    // Full TLS certificate inspection requires Node.js runtime
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
    });

    // If we can connect via HTTPS without error, SSL is working
    if (urlObj.protocol === 'https:') {
      // In Edge runtime, we can't inspect the certificate directly
      // We'll return basic info and rely on external APIs for full details
      return {
        isValid: true,
        validFrom: null,
        validTo: null,
        daysUntilExpiry: null, // Would need external API like SSL Labs
        issuer: null,
        subject: urlObj.hostname,
        serialNumber: null,
        errorMessage: null,
      };
    }

    return {
      isValid: false,
      validFrom: null,
      validTo: null,
      daysUntilExpiry: null,
      issuer: null,
      subject: null,
      serialNumber: null,
      errorMessage: 'Site does not use HTTPS',
    };
  } catch (error) {
    return {
      isValid: false,
      validFrom: null,
      validTo: null,
      daysUntilExpiry: null,
      issuer: null,
      subject: null,
      serialNumber: null,
      errorMessage: error instanceof Error ? error.message : 'SSL check failed',
    };
  }
}

// For Node.js runtime (API routes with nodejs runtime)
export async function checkSSLDetailed(url: string): Promise<SSLResult> {
  // This would use tls.connect for detailed certificate info
  // Keeping simple for now, can be enhanced later
  return checkSSL(url);
}

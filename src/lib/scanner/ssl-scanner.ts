import * as tls from 'tls';

export interface SslScanResult {
  issuer: string | null;
  expires_at: string | null;
  valid: boolean;
  protocol: string | null;
}

export async function scanSsl(domain: string): Promise<SslScanResult> {
  return new Promise((resolve) => {
    const result: SslScanResult = {
      issuer: null,
      expires_at: null,
      valid: false,
      protocol: null,
    };

    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(result);
    }, 5000);

    const socket = tls.connect(
      {
        host: domain,
        port: 443,
        servername: domain,
        rejectUnauthorized: false,
      },
      () => {
        clearTimeout(timeout);

        const cert = socket.getPeerCertificate();
        const authorized = socket.authorized;
        const protocol = socket.getProtocol();

        if (cert && cert.subject) {
          result.issuer = cert.issuer?.O || cert.issuer?.CN || null;
          result.expires_at = cert.valid_to
            ? new Date(cert.valid_to).toISOString()
            : null;
          result.valid = authorized;
          result.protocol = protocol || null;
        }

        socket.destroy();
        resolve(result);
      }
    );

    socket.on('error', () => {
      clearTimeout(timeout);
      resolve(result);
    });
  });
}

import * as net from 'net';

export interface WhoisScanResult {
  registrar: string | null;
  expires_at: string | null;
  nameservers: string[];
  updated_at: string | null;
}

const WHOIS_SERVERS: Record<string, string> = {
  com: 'whois.verisign-grs.com',
  net: 'whois.verisign-grs.com',
  org: 'whois.pir.org',
  it: 'whois.nic.it',
  eu: 'whois.eu',
  de: 'whois.denic.de',
  fr: 'whois.nic.fr',
  uk: 'whois.nic.uk',
  io: 'whois.nic.io',
  co: 'whois.nic.co',
  me: 'whois.nic.me',
  info: 'whois.afilias.net',
  biz: 'whois.biz',
};

export async function scanWhois(domain: string): Promise<WhoisScanResult> {
  const result: WhoisScanResult = {
    registrar: null,
    expires_at: null,
    nameservers: [],
    updated_at: null,
  };

  try {
    const tld = domain.split('.').pop()?.toLowerCase() || '';
    const whoisServer = WHOIS_SERVERS[tld];

    if (!whoisServer) {
      return result;
    }

    const raw = await queryWhois(whoisServer, domain);
    if (!raw) return result;

    // For .com/.net, the initial response may point to a registrar-specific server
    if ((tld === 'com' || tld === 'net') && raw.includes('Registrar WHOIS Server:')) {
      const referralMatch = raw.match(/Registrar WHOIS Server:\s*(.+)/i);
      if (referralMatch) {
        const referralServer = referralMatch[1].trim();
        const detailedRaw = await queryWhois(referralServer, domain);
        if (detailedRaw) {
          return parseWhoisResponse(detailedRaw);
        }
      }
    }

    return parseWhoisResponse(raw);
  } catch {
    return result;
  }
}

function parseWhoisResponse(raw: string): WhoisScanResult {
  const result: WhoisScanResult = {
    registrar: null,
    expires_at: null,
    nameservers: [],
    updated_at: null,
  };

  const lines = raw.split('\n');

  for (const line of lines) {
    const lower = line.toLowerCase().trim();

    // Registrar
    if (!result.registrar && (
      lower.startsWith('registrar:') ||
      lower.startsWith('registrant organization:') ||
      lower.startsWith('organisation:')
    )) {
      result.registrar = line.split(':').slice(1).join(':').trim();
    }

    // Expiry date
    if (!result.expires_at && (
      lower.startsWith('registry expiry date:') ||
      lower.startsWith('registrar registration expiration date:') ||
      lower.startsWith('expir') ||
      lower.startsWith('paid-till:') ||
      lower.startsWith('expire date:')
    )) {
      const dateStr = line.split(':').slice(1).join(':').trim();
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        result.expires_at = parsed.toISOString();
      }
    }

    // Nameservers
    if (lower.startsWith('name server:') || lower.startsWith('nserver:') || lower.startsWith('nameservers:')) {
      const ns = line.split(':').slice(1).join(':').trim().split(/\s+/)[0];
      if (ns && !result.nameservers.includes(ns.toLowerCase())) {
        result.nameservers.push(ns.toLowerCase());
      }
    }

    // Updated date
    if (!result.updated_at && (
      lower.startsWith('updated date:') ||
      lower.startsWith('last updated:') ||
      lower.startsWith('last modified:')
    )) {
      const dateStr = line.split(':').slice(1).join(':').trim();
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        result.updated_at = parsed.toISOString();
      }
    }
  }

  return result;
}

function queryWhois(server: string, domain: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';

    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(data || '');
    }, 10000);

    const socket = net.createConnection({ host: server, port: 43 }, () => {
      socket.write(`${domain}\r\n`);
    });

    socket.setEncoding('utf8');

    socket.on('data', (chunk) => {
      data += chunk;
    });

    socket.on('end', () => {
      clearTimeout(timeout);
      resolve(data);
    });

    socket.on('error', (err) => {
      clearTimeout(timeout);
      resolve(data || '');
    });
  });
}

import { promises as dns } from 'dns';

export interface DnsScanResult {
  a_records: string[];
  mx_records: Array<{ priority: number; exchange: string }>;
  ns_records: string[];
  txt_records: string[];
  cname: string | null;
  dns_provider: string | null;
  email_provider: string | null;
  spf_configured: boolean;
  dmarc_configured: boolean;
}

const DNS_PROVIDER_MAP: Record<string, string> = {
  'cloudflare': 'Cloudflare',
  'register.it': 'Register.it',
  'aruba': 'Aruba',
  'ovh': 'OVH',
  'hetzner': 'Hetzner',
  'google': 'Google Cloud DNS',
  'aws': 'AWS Route 53',
  'azure': 'Azure DNS',
  'godaddy': 'GoDaddy',
  'namecheap': 'Namecheap',
  'digitalocean': 'DigitalOcean',
  'dnsimple': 'DNSimple',
  'gandi': 'Gandi',
  'hostinger': 'Hostinger',
  'siteground': 'SiteGround',
  'netsons': 'Netsons',
  'serverplan': 'ServerPlan',
  'keliweb': 'Keliweb',
  'vhosting': 'VHosting',
  'tophost': 'Tophost',
};

const EMAIL_PROVIDER_PATTERNS: Array<{ pattern: string; name: string }> = [
  { pattern: 'google', name: 'Google Workspace' },
  { pattern: 'googlemail', name: 'Google Workspace' },
  { pattern: 'outlook', name: 'Microsoft 365' },
  { pattern: 'protection.outlook', name: 'Microsoft 365' },
  { pattern: 'pphosted', name: 'Proofpoint' },
  { pattern: 'mimecast', name: 'Mimecast' },
  { pattern: 'zoho', name: 'Zoho Mail' },
  { pattern: 'secureserver.net', name: 'GoDaddy Email' },
  { pattern: 'ovh', name: 'OVH Email' },
  { pattern: 'aruba', name: 'Aruba Email' },
  { pattern: 'register.it', name: 'Register.it Email' },
];

export async function scanDns(domain: string): Promise<DnsScanResult> {
  const result: DnsScanResult = {
    a_records: [],
    mx_records: [],
    ns_records: [],
    txt_records: [],
    cname: null,
    dns_provider: null,
    email_provider: null,
    spf_configured: false,
    dmarc_configured: false,
  };

  // Resolve all record types in parallel
  const [aResult, mxResult, nsResult, txtResult, cnameResult, dmarcResult] = await Promise.allSettled([
    dns.resolve4(domain),
    dns.resolveMx(domain),
    dns.resolveNs(domain),
    dns.resolveTxt(domain),
    dns.resolveCname(domain),
    dns.resolveTxt(`_dmarc.${domain}`),
  ]);

  if (aResult.status === 'fulfilled') {
    result.a_records = aResult.value;
  }

  if (mxResult.status === 'fulfilled') {
    result.mx_records = mxResult.value
      .map(mx => ({ priority: mx.priority, exchange: mx.exchange }))
      .sort((a, b) => a.priority - b.priority);
  }

  if (nsResult.status === 'fulfilled') {
    result.ns_records = nsResult.value;
  }

  if (txtResult.status === 'fulfilled') {
    result.txt_records = txtResult.value.map(chunks => chunks.join(''));
  }

  if (cnameResult.status === 'fulfilled') {
    result.cname = cnameResult.value[0] ?? null;
  }

  // DMARC check
  if (dmarcResult.status === 'fulfilled') {
    const dmarcRecords = dmarcResult.value.map(chunks => chunks.join(''));
    result.dmarc_configured = dmarcRecords.some(r => r.startsWith('v=DMARC1'));
  }

  // SPF check
  result.spf_configured = result.txt_records.some(r => r.startsWith('v=spf1'));

  // Derive DNS provider from NS records
  result.dns_provider = deriveDnsProvider(result.ns_records);

  // Derive email provider from MX records
  result.email_provider = deriveEmailProvider(result.mx_records);

  return result;
}

function deriveDnsProvider(nsRecords: string[]): string | null {
  const nsJoined = nsRecords.map(ns => ns.toLowerCase()).join(' ');

  for (const [pattern, name] of Object.entries(DNS_PROVIDER_MAP)) {
    if (nsJoined.includes(pattern)) {
      return name;
    }
  }

  return null;
}

function deriveEmailProvider(mxRecords: Array<{ priority: number; exchange: string }>): string | null {
  if (mxRecords.length === 0) return null;

  const mxJoined = mxRecords.map(mx => mx.exchange.toLowerCase()).join(' ');

  for (const { pattern, name } of EMAIL_PROVIDER_PATTERNS) {
    if (mxJoined.includes(pattern)) {
      return name;
    }
  }

  return 'Custom';
}

export * from './database';

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard stats
export interface DashboardStats {
  totalSites: number;
  sitesUp: number;
  sitesDown: number;
  avgUptime: number;
  validSSL: number;
  expiringSSL: number;
  invalidSSL: number;
  pendingUpdates: number;
  criticalUpdates: number;
  activeAlerts: number;
}

// Site form data
export interface SiteFormData {
  name: string;
  url: string;
  platform: 'wordpress' | 'prestashop' | 'other';
  api_endpoint?: string;
  api_key?: string;
  api_secret?: string;
  check_interval?: number;
  ssl_check_enabled?: boolean;
  uptime_check_enabled?: boolean;
  performance_check_enabled?: boolean;
  updates_check_enabled?: boolean;
  ecommerce_check_enabled?: boolean;
  tags?: string[];
  notes?: string;
}

// CSV Import
export interface CSVSiteRow {
  name: string;
  url: string;
  platform: string;
  api_key?: string;
  tags?: string;
}

export interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

// Monitoring results
export interface UptimeResult {
  isUp: boolean;
  statusCode: number | null;
  responseTimeMs: number | null;
  errorType: string | null;
  errorMessage: string | null;
}

export interface SSLResult {
  isValid: boolean;
  validFrom: Date | null;
  validTo: Date | null;
  daysUntilExpiry: number | null;
  issuer: string | null;
  subject: string | null;
  serialNumber: string | null;
  errorMessage: string | null;
}

export interface PerformanceResult {
  performanceScore: number;
  lcpMs: number;
  fidMs: number;
  cls: number;
  fcpMs: number;
  ttfbMs: number;
  ttiMs: number;
  tbtMs: number;
  speedIndex: number;
  totalBytes: number;
  totalRequests: number;
}

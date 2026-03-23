export type Platform = 'wordpress' | 'prestashop' | 'nextjs' | 'other';
export type UpdateType = 'core' | 'plugin' | 'theme';
export type UpdateStatus = 'available' | 'applied' | 'failed' | 'ignored';
export type AlertChannelType = 'email' | 'webhook' | 'slack' | 'telegram' | 'discord';
export type AlertTriggerType =
  | 'site_down'
  | 'ssl_expiring'
  | 'ssl_invalid'
  | 'performance_degraded'
  | 'update_available'
  | 'update_critical'
  | 'ecommerce_anomaly';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'triggered' | 'acknowledged' | 'resolved';

// ============================================
// Domain Management Types (v1.6.0)
// ============================================

export type DomainLifecycleStatus =
  | 'active'           // Attivo / In Produzione
  | 'to_update'        // Da Aggiornare
  | 'to_rebuild'       // Da Rifare / Redesign
  | 'in_maintenance'   // In Manutenzione / Sospeso
  | 'in_progress'      // In Lavorazione
  | 'to_delete'        // Da Cancellare
  | 'redirect_only'    // Solo Redirect
  | 'archived';        // Archiviato

export type RedirectType = '301' | '302' | '307' | '308' | 'meta' | 'js';

export interface Server {
  id: string;
  tenant_id: string;
  name: string;
  provider: string | null;
  hostname: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // cPanel Agent fields
  panel_type: string | null;
  agent_token: string | null;
  agent_status: string | null;
  agent_version: string | null;
  last_sync_at: string | null;
  last_heartbeat_at: string | null;
  sync_config: Record<string, unknown> | null;
}

// ServerWithStats represents the server_stats view which uses different column names
export interface ServerWithStats {
  server_id: string;
  tenant_id: string;
  server_name: string;
  provider: string | null;
  hostname: string | null;
  is_active: boolean;
  sites_count: number;
  active_sites: number;
  enabled_sites: number;
}

// ============================================
// cPanel Agent Types
// ============================================

export interface ServerAccount {
  id: string;
  server_id: string;
  tenant_id: string;
  username: string;
  main_domain: string;
  addon_domains: string[];
  subdomains: string[];
  parked_domains: string[];
  document_roots: Record<string, string>;
  php_version: string | null;
  disk_used_mb: number | null;
  disk_limit_mb: number | null;
  bandwidth_used_mb: number | null;
  status: 'active' | 'suspended' | 'removed';
  created_at: string;
  updated_at: string;
}

export interface ServerCmsDetection {
  id: string;
  server_account_id: string;
  tenant_id: string;
  domain: string;
  cms_type: string;
  cms_version: string | null;
  document_root: string | null;
  matched_site_id: string | null;
  detected_at: string;
  updated_at: string;
}

export interface DnsRecord {
  type: string;
  name: string;
  value: string;
  priority?: number;
  ttl?: number;
}

export interface ServerDnsZone {
  id: string;
  server_id: string;
  tenant_id: string;
  domain: string;
  records: DnsRecord[];
  points_to_server: boolean;
  resolved_ip: string | null;
  updated_at: string;
}

export interface ServerSslCert {
  id: string;
  server_id: string;
  tenant_id: string;
  domain: string;
  issuer: string | null;
  expires_at: string | null;
  auto_ssl: boolean;
  status: 'valid' | 'expiring' | 'expired' | 'error';
  updated_at: string;
}

export interface PendingSiteImport {
  id: string;
  server_id: string;
  tenant_id: string;
  domain: string;
  cms_type: string | null;
  cms_version: string | null;
  server_account_username: string | null;
  status: 'pending' | 'imported' | 'ignored';
  discovered_at: string;
  actioned_at: string | null;
}

// Phase 2: Monitoring types

export interface ServerResourceSnapshot {
  id: string;
  server_id: string;
  tenant_id: string;
  cpu_cores: number | null;
  cpu_usage_percent: number | null;
  ram_total_mb: number | null;
  ram_used_mb: number | null;
  disk_total_gb: number | null;
  disk_used_gb: number | null;
  load_average: number[] | null;
  recorded_at: string;
}

export interface ServerError {
  id: string;
  server_id: string;
  server_account_id: string | null;
  tenant_id: string;
  domain: string | null;
  error_type: string;
  message: string | null;
  file_path: string | null;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  resolved: boolean;
  resolved_at: string | null;
}

export interface ServerBackup {
  id: string;
  server_id: string;
  server_account_id: string | null;
  tenant_id: string;
  username: string | null;
  backup_type: string | null;
  size_mb: number | null;
  backup_date: string | null;
  status: string;
  created_at: string;
}

// Phase 3: Email and Database types

export interface ServerEmail {
  id: string;
  server_account_id: string;
  tenant_id: string;
  email: string;
  quota_mb: number | null;
  used_mb: number | null;
  has_forwarder: boolean;
  forwarder_target: string | null;
  updated_at: string;
}

export interface ServerDatabase {
  id: string;
  server_account_id: string;
  tenant_id: string;
  name: string;
  engine: string;
  size_mb: number | null;
  db_users: string[];
  updated_at: string;
}

export interface DomainPortfolioSummary {
  tenant_id: string;
  total_domains: number;
  active_domains: number;
  inactive_domains: number;
  status_active: number;
  status_to_update: number;
  status_to_rebuild: number;
  status_in_maintenance: number;
  status_in_progress: number;
  status_to_delete: number;
  status_redirect_only: number;
  status_archived: number;
  redirect_sources: number;
  has_redirect_target: number;
  domains_with_expiry: number;
  expiring_30_days: number;
  expiring_7_days: number;
  expired: number;
  domains_with_server: number;
  domains_without_server: number;
}

export interface RedirectChain {
  source_id: string;
  tenant_id: string;
  source_name: string;
  source_url: string;
  target_id: string;
  target_name: string;
  target_url: string;
  chain_depth: number;
  chain_path: string[];
  is_circular: boolean;
  redirect_type: RedirectType | null;
}

export interface ExpiringDomain {
  site_id: string;
  tenant_id: string;
  name: string;
  url: string;
  domain_expires_at: string;
  domain_registrar: string | null;
  lifecycle_status: DomainLifecycleStatus;
  expiry_status: 'expired' | 'critical' | 'warning' | 'ok';
  days_until_expiry: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: Record<string, unknown>;
  max_sites: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  current_tenant_id: string;
  email_verified: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  referent_name: string | null;
  referent_email: string | null;
  referent_phone: string | null;
  address: string | null;
  vat_number: string | null;
  fiscal_code: string | null;
  logo_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientWithStats extends Client {
  sites_count: number;
  sites_up: number;
  sites_down: number;
}

export interface SiteAlertSettings {
  alerts_enabled: boolean;
  ssl_warning_days: number;      // Days before SSL expiry to warn (default 14)
  ssl_critical_days: number;     // Days before SSL expiry for critical alert (default 7)
  uptime_cooldown_minutes: number;  // Cooldown for uptime alerts (default 60)
  ssl_cooldown_minutes: number;     // Cooldown for SSL alerts (default 1440 = 24h)
  notify_on_recovery: boolean;      // Send notification when site comes back online
}

export const DEFAULT_ALERT_SETTINGS: SiteAlertSettings = {
  alerts_enabled: true,
  ssl_warning_days: 14,
  ssl_critical_days: 7,
  uptime_cooldown_minutes: 60,
  ssl_cooldown_minutes: 1440,
  notify_on_recovery: true,
};

export interface Site {
  id: string;
  tenant_id: string;
  client_id: string | null;
  url: string;
  name: string;
  platform: Platform;
  api_endpoint: string | null;
  api_key_encrypted: string | null;
  api_secret_encrypted: string | null;
  check_interval: number;
  ssl_check_enabled: boolean;
  uptime_check_enabled: boolean;
  performance_check_enabled: boolean;
  updates_check_enabled: boolean;
  ecommerce_check_enabled: boolean;
  is_active: boolean;
  last_check_at: string | null;
  tags: string[];
  notes: string | null;
  alert_settings: SiteAlertSettings | null;
  // Vercel integration (Next.js sites)
  vercel_project_id: string | null;
  vercel_team_id: string | null;
  vercel_token_encrypted: string | null;
  vercel_last_sync: string | null;
  vercel_webhook_secret: string | null;
  // WordPress Multisite support
  parent_site_id: string | null;
  is_multisite: boolean;
  is_main_site: boolean;
  multisite_blog_id: number | null;
  multisite_path: string | null;
  auto_discovered: boolean;
  // Domain Management (v1.6.0)
  server_id: string | null;
  lifecycle_status: DomainLifecycleStatus;
  redirect_to_site_id: string | null;
  redirect_type: RedirectType | null;
  is_redirect_source: boolean;
  domain_expires_at: string | null;
  domain_registrar: string | null;
  domain_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Type for site_status_summary view
export interface SiteWithStatus {
  site_id: string;
  tenant_id: string;
  client_id: string | null;
  client_name: string | null;
  name: string;
  url: string;
  platform: Platform;
  is_active: boolean;
  tags: string[];
  created_at: string;
  current_status: boolean | null;
  last_response_time: number | null;
  last_uptime_check: string | null;
  uptime_30d: number | null;
  ssl_valid: boolean | null;
  ssl_days_remaining: number | null;
  wp_updates_pending: number;
  wp_updates_critical?: number;
  ps_updates_pending: number;
  last_perf_score: number | null;
  last_lcp: number | null;
  // WordPress Multisite support
  parent_site_id: string | null;
  is_multisite: boolean;
  is_main_site: boolean;
  subsites_count?: number;
  // Domain Management (v1.6.0)
  server_id: string | null;
  server_name?: string | null;
  lifecycle_status: DomainLifecycleStatus;
  redirect_to_site_id: string | null;
  is_redirect_source: boolean;
  domain_expires_at: string | null;
}

// Type for multisite subsite from WordPress API
export interface MultisiteSubsite {
  blog_id: number;
  domain: string;
  path: string;
  site_name: string;
  site_url?: string;
  home_url?: string;
  registered: string;
  last_updated: string;
  public: boolean;
  archived: boolean;
  spam: boolean;
  deleted: boolean;
  post_count: number;
  is_main_site: boolean;
}

// Type for multisite network info from WordPress API
export interface MultisiteNetworkInfo {
  is_multisite: boolean;
  is_main_site: boolean;
  network_id: number | null;
  network_name: string | null;
  network_domain: string | null;
  network_path: string | null;
  site_count: number;
  installation_type: 'subdomain' | 'subdirectory' | null;
  subsites: MultisiteSubsite[];
}

export interface UptimeCheck {
  id: string;
  site_id: string;
  is_up: boolean;
  status_code: number | null;
  response_time_ms: number | null;
  error_type: string | null;
  error_message: string | null;
  checked_from: string;
  checked_at: string;
}

export interface SSLCheck {
  id: string;
  site_id: string;
  is_valid: boolean;
  valid_from: string | null;
  valid_to: string | null;
  days_until_expiry: number | null;
  issuer: string | null;
  subject: string | null;
  serial_number: string | null;
  error_message: string | null;
  checked_at: string;
}

export interface PerformanceCheck {
  id: string;
  site_id: string;
  lcp_ms: number | null;
  fid_ms: number | null;
  cls: number | null;
  fcp_ms: number | null;
  ttfb_ms: number | null;
  tti_ms: number | null;
  tbt_ms: number | null;
  speed_index: number | null;
  performance_score: number | null;
  total_bytes: number | null;
  total_requests: number | null;
  checked_at: string;
}

export interface WPUpdate {
  id: string;
  site_id: string;
  update_type: UpdateType;
  slug: string;
  name: string;
  current_version: string | null;
  new_version: string | null;
  is_critical: boolean;
  is_auto_update: boolean;
  status: UpdateStatus;
  applied_at: string | null;
  changelog_url: string | null;
  checked_at: string;
  created_at: string;
}

export interface PSUpdate {
  id: string;
  site_id: string;
  update_type: 'core' | 'module' | 'theme';
  technical_name: string;
  display_name: string;
  current_version: string | null;
  new_version: string | null;
  is_critical: boolean;
  status: UpdateStatus;
  applied_at: string | null;
  checked_at: string;
  created_at: string;
}

// ============================================
// Vercel Integration Types
// ============================================

export type VercelDeploymentState =
  | 'BUILDING'
  | 'ERROR'
  | 'INITIALIZING'
  | 'QUEUED'
  | 'READY'
  | 'CANCELED';

export type VercelDeploymentTarget = 'production' | 'preview';

export interface VercelDeployment {
  id: string;
  site_id: string;
  tenant_id: string;
  deployment_id: string;
  deployment_url: string | null;
  state: VercelDeploymentState;
  target: VercelDeploymentTarget | null;
  git_branch: string | null;
  git_commit_sha: string | null;
  git_commit_message: string | null;
  git_commit_author: string | null;
  created_at: string;
  ready_at: string | null;
  build_duration_ms: number | null;
  error_message: string | null;
  meta: Record<string, unknown>;
  synced_at: string;
}

export interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  latestDeployments: VercelDeployment[];
}

export interface EcommerceTransaction {
  id: string;
  site_id: string;
  period_start: string;
  period_end: string;
  order_count: number;
  order_count_pending: number;
  order_count_completed: number;
  order_count_cancelled: number;
  total_revenue: number;
  average_order_value: number;
  currency: string;
  products_sold: number;
  unique_customers: number;
  checked_at: string;
}

export interface AlertChannel {
  id: string;
  tenant_id: string;
  name: string;
  type: AlertChannelType;
  config: Record<string, unknown>;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertRule {
  id: string;
  tenant_id: string;
  site_id: string | null;
  trigger_type: AlertTriggerType;
  conditions: Record<string, unknown>;
  channel_ids: string[];
  cooldown_minutes: number;
  last_triggered_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Alert {
  id: string;
  tenant_id: string;
  site_id: string | null;
  rule_id: string | null;
  trigger_type: AlertTriggerType;
  severity: AlertSeverity;
  title: string;
  message: string;
  details: Record<string, unknown>;
  status: AlertStatus;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  channels_notified: AlertChannelType[];
  created_at: string;
}

export interface AlertWithSite extends Alert {
  site_name: string | null;
  site_url: string | null;
}

export type DigestFrequency = 'daily' | 'weekly' | 'none';

export interface DigestPreferences {
  enabled: boolean;
  frequency: DigestFrequency;
  day_of_week: number;  // 0-6 (Sunday-Saturday), only used for weekly
  hour: number;         // 0-23, hour to send digest
  email: string | null; // Override email, null = use account email
}

export const DEFAULT_DIGEST_PREFERENCES: DigestPreferences = {
  enabled: false,
  frequency: 'daily',
  day_of_week: 1, // Monday
  hour: 8,        // 8 AM
  email: null,
};

// ============================================
// Team Management Types (v1.4.0)
// ============================================

export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export type ActivityActionType =
  | 'member_invited'
  | 'member_joined'
  | 'member_removed'
  | 'role_changed'
  | 'site_created'
  | 'site_updated'
  | 'site_deleted'
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'site_access_granted'
  | 'site_access_revoked'
  | 'settings_updated';

export interface TeamMember {
  id: string;              // user_tenants.id
  user_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: MemberRole;
  site_access: 'all' | 'restricted';
  assigned_sites_count: number;
  created_at: string;      // When they joined the tenant
}

export interface TeamInvitation {
  id: string;
  tenant_id: string;
  email: string;
  role: MemberRole;
  invited_by: string;
  inviter_name: string | null;
  inviter_email: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface MemberSiteAccess {
  id: string;
  user_tenant_id: string;
  site_id: string;
  site_name?: string;
  site_url?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  tenant_id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  action_type: ActivityActionType;
  resource_type: string | null;
  resource_id: string | null;
  resource_name: string | null;
  target_user_id: string | null;
  target_user_email: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface ActivityLogCreateParams {
  tenantId: string;
  userId: string;
  actionType: ActivityActionType;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  targetUserId?: string;
  targetUserEmail?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

// ============================================
// Security & Backup Types (v1.5.0)
// ============================================

export type BackupType = 'full' | 'database' | 'files';
export type BackupStatus = 'pending' | 'creating' | 'completed' | 'failed' | 'deleted';
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface SecurityScanData {
  ssl: {
    valid: boolean;
    https_forced: boolean;
    hsts_enabled: boolean;
  };
  versions: {
    wp_updated: boolean;
    plugins_updated: boolean;
    themes_updated: boolean;
    outdated_count: number;
  };
  config: {
    debug_disabled: boolean;
    file_editor_disabled: boolean;
    directory_listing_disabled: boolean;
    default_prefix: boolean;
  };
  security_plugin: {
    installed: boolean;
    name: string | null;
    active: boolean;
  };
  file_integrity: {
    core_files_modified: number;
    suspicious_files: string[];
  };
}

export interface SecurityRecommendation {
  id: string;
  priority: RecommendationPriority;
  title: string;
  description: string;
  category: 'ssl' | 'versions' | 'config' | 'security_plugin' | 'files';
}

export interface SecurityScan {
  id: string;
  site_id: string;
  tenant_id: string;
  security_score: number;
  ssl_score: number;
  ssl_valid: boolean | null;
  https_forced: boolean | null;
  hsts_enabled: boolean | null;
  versions_score: number;
  wp_updated: boolean | null;
  plugins_updated: boolean | null;
  themes_updated: boolean | null;
  outdated_count: number;
  config_score: number;
  debug_disabled: boolean | null;
  file_editor_disabled: boolean | null;
  directory_listing_disabled: boolean | null;
  default_prefix: boolean | null;
  security_plugin_score: number;
  security_plugin_name: string | null;
  security_plugin_active: boolean | null;
  core_files_modified: number;
  suspicious_files: string[];
  recommendations: SecurityRecommendation[];
  scanned_at: string;
}

export interface SiteBackup {
  id: string;
  site_id: string;
  tenant_id: string;
  filename: string;
  file_size: number | null;
  backup_type: BackupType;
  status: BackupStatus;
  error_message: string | null;
  includes_database: boolean;
  includes_files: boolean;
  includes_uploads: boolean;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
}

export interface SecuritySummary {
  security_score: number;
  ssl_score: number;
  versions_score: number;
  config_score: number;
  security_plugin_score: number;
  last_scan: string | null;
  recommendations_count: number;
  critical_issues: number;
}

// External Scanner types

export interface ExternalScanResult {
  id: string;
  tenant_id: string;
  site_id: string | null;
  domain: string;
  dns_a_records: string[];
  dns_mx_records: Array<{ priority: number; exchange: string }>;
  dns_ns_records: string[];
  dns_txt_records: string[];
  dns_cname: string | null;
  dns_provider: string | null;
  email_provider: string | null;
  spf_configured: boolean;
  dmarc_configured: boolean;
  ssl_issuer: string | null;
  ssl_expires_at: string | null;
  ssl_valid: boolean | null;
  ssl_protocol: string | null;
  http_status: number | null;
  http_redirect_chain: Array<{ url: string; status: number }>;
  http_final_url: string | null;
  http_response_time_ms: number | null;
  cms_detected: string | null;
  cms_version: string | null;
  cms_confidence: 'high' | 'medium' | 'low' | null;
  cms_detection_method: string | null;
  cms_extras: Record<string, unknown>;
  whois_registrar: string | null;
  whois_expires_at: string | null;
  whois_nameservers: string[];
  whois_updated_at: string | null;
  last_dns_scan_at: string | null;
  last_cms_scan_at: string | null;
  last_whois_scan_at: string | null;
  created_at: string;
  updated_at: string;
}

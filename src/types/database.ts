export type Platform = 'wordpress' | 'prestashop' | 'other';
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

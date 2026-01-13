import { createAdminClient } from './admin';

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface TenantContext {
  userId: string;
  tenantId: string;
  role: UserRole;
}

/**
 * Get the current user's tenant context
 * Returns null if user or tenant not found
 */
export async function getTenantContext(
  userId: string
): Promise<TenantContext | null> {
  const supabase = createAdminClient();

  // Get user's current tenant
  const { data: user } = await supabase
    .from('users')
    .select('current_tenant_id')
    .eq('id', userId)
    .single();

  if (!user?.current_tenant_id) {
    return null;
  }

  // Get user's role in tenant
  const { data: membership } = await supabase
    .from('user_tenants')
    .select('role')
    .eq('user_id', userId)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (!membership) {
    return null;
  }

  return {
    userId,
    tenantId: user.current_tenant_id,
    role: membership.role as UserRole,
  };
}

/**
 * Check if user has admin or owner role
 */
export function isAdmin(context: TenantContext): boolean {
  return ['owner', 'admin'].includes(context.role);
}

/**
 * Check if user is owner
 */
export function isOwner(context: TenantContext): boolean {
  return context.role === 'owner';
}

/**
 * Check if user can view resources (any role can view)
 */
export function canView(context: TenantContext): boolean {
  return ['owner', 'admin', 'member', 'viewer'].includes(context.role);
}

/**
 * Check if user can edit resources (admin or owner)
 */
export function canEdit(context: TenantContext): boolean {
  return isAdmin(context);
}

/**
 * Check if user can delete resources (only owner)
 */
export function canDelete(context: TenantContext): boolean {
  return isOwner(context);
}

/**
 * Get all tenants for a user
 */
export async function getUserTenants(userId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('user_tenants')
    .select(
      `
      role,
      tenant:tenants(
        id,
        name,
        slug,
        plan
      )
    `
    )
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user tenants:', error);
    return [];
  }

  return data;
}

/**
 * Switch user's current tenant
 */
export async function switchTenant(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const supabase = createAdminClient();

  // Verify user belongs to this tenant
  const { data: membership } = await supabase
    .from('user_tenants')
    .select('id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .single();

  if (!membership) {
    return false;
  }

  // Update user's current tenant
  const { error } = await supabase
    .from('users')
    .update({ current_tenant_id: tenantId })
    .eq('id', userId);

  return !error;
}

/**
 * Get the site IDs a member can access
 * Returns 'all' for owner/admin, or array of site IDs for member/viewer
 */
export async function getMemberSiteIds(
  userId: string,
  tenantId: string
): Promise<string[] | 'all'> {
  const supabase = createAdminClient();

  // Get user's membership in tenant
  const { data: membership } = await supabase
    .from('user_tenants')
    .select('id, role')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .single();

  if (!membership) {
    return [];
  }

  // Owner and Admin have access to all sites
  if (membership.role === 'owner' || membership.role === 'admin') {
    return 'all';
  }

  // Member and Viewer only have access to explicitly assigned sites
  const { data: access } = await supabase
    .from('member_site_access')
    .select('site_id')
    .eq('user_tenant_id', membership.id);

  return access?.map(a => a.site_id) || [];
}

/**
 * Check if a user can access a specific site
 */
export async function userCanAccessSite(
  userId: string,
  tenantId: string,
  siteId: string
): Promise<boolean> {
  const siteIds = await getMemberSiteIds(userId, tenantId);

  if (siteIds === 'all') {
    return true;
  }

  return siteIds.includes(siteId);
}

/**
 * Get filtered sites query for a user
 * Returns site IDs to filter by, or null if user has access to all sites
 */
export async function getSiteAccessFilter(
  userId: string,
  tenantId: string
): Promise<string[] | null> {
  const siteIds = await getMemberSiteIds(userId, tenantId);

  if (siteIds === 'all') {
    return null; // No filter needed
  }

  return siteIds;
}

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

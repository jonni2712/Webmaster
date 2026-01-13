import { createAdminClient } from '@/lib/supabase/admin';
import type { ActivityActionType, ActivityLogCreateParams } from '@/types/database';

/**
 * Log an activity to the activity_logs table
 */
export async function logActivity(params: ActivityLogCreateParams): Promise<void> {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        tenant_id: params.tenantId,
        user_id: params.userId,
        action_type: params.actionType,
        resource_type: params.resourceType || null,
        resource_id: params.resourceId || null,
        resource_name: params.resourceName || null,
        target_user_id: params.targetUserId || null,
        target_user_email: params.targetUserEmail || null,
        metadata: params.metadata || {},
        ip_address: params.ipAddress || null,
      });

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (err) {
    // Don't throw - activity logging should not break the main flow
    console.error('Activity logging error:', err);
  }
}

/**
 * Get human-readable description for an activity action
 */
export function getActivityDescription(
  actionType: ActivityActionType,
  resourceName?: string | null,
  targetUserEmail?: string | null
): string {
  const resource = resourceName || 'risorsa';
  const target = targetUserEmail || 'utente';

  const descriptions: Record<ActivityActionType, string> = {
    member_invited: `Ha invitato ${target} al team`,
    member_joined: `${target} si e' unito al team`,
    member_removed: `Ha rimosso ${target} dal team`,
    role_changed: `Ha cambiato il ruolo di ${target}`,
    site_created: `Ha creato il sito "${resource}"`,
    site_updated: `Ha aggiornato il sito "${resource}"`,
    site_deleted: `Ha eliminato il sito "${resource}"`,
    client_created: `Ha creato il cliente "${resource}"`,
    client_updated: `Ha aggiornato il cliente "${resource}"`,
    client_deleted: `Ha eliminato il cliente "${resource}"`,
    site_access_granted: `Ha concesso accesso al sito "${resource}" a ${target}`,
    site_access_revoked: `Ha revocato accesso al sito "${resource}" a ${target}`,
    settings_updated: `Ha aggiornato le impostazioni`,
  };

  return descriptions[actionType] || actionType;
}

/**
 * Get icon name for an activity action
 */
export function getActivityIcon(actionType: ActivityActionType): string {
  const icons: Record<ActivityActionType, string> = {
    member_invited: 'UserPlus',
    member_joined: 'UserCheck',
    member_removed: 'UserMinus',
    role_changed: 'Shield',
    site_created: 'Globe',
    site_updated: 'Edit',
    site_deleted: 'Trash2',
    client_created: 'Building2',
    client_updated: 'Edit',
    client_deleted: 'Trash2',
    site_access_granted: 'Eye',
    site_access_revoked: 'EyeOff',
    settings_updated: 'Settings',
  };

  return icons[actionType] || 'Activity';
}

/**
 * Get color class for an activity action
 */
export function getActivityColor(actionType: ActivityActionType): string {
  const colors: Record<ActivityActionType, string> = {
    member_invited: 'text-blue-500',
    member_joined: 'text-green-500',
    member_removed: 'text-red-500',
    role_changed: 'text-purple-500',
    site_created: 'text-green-500',
    site_updated: 'text-blue-500',
    site_deleted: 'text-red-500',
    client_created: 'text-green-500',
    client_updated: 'text-blue-500',
    client_deleted: 'text-red-500',
    site_access_granted: 'text-green-500',
    site_access_revoked: 'text-orange-500',
    settings_updated: 'text-gray-500',
  };

  return colors[actionType] || 'text-gray-500';
}

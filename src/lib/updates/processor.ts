import { createAdminClient } from '@/lib/supabase/admin';
import { dispatchNotification } from '@/lib/notifications/dispatcher';
import type { UpdateType, UpdateStatus } from '@/types/database';

interface PluginInfo {
  name: string;
  slug: string;
  version: string;
  active: boolean;
  update_available: boolean;
  new_version?: string;
}

interface ThemeInfo {
  name: string;
  slug: string;
  version: string;
  active: boolean;
  update_available: boolean;
  new_version?: string;
}

interface CoreInfo {
  version: string;
  update_available: boolean;
  latest_version?: string;
}

export interface WordPressUpdateData {
  core?: CoreInfo;
  plugins?: {
    list: PluginInfo[];
    updates_available: number;
  };
  themes?: {
    list: ThemeInfo[];
    updates_available: number;
  };
}

interface ProcessUpdatesParams {
  siteId: string;
  tenantId: string;
  wpData: WordPressUpdateData;
}

interface UpdateRecord {
  site_id: string;
  update_type: UpdateType;
  slug: string;
  name: string;
  current_version: string | null;
  new_version: string | null;
  is_critical: boolean;
  status: UpdateStatus;
}

/**
 * Detect if an update is critical (security-related)
 */
function isCriticalUpdate(
  type: UpdateType,
  slug: string,
  _name: string,
  currentVersion: string,
  newVersion: string
): boolean {
  // Heuristic 1: Minor patch version only (1.2.3 -> 1.2.4) = likely security
  const currentParts = currentVersion.split('.').map(Number);
  const newParts = newVersion.split('.').map(Number);

  // If only the patch version changed (third number), it's likely a security fix
  if (
    currentParts.length >= 3 &&
    newParts.length >= 3 &&
    currentParts[0] === newParts[0] &&
    currentParts[1] === newParts[1] &&
    newParts[2] > currentParts[2] &&
    newParts[2] - currentParts[2] === 1
  ) {
    return true;
  }

  // Heuristic 2: WordPress core updates are always important
  if (type === 'core') {
    return true;
  }

  // Heuristic 3: Known security plugins should be updated immediately
  const securityPlugins = [
    'wordfence',
    'sucuri',
    'ithemes-security',
    'better-wp-security',
    'all-in-one-wp-security',
    'security',
    'jetpack',
  ];

  if (securityPlugins.some(p => slug.toLowerCase().includes(p))) {
    return true;
  }

  return false;
}

/**
 * Process WordPress update data from sync and store in wp_updates table
 */
export async function processWordPressUpdates({
  siteId,
  tenantId,
  wpData,
}: ProcessUpdatesParams): Promise<{ processed: number; critical: number }> {
  const supabase = createAdminClient();
  const updates: UpdateRecord[] = [];
  let criticalCount = 0;

  // Process core updates
  if (wpData.core?.update_available && wpData.core.latest_version) {
    const isCritical = isCriticalUpdate(
      'core',
      'wordpress',
      'WordPress',
      wpData.core.version,
      wpData.core.latest_version
    );
    if (isCritical) criticalCount++;

    updates.push({
      site_id: siteId,
      update_type: 'core',
      slug: 'wordpress',
      name: 'WordPress',
      current_version: wpData.core.version,
      new_version: wpData.core.latest_version,
      is_critical: isCritical,
      status: 'available',
    });
  }

  // Process plugin updates
  if (wpData.plugins?.list) {
    for (const plugin of wpData.plugins.list) {
      if (plugin.update_available && plugin.new_version) {
        const isCritical = isCriticalUpdate(
          'plugin',
          plugin.slug,
          plugin.name,
          plugin.version,
          plugin.new_version
        );
        if (isCritical) criticalCount++;

        updates.push({
          site_id: siteId,
          update_type: 'plugin',
          slug: plugin.slug,
          name: plugin.name,
          current_version: plugin.version,
          new_version: plugin.new_version,
          is_critical: isCritical,
          status: 'available',
        });
      }
    }
  }

  // Process theme updates
  if (wpData.themes?.list) {
    for (const theme of wpData.themes.list) {
      if (theme.update_available && theme.new_version) {
        const isCritical = isCriticalUpdate(
          'theme',
          theme.slug,
          theme.name,
          theme.version,
          theme.new_version
        );
        if (isCritical) criticalCount++;

        updates.push({
          site_id: siteId,
          update_type: 'theme',
          slug: theme.slug,
          name: theme.name,
          current_version: theme.version,
          new_version: theme.new_version,
          is_critical: isCritical,
          status: 'available',
        });
      }
    }
  }

  // Get current pending updates for this site
  const { data: existingUpdates } = await supabase
    .from('wp_updates')
    .select('id, slug, update_type, new_version')
    .eq('site_id', siteId)
    .eq('status', 'available');

  const existingMap = new Map(
    (existingUpdates || []).map(u => [`${u.update_type}:${u.slug}:${u.new_version}`, u.id])
  );

  // Mark updates that are no longer available as applied (they were applied externally)
  const currentUpdateKeys = new Set(
    updates.map(u => `${u.update_type}:${u.slug}:${u.new_version}`)
  );

  const updatesToMarkApplied = (existingUpdates || []).filter(
    u => !currentUpdateKeys.has(`${u.update_type}:${u.slug}:${u.new_version}`)
  );

  if (updatesToMarkApplied.length > 0) {
    await supabase
      .from('wp_updates')
      .update({
        status: 'applied' as UpdateStatus,
        applied_at: new Date().toISOString(),
      })
      .in('id', updatesToMarkApplied.map(u => u.id));
  }

  // Upsert new updates
  const newCriticalUpdates: UpdateRecord[] = [];

  for (const update of updates) {
    const key = `${update.update_type}:${update.slug}:${update.new_version}`;

    if (existingMap.has(key)) {
      // Update existing record (refresh checked_at)
      await supabase
        .from('wp_updates')
        .update({
          current_version: update.current_version,
          is_critical: update.is_critical,
          checked_at: new Date().toISOString(),
        })
        .eq('id', existingMap.get(key));
    } else {
      // Insert new record
      await supabase
        .from('wp_updates')
        .insert({
          ...update,
          checked_at: new Date().toISOString(),
        });

      // Track new critical updates for alerting
      if (update.is_critical) {
        newCriticalUpdates.push(update);
      }
    }
  }

  // Generate alert if there are NEW critical updates (not already tracked)
  if (newCriticalUpdates.length > 0) {
    await generateUpdateAlert(siteId, tenantId, updates, newCriticalUpdates.length, updates.length);
  }

  return { processed: updates.length, critical: criticalCount };
}

/**
 * Generate an alert for critical updates
 */
async function generateUpdateAlert(
  siteId: string,
  tenantId: string,
  updates: UpdateRecord[],
  criticalCount: number,
  totalCount: number
): Promise<void> {
  const supabase = createAdminClient();

  try {
    // Get site info
    const { data: site } = await supabase
      .from('sites')
      .select('name, url')
      .eq('id', siteId)
      .single();

    if (!site) return;

    // Check if we already sent an alert recently (cooldown of 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentAlert } = await supabase
      .from('alerts')
      .select('id')
      .eq('site_id', siteId)
      .eq('trigger_type', 'update_critical')
      .gte('created_at', oneDayAgo)
      .limit(1);

    if (recentAlert && recentAlert.length > 0) {
      console.log(`Skipping update alert for site ${siteId} - already sent within 24h`);
      return;
    }

    // Create alert record
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .insert({
        tenant_id: tenantId,
        site_id: siteId,
        trigger_type: 'update_critical',
        severity: criticalCount > 0 ? 'warning' : 'info',
        title: criticalCount > 0
          ? `${criticalCount} aggiornamenti critici disponibili`
          : `${totalCount} aggiornamenti disponibili`,
        message: criticalCount > 0
          ? `Il sito ${site.name} ha ${criticalCount} aggiornamenti critici che richiedono attenzione immediata.`
          : `Il sito ${site.name} ha ${totalCount} aggiornamenti disponibili.`,
        details: {
          criticalCount,
          totalCount,
          updates: updates.map(u => ({
            name: u.name,
            type: u.update_type,
            currentVersion: u.current_version,
            newVersion: u.new_version,
            isCritical: u.is_critical,
          })),
        },
        status: 'triggered',
        channels_notified: [],
      })
      .select()
      .single();

    if (alertError || !alert) {
      console.error('Error creating update alert:', alertError);
      return;
    }

    // Dispatch notification
    await dispatchNotification({
      tenantId,
      alertId: alert.id,
      type: criticalCount > 0 ? 'updates_critical' : 'updates_available',
      severity: criticalCount > 0 ? 'warning' : 'info',
      site: {
        id: siteId,
        name: site.name,
        url: site.url,
      },
      title: alert.title,
      message: alert.message,
      details: {
        criticalCount,
        totalCount,
        updates: updates.map(u => ({
          name: u.name,
          type: u.update_type,
          currentVersion: u.current_version,
          newVersion: u.new_version,
          isCritical: u.is_critical,
        })),
        dashboardUrl: `${process.env.NEXTAUTH_URL || ''}/sites/${siteId}`,
      },
    });

    console.log(`Update alert dispatched for site ${siteId}: ${criticalCount} critical, ${totalCount} total`);
  } catch (err) {
    console.error('Error generating update alert:', err);
  }
}

/**
 * Get update counts for a site
 */
export async function getUpdateCounts(siteId: string): Promise<{
  total: number;
  critical: number;
  byType: Record<UpdateType, number>;
}> {
  const supabase = createAdminClient();

  const { data: updates } = await supabase
    .from('wp_updates')
    .select('update_type, is_critical')
    .eq('site_id', siteId)
    .eq('status', 'available');

  const result = {
    total: updates?.length || 0,
    critical: updates?.filter(u => u.is_critical).length || 0,
    byType: {
      core: 0,
      plugin: 0,
      theme: 0,
    } as Record<UpdateType, number>,
  };

  for (const update of updates || []) {
    result.byType[update.update_type as UpdateType]++;
  }

  return result;
}

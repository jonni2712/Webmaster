import { createAdminClient } from '@/lib/supabase/admin';
import type { MultisiteNetworkInfo, MultisiteSubsite } from '@/types';

interface ProcessMultisiteParams {
  parentSiteId: string;
  tenantId: string;
  clientId: string | null;
  apiKeyEncrypted: string;
  multisiteData: MultisiteNetworkInfo;
}

interface ProcessMultisiteResult {
  created: number;
  updated: number;
  removed: number;
  errors: string[];
}

/**
 * Process multisite subsites from a WordPress Multisite network.
 * Creates, updates, or removes subsite records based on the sync data.
 */
export async function processMultisiteSubsites({
  parentSiteId,
  tenantId,
  clientId,
  apiKeyEncrypted,
  multisiteData,
}: ProcessMultisiteParams): Promise<ProcessMultisiteResult> {
  const result: ProcessMultisiteResult = {
    created: 0,
    updated: 0,
    removed: 0,
    errors: [],
  };

  // Only process if this is a multisite main site
  if (!multisiteData.is_multisite || !multisiteData.is_main_site) {
    return result;
  }

  const supabase = createAdminClient();
  const subsites = multisiteData.subsites || [];

  // Get existing subsites for this parent
  const { data: existingSubsites, error: fetchError } = await supabase
    .from('sites')
    .select('id, multisite_blog_id, name, url')
    .eq('parent_site_id', parentSiteId);

  if (fetchError) {
    result.errors.push(`Error fetching existing subsites: ${fetchError.message}`);
    return result;
  }

  const existingByBlogId = new Map(
    (existingSubsites || []).map(s => [s.multisite_blog_id, s])
  );

  // Process each subsite from the network
  for (const subsite of subsites) {
    // Skip the main site itself (it's the parent)
    if (subsite.is_main_site) {
      continue;
    }

    const existingSubsite = existingByBlogId.get(subsite.blog_id);
    const subsiteUrl = subsite.site_url || `https://${subsite.domain}${subsite.path}`;

    if (existingSubsite) {
      // Update existing subsite
      const { error: updateError } = await supabase
        .from('sites')
        .update({
          name: subsite.site_name || `Subsite ${subsite.blog_id}`,
          url: subsiteUrl,
          multisite_path: subsite.path,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubsite.id);

      if (updateError) {
        result.errors.push(`Error updating subsite ${subsite.blog_id}: ${updateError.message}`);
      } else {
        result.updated++;
      }

      // Remove from map to track which ones need to be removed
      existingByBlogId.delete(subsite.blog_id);
    } else {
      // Create new subsite record
      const { error: createError } = await supabase
        .from('sites')
        .insert({
          tenant_id: tenantId,
          client_id: clientId,
          parent_site_id: parentSiteId,
          name: subsite.site_name || `Subsite ${subsite.blog_id}`,
          url: subsiteUrl,
          platform: 'wordpress',
          api_key_encrypted: apiKeyEncrypted, // Inherit from parent
          is_multisite: false,
          is_main_site: false,
          multisite_blog_id: subsite.blog_id,
          multisite_path: subsite.path,
          auto_discovered: true,
          is_active: true,
          ssl_check_enabled: true,
          uptime_check_enabled: true,
          performance_check_enabled: false,
          updates_check_enabled: true,
          ecommerce_check_enabled: false,
          check_interval: 5,
          tags: ['multisite-subsite'],
        });

      if (createError) {
        result.errors.push(`Error creating subsite ${subsite.blog_id}: ${createError.message}`);
      } else {
        result.created++;
      }
    }
  }

  // Remove subsites that no longer exist in the network
  for (const [blogId, subsite] of existingByBlogId) {
    const { error: deleteError } = await supabase
      .from('sites')
      .delete()
      .eq('id', subsite.id);

    if (deleteError) {
      result.errors.push(`Error removing subsite ${blogId}: ${deleteError.message}`);
    } else {
      result.removed++;
    }
  }

  return result;
}

/**
 * Get subsites count for a multisite network
 */
export async function getSubsitesCount(parentSiteId: string): Promise<number> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true })
    .eq('parent_site_id', parentSiteId);

  if (error) {
    console.error('Error counting subsites:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get all subsites for a multisite network
 */
export async function getSubsites(parentSiteId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('parent_site_id', parentSiteId)
    .order('name');

  if (error) {
    console.error('Error fetching subsites:', error);
    return [];
  }

  return data || [];
}

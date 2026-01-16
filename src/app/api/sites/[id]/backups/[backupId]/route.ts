import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getBackupDownloadUrl,
  getBackupStatus,
  deleteBackupFromPlugin,
} from '@/lib/backup/manager';

/**
 * GET /api/sites/[id]/backups/[backupId]
 * Get backup details or download URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; backupId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, backupId } = await params;

  // Check if download is requested
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const supabase = createAdminClient();

    // Get user's current tenant
    const { data: user } = await supabase
      .from('users')
      .select('current_tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.current_tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get site with API key
    const { data: site } = await supabase
      .from('sites')
      .select('id, url, api_key_encrypted')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get backup record
    const { data: backup } = await supabase
      .from('site_backups')
      .select('*')
      .eq('id', backupId)
      .eq('site_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    // Handle download action
    if (action === 'download') {
      if (!site.api_key_encrypted) {
        return NextResponse.json(
          { error: 'API key non configurata' },
          { status: 400 }
        );
      }

      if (backup.status !== 'completed') {
        return NextResponse.json(
          { error: 'Il backup non e ancora completato' },
          { status: 400 }
        );
      }

      const downloadResult = await getBackupDownloadUrl(
        site.url,
        site.api_key_encrypted,
        backupId
      );

      if (!downloadResult.success) {
        return NextResponse.json(
          { error: downloadResult.error || 'Errore nel recupero URL download' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        download_url: downloadResult.download_url,
        filename: downloadResult.filename || backup.filename,
        file_size: downloadResult.file_size || backup.file_size,
      });
    }

    // Handle status check action
    if (action === 'status' && site.api_key_encrypted) {
      if (backup.status === 'pending' || backup.status === 'creating') {
        const statusResult = await getBackupStatus(
          site.url,
          site.api_key_encrypted,
          backupId
        );

        if (statusResult.success && statusResult.status) {
          // Update local status if changed
          if (statusResult.status !== backup.status) {
            const updateData: Record<string, unknown> = {
              status: statusResult.status,
            };

            if (statusResult.status === 'completed') {
              updateData.completed_at = new Date().toISOString();
              // Set expiration 30 days from now
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + 30);
              updateData.expires_at = expiresAt.toISOString();
            }

            await supabase
              .from('site_backups')
              .update(updateData)
              .eq('id', backupId);

            backup.status = statusResult.status;
          }
        }
      }
    }

    return NextResponse.json({ backup });
  } catch (error) {
    console.error('GET /api/sites/[id]/backups/[backupId] error:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero del backup' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sites/[id]/backups/[backupId]
 * Delete a backup
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; backupId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, backupId } = await params;

  try {
    const supabase = createAdminClient();

    // Get user's current tenant
    const { data: user } = await supabase
      .from('users')
      .select('current_tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.current_tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get site with API key
    const { data: site } = await supabase
      .from('sites')
      .select('id, url, api_key_encrypted')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get backup record
    const { data: backup } = await supabase
      .from('site_backups')
      .select('*')
      .eq('id', backupId)
      .eq('site_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    // Try to delete from WordPress plugin
    if (site.api_key_encrypted && backup.status === 'completed') {
      const deleteResult = await deleteBackupFromPlugin(
        site.url,
        site.api_key_encrypted,
        backupId
      );

      if (!deleteResult.success) {
        console.warn('Could not delete backup from plugin:', deleteResult.error);
        // Continue anyway - we'll mark as deleted in database
      }
    }

    // Update backup status to deleted (soft delete)
    const { error: updateError } = await supabase
      .from('site_backups')
      .update({ status: 'deleted' })
      .eq('id', backupId);

    if (updateError) {
      console.error('Error updating backup status:', updateError);
      return NextResponse.json(
        { error: 'Errore durante eliminazione backup' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Backup eliminato con successo',
    });
  } catch (error) {
    console.error('DELETE /api/sites/[id]/backups/[backupId] error:', error);
    return NextResponse.json(
      { error: 'Errore durante eliminazione backup' },
      { status: 500 }
    );
  }
}

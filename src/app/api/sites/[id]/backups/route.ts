import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createBackupRequest,
  listBackupsFromPlugin,
  type BackupOptions,
} from '@/lib/backup/manager';
import { decrypt } from '@/lib/crypto';
import type { BackupType, SiteBackup } from '@/types/database';

/**
 * GET /api/sites/[id]/backups
 * List all backups for a site
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Get query params
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

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

    // Verify site belongs to tenant
    const { data: site } = await supabase
      .from('sites')
      .select('id, name, url, backup_enabled, last_backup, api_key_encrypted')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get backups from database
    const { data: backups, error, count } = await supabase
      .from('site_backups')
      .select('*', { count: 'exact' })
      .eq('site_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching backups:', error);
      return NextResponse.json(
        { error: 'Errore nel recupero dei backup' },
        { status: 500 }
      );
    }

    // Calculate stats
    let stats = null;
    if (backups && backups.length > 0) {
      const completedBackups = backups.filter(b => b.status === 'completed');
      const totalSize = completedBackups.reduce((acc, b) => acc + (b.file_size || 0), 0);

      stats = {
        total_backups: count || backups.length,
        completed_backups: completedBackups.length,
        total_size: totalSize,
        last_backup: backups[0]?.created_at || null,
      };
    }

    return NextResponse.json({
      site: {
        id: site.id,
        name: site.name,
        url: site.url,
        backup_enabled: site.backup_enabled,
        last_backup: site.last_backup,
      },
      backups: backups || [],
      stats,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('GET /api/sites/[id]/backups error:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei backup' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sites/[id]/backups
 * Create a new backup
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const backupType: BackupType = body.type || 'full';
    const includeDatabase = body.include_database ?? true;
    const includeFiles = body.include_files ?? true;
    const includeUploads = body.include_uploads ?? true;

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
      .select('*')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (!site.api_key_encrypted) {
      return NextResponse.json(
        { error: 'API key non configurata per questo sito' },
        { status: 400 }
      );
    }

    const apiKey = decrypt(site.api_key_encrypted);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Impossibile decifrare la API key' },
        { status: 500 }
      );
    }

    // Check if there's already a backup in progress
    const { data: pendingBackup } = await supabase
      .from('site_backups')
      .select('id')
      .eq('site_id', id)
      .in('status', ['pending', 'creating'])
      .single();

    if (pendingBackup) {
      return NextResponse.json(
        { error: 'Un backup e gia in corso per questo sito' },
        { status: 409 }
      );
    }

    // Create backup record in database (pending status)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-${site.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${timestamp}.zip`;

    const backupData: Partial<SiteBackup> = {
      site_id: id,
      tenant_id: user.current_tenant_id,
      filename,
      backup_type: backupType,
      status: 'pending',
      includes_database: includeDatabase,
      includes_files: includeFiles,
      includes_uploads: includeUploads,
    };

    const { data: insertedBackup, error: insertError } = await supabase
      .from('site_backups')
      .insert(backupData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting backup record:', insertError);
      return NextResponse.json(
        { error: 'Errore nella creazione del record backup' },
        { status: 500 }
      );
    }

    // Send backup request to WordPress plugin
    const backupOptions: BackupOptions = {
      type: backupType,
      includeDatabase,
      includeFiles,
      includeUploads,
    };

    const backupResult = await createBackupRequest(
      site.url,
      apiKey,
      backupOptions
    );

    if (!backupResult.success) {
      // Update backup record to failed
      await supabase
        .from('site_backups')
        .update({
          status: 'failed',
          error_message: backupResult.error || 'Errore sconosciuto',
        })
        .eq('id', insertedBackup.id);

      return NextResponse.json(
        { error: backupResult.error || 'Errore nella creazione del backup' },
        { status: 500 }
      );
    }

    // Update backup record with plugin response
    await supabase
      .from('site_backups')
      .update({
        status: 'creating',
        filename: backupResult.filename || filename,
      })
      .eq('id', insertedBackup.id);

    // Update site last_backup timestamp
    await supabase
      .from('sites')
      .update({ last_backup: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      message: 'Backup avviato con successo',
      backup: {
        id: insertedBackup.id,
        filename: backupResult.filename || filename,
        status: 'creating',
      },
    });
  } catch (error) {
    console.error('POST /api/sites/[id]/backups error:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione del backup' },
      { status: 500 }
    );
  }
}

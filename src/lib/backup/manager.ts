/**
 * Backup Manager v1.5.0
 * Manages WordPress backup creation and retrieval
 */

import type { BackupType, BackupStatus, SiteBackup } from '@/types/database';

export interface BackupOptions {
  type: BackupType;
  includeDatabase?: boolean;
  includeFiles?: boolean;
  includeUploads?: boolean;
}

export interface BackupResponse {
  success: boolean;
  backup_id?: string;
  filename?: string;
  status?: BackupStatus;
  message?: string;
  error?: string;
}

export interface BackupListResponse {
  backups: Array<{
    id: string;
    filename: string;
    file_size: number;
    backup_type: BackupType;
    status: BackupStatus;
    created_at: string;
    completed_at: string | null;
  }>;
  total: number;
}

export interface BackupDownloadResponse {
  success: boolean;
  download_url?: string;
  filename?: string;
  file_size?: number;
  error?: string;
}

/**
 * Create a backup request to WordPress plugin
 */
export async function createBackupRequest(
  siteUrl: string,
  apiKey: string,
  options: BackupOptions
): Promise<BackupResponse> {
  const apiUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/webmaster-monitor/v1/backups`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WM-API-Key': apiKey,
        'User-Agent': 'Webmaster-Monitor/1.0',
      },
      body: JSON.stringify({
        type: options.type,
        include_database: options.includeDatabase ?? true,
        include_files: options.includeFiles ?? true,
        include_uploads: options.includeUploads ?? true,
      }),
      signal: AbortSignal.timeout(60000), // 60 second timeout for backup initiation
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Errore dal plugin: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      backup_id: data.backup_id,
      filename: data.filename,
      status: data.status || 'pending',
      message: data.message,
    };
  } catch (error) {
    console.error('Error creating backup request:', error);
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        return { success: false, error: 'Timeout nella richiesta di backup' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Errore sconosciuto' };
  }
}

/**
 * Get backup status from WordPress plugin
 */
export async function getBackupStatus(
  siteUrl: string,
  apiKey: string,
  backupId: string
): Promise<BackupResponse> {
  const apiUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/webmaster-monitor/v1/backups/${backupId}/status`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-WM-API-Key': apiKey,
        'User-Agent': 'Webmaster-Monitor/1.0',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Errore: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      backup_id: backupId,
      status: data.status,
      filename: data.filename,
      message: data.message,
    };
  } catch (error) {
    console.error('Error getting backup status:', error);
    return { success: false, error: 'Errore nel recupero stato backup' };
  }
}

/**
 * List backups from WordPress plugin
 */
export async function listBackupsFromPlugin(
  siteUrl: string,
  apiKey: string
): Promise<BackupListResponse> {
  const apiUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/webmaster-monitor/v1/backups`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-WM-API-Key': apiKey,
        'User-Agent': 'Webmaster-Monitor/1.0',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      backups: data.backups || [],
      total: data.total || 0,
    };
  } catch (error) {
    console.error('Error listing backups from plugin:', error);
    return { backups: [], total: 0 };
  }
}

/**
 * Get download URL for a backup
 */
export async function getBackupDownloadUrl(
  siteUrl: string,
  apiKey: string,
  backupId: string
): Promise<BackupDownloadResponse> {
  const apiUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/webmaster-monitor/v1/backups/${backupId}/download`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-WM-API-Key': apiKey,
        'User-Agent': 'Webmaster-Monitor/1.0',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Errore: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      download_url: data.download_url,
      filename: data.filename,
      file_size: data.file_size,
    };
  } catch (error) {
    console.error('Error getting backup download URL:', error);
    return { success: false, error: 'Errore nel recupero URL download' };
  }
}

/**
 * Delete a backup from WordPress plugin
 */
export async function deleteBackupFromPlugin(
  siteUrl: string,
  apiKey: string,
  backupId: string
): Promise<{ success: boolean; error?: string }> {
  const apiUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/webmaster-monitor/v1/backups/${backupId}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'X-WM-API-Key': apiKey,
        'User-Agent': 'Webmaster-Monitor/1.0',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return { success: false, error: `Errore: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting backup:', error);
    return { success: false, error: 'Errore durante eliminazione backup' };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return 'N/A';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Get backup type label in Italian
 */
export function getBackupTypeLabel(type: BackupType): string {
  switch (type) {
    case 'full':
      return 'Completo';
    case 'database':
      return 'Solo Database';
    case 'files':
      return 'Solo File';
    default:
      return type;
  }
}

/**
 * Get backup status label in Italian
 */
export function getBackupStatusLabel(status: BackupStatus): string {
  switch (status) {
    case 'pending':
      return 'In attesa';
    case 'creating':
      return 'In creazione';
    case 'completed':
      return 'Completato';
    case 'failed':
      return 'Fallito';
    case 'deleted':
      return 'Eliminato';
    default:
      return status;
  }
}

/**
 * Get backup status color for UI
 */
export function getBackupStatusColor(status: BackupStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
    case 'creating':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
    case 'completed':
      return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
    case 'failed':
      return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
    case 'deleted':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Calculate estimated backup time based on site size
 */
export function estimateBackupTime(siteSize: number | null): string {
  if (!siteSize) return 'Tempo stimato non disponibile';

  // Rough estimate: 1MB per second for creation
  const seconds = Math.ceil(siteSize / (1024 * 1024));

  if (seconds < 60) return `~${seconds} secondi`;
  if (seconds < 3600) return `~${Math.ceil(seconds / 60)} minuti`;
  return `~${Math.ceil(seconds / 3600)} ore`;
}

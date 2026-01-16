'use client';

import { useState, useEffect } from 'react';
import { SecurityScoreCard } from './security-score-card';
import { SecurityDetails } from './security-details';
import { RecommendationsList } from './recommendations-list';
import { BackupList } from '../backup/backup-list';
import { CreateBackupDialog } from '../backup/create-backup-dialog';
import { toast } from 'sonner';
import type { SecurityScan, SiteBackup, BackupType } from '@/types/database';

interface SecurityTabProps {
  siteId: string;
  siteName?: string;
}

export function SecurityTab({ siteId, siteName }: SecurityTabProps) {
  // Security state
  const [securityScan, setSecurityScan] = useState<SecurityScan | null>(null);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // Backup state
  const [backups, setBackups] = useState<SiteBackup[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(true);
  const [createBackupOpen, setCreateBackupOpen] = useState(false);

  useEffect(() => {
    fetchSecurityData();
    fetchBackups();
  }, [siteId]);

  const fetchSecurityData = async () => {
    setSecurityLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/security`);
      if (res.ok) {
        const data = await res.json();
        setSecurityScan(data.scan || null);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setSecurityLoading(false);
    }
  };

  const runSecurityScan = async () => {
    setIsScanning(true);
    toast.info('Scansione di sicurezza in corso...');

    try {
      const res = await fetch(`/api/sites/${siteId}/security`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Scansione completata');
        setSecurityScan(data.scan);
      } else {
        toast.error(data.error || 'Errore durante la scansione');
      }
    } catch (error) {
      toast.error('Errore durante la scansione');
    } finally {
      setIsScanning(false);
    }
  };

  const fetchBackups = async () => {
    setBackupsLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/backups`);
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
    } finally {
      setBackupsLoading(false);
    }
  };

  const handleCreateBackup = async (options: {
    type: BackupType;
    includeDatabase: boolean;
    includeFiles: boolean;
    includeUploads: boolean;
  }) => {
    const res = await fetch(`/api/sites/${siteId}/backups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: options.type,
        include_database: options.includeDatabase,
        include_files: options.includeFiles,
        include_uploads: options.includeUploads,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Errore nella creazione del backup');
    }

    toast.success('Backup avviato con successo');
    fetchBackups();
  };

  const handleDownloadBackup = async (backupId: string) => {
    toast.info('Preparazione download...');

    try {
      const res = await fetch(`/api/sites/${siteId}/backups/${backupId}?action=download`);
      const data = await res.json();

      if (res.ok && data.download_url) {
        // Open download URL in new tab
        window.open(data.download_url, '_blank');
        toast.success('Download avviato');
      } else {
        toast.error(data.error || 'Errore nel download');
      }
    } catch (error) {
      toast.error('Errore nel download');
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      const res = await fetch(`/api/sites/${siteId}/backups/${backupId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Backup eliminato');
        fetchBackups();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Errore durante eliminazione');
      }
    } catch (error) {
      toast.error('Errore durante eliminazione');
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <SecurityScoreCard
        scan={securityScan}
        isLoading={securityLoading}
        isScanning={isScanning}
        onScan={runSecurityScan}
      />

      {/* Security Details */}
      {securityScan && <SecurityDetails scan={securityScan} />}

      {/* Recommendations */}
      {securityScan && (
        <RecommendationsList recommendations={securityScan.recommendations || []} />
      )}

      {/* Backups */}
      <BackupList
        backups={backups}
        isLoading={backupsLoading}
        onCreateBackup={() => setCreateBackupOpen(true)}
        onDownload={handleDownloadBackup}
        onDelete={handleDeleteBackup}
        onRefresh={fetchBackups}
      />

      {/* Create Backup Dialog */}
      <CreateBackupDialog
        open={createBackupOpen}
        onOpenChange={setCreateBackupOpen}
        onCreateBackup={handleCreateBackup}
        siteName={siteName}
      />
    </div>
  );
}

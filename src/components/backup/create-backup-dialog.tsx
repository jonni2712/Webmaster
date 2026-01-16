'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HardDrive, Database, FolderOpen, Image, Loader2, AlertCircle } from 'lucide-react';
import type { BackupType } from '@/types/database';

interface CreateBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBackup: (options: {
    type: BackupType;
    includeDatabase: boolean;
    includeFiles: boolean;
    includeUploads: boolean;
  }) => Promise<void>;
  siteName?: string;
}

export function CreateBackupDialog({
  open,
  onOpenChange,
  onCreateBackup,
  siteName,
}: CreateBackupDialogProps) {
  const [backupType, setBackupType] = useState<BackupType>('full');
  const [includeDatabase, setIncludeDatabase] = useState(true);
  const [includeFiles, setIncludeFiles] = useState(true);
  const [includeUploads, setIncludeUploads] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      await onCreateBackup({
        type: backupType,
        includeDatabase,
        includeFiles,
        includeUploads,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la creazione del backup');
    } finally {
      setIsCreating(false);
    }
  };

  const handleTypeChange = (type: BackupType) => {
    setBackupType(type);
    // Auto-configure checkboxes based on type
    if (type === 'database') {
      setIncludeDatabase(true);
      setIncludeFiles(false);
      setIncludeUploads(false);
    } else if (type === 'files') {
      setIncludeDatabase(false);
      setIncludeFiles(true);
      setIncludeUploads(true);
    } else {
      setIncludeDatabase(true);
      setIncludeFiles(true);
      setIncludeUploads(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Nuovo Backup
          </DialogTitle>
          <DialogDescription>
            Crea un nuovo backup per {siteName || 'questo sito'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Tipo di backup</Label>
            <Select value={backupType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">
                  <span className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Completo (Database + File)
                  </span>
                </SelectItem>
                <SelectItem value="database">
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Solo Database
                  </span>
                </SelectItem>
                <SelectItem value="files">
                  <span className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Solo File
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Opzioni</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={includeDatabase}
                  onCheckedChange={(checked) => setIncludeDatabase(checked === true)}
                  disabled={backupType === 'files'}
                />
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Includi database</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={includeFiles}
                  onCheckedChange={(checked) => setIncludeFiles(checked === true)}
                  disabled={backupType === 'database'}
                />
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Includi file WordPress</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={includeUploads}
                  onCheckedChange={(checked) => setIncludeUploads(checked === true)}
                  disabled={backupType === 'database'}
                />
                <Image className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Includi uploads (media)</span>
              </label>
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              Il backup verra salvato sul server WordPress in{' '}
              <code className="text-xs bg-muted px-1 rounded">/wp-content/webmaster-backups/</code>
              <br />
              I backup vengono eliminati automaticamente dopo 30 giorni.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Annulla
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crea Backup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

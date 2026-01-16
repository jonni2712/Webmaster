'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  HardDrive,
  Plus,
  MoreVertical,
  Download,
  Trash2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  formatFileSize,
  getBackupTypeLabel,
  getBackupStatusLabel,
  getBackupStatusColor,
} from '@/lib/backup/manager';
import type { SiteBackup } from '@/types/database';

interface BackupListProps {
  backups: SiteBackup[];
  isLoading?: boolean;
  onCreateBackup?: () => void;
  onDownload?: (backupId: string) => void;
  onDelete?: (backupId: string) => void;
  onRefresh?: () => void;
}

export function BackupList({
  backups,
  isLoading,
  onCreateBackup,
  onDownload,
  onDelete,
  onRefresh,
}: BackupListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);

  const handleDeleteClick = (backupId: string) => {
    setBackupToDelete(backupId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (backupToDelete && onDelete) {
      onDelete(backupToDelete);
    }
    setDeleteDialogOpen(false);
    setBackupToDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Backup
          </CardTitle>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {onCreateBackup && (
              <Button size="sm" onClick={onCreateBackup} disabled={isLoading}>
                <Plus className="h-4 w-4 mr-1" />
                Nuovo Backup
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && backups.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <HardDrive className="h-16 w-16 text-muted-foreground/50" />
              <p className="text-muted-foreground text-center">
                Nessun backup disponibile.
                <br />
                Crea il primo backup del sito.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Dimensione</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map(backup => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {backup.filename}
                      </TableCell>
                      <TableCell>{getBackupTypeLabel(backup.backup_type)}</TableCell>
                      <TableCell>{formatFileSize(backup.file_size)}</TableCell>
                      <TableCell>
                        <Badge className={getBackupStatusColor(backup.status)}>
                          {getBackupStatusLabel(backup.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(backup.created_at).toLocaleString('it-IT', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {backup.status === 'completed' && onDownload && (
                              <DropdownMenuItem onClick={() => onDownload(backup.id)}>
                                <Download className="h-4 w-4 mr-2" />
                                Scarica
                              </DropdownMenuItem>
                            )}
                            {backup.status !== 'deleted' && onDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(backup.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Elimina
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non puo essere annullata. Il backup verra eliminato
              permanentemente dal server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChannelForm } from './channel-form';

interface ChannelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ChannelFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: ChannelFormDialogProps) {
  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aggiungi canale di notifica</DialogTitle>
          <DialogDescription>
            Configura un nuovo canale per ricevere le notifiche degli alert
          </DialogDescription>
        </DialogHeader>
        <ChannelForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}

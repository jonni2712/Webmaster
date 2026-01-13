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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import type { MemberRole } from '@/types/database';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserRole: MemberRole;
  onInviteSent: () => void;
}

const roleOptions = [
  {
    value: 'member',
    label: 'Membro',
    description: 'Puo visualizzare e gestire i siti assegnati',
  },
  {
    value: 'viewer',
    label: 'Visualizzatore',
    description: 'Puo solo visualizzare i siti assegnati',
  },
  {
    value: 'admin',
    label: 'Amministratore',
    description: 'Accesso completo a tutti i siti e gestione team',
    ownerOnly: true,
  },
];

export function InviteMemberDialog({
  open,
  onOpenChange,
  currentUserRole,
  onInviteSent,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const availableRoles = roleOptions.filter(
    r => !r.ownerOnly || currentUserRole === 'owner'
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/team/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Errore nell\'invio dell\'invito');
        return;
      }

      setSuccess(true);
      setEmail('');
      setRole('member');

      // Auto close after success
      setTimeout(() => {
        onInviteSent();
        onOpenChange(false);
        setSuccess(false);
      }, 1500);
    } catch {
      setError('Errore di connessione');
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    if (!isLoading) {
      setEmail('');
      setRole('member');
      setError(null);
      setSuccess(false);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invita nuovo membro</DialogTitle>
          <DialogDescription>
            Invia un invito via email per aggiungere un nuovo membro al team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Invito inviato con successo!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="esempio@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isLoading || success}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Ruolo</Label>
            <Select
              value={role}
              onValueChange={value => setRole(value as typeof role)}
              disabled={isLoading || success}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Seleziona ruolo" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading || success || !email}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {success ? 'Inviato!' : 'Invia invito'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

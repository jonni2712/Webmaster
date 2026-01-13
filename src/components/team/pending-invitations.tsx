'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Clock, Mail, X, Loader2 } from 'lucide-react';
import type { TeamInvitation, MemberRole } from '@/types/database';

interface PendingInvitationsProps {
  currentUserRole: MemberRole;
}

const roleLabels: Record<string, string> = {
  admin: 'Amministratore',
  member: 'Membro',
  viewer: 'Visualizzatore',
};

export function PendingInvitations({ currentUserRole }: PendingInvitationsProps) {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invitationToCancel, setInvitationToCancel] = useState<TeamInvitation | null>(
    null
  );
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, []);

  async function fetchInvitations() {
    try {
      const response = await fetch('/api/team/invitations');
      const data = await response.json();
      if (response.ok) {
        setInvitations(data.invitations);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancelInvitation() {
    if (!invitationToCancel) return;
    setIsCanceling(true);

    try {
      const response = await fetch(`/api/team/invitations/${invitationToCancel.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setInvitations(invitations.filter(i => i.id !== invitationToCancel.id));
      }
    } catch (error) {
      console.error('Error canceling invitation:', error);
    } finally {
      setIsCanceling(false);
      setInvitationToCancel(null);
    }
  }

  function formatExpiryDate(expiresAt: string): string {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Scade oggi';
    if (days === 1) return 'Scade domani';
    return `Scade tra ${days} giorni`;
  }

  const canManageInvitations = currentUserRole === 'owner' || currentUserRole === 'admin';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inviti in attesa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inviti in attesa</CardTitle>
          <CardDescription>Nessun invito in attesa di accettazione</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Inviti in attesa</CardTitle>
        <CardDescription>
          {invitations.length} invit{invitations.length === 1 ? 'o' : 'i'} in attesa di
          accettazione
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map(invitation => (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{invitation.email}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {roleLabels[invitation.role] || invitation.role}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatExpiryDate(invitation.expires_at)}
                    </span>
                  </div>
                </div>
              </div>

              {canManageInvitations && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setInvitationToCancel(invitation)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      {/* Cancel Invitation Dialog */}
      <AlertDialog
        open={!!invitationToCancel}
        onOpenChange={() => setInvitationToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annulla invito</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler annullare l'invito per{' '}
              <strong>{invitationToCancel?.email}</strong>? L'utente non potra piu
              usare il link di invito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantieni</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvitation}
              disabled={isCanceling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCanceling ? 'Annullamento...' : 'Si, annulla'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

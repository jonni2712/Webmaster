'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Users, UserPlus } from 'lucide-react';

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  tenant_name: string;
  inviter_name: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Amministratore',
  member: 'Membro',
  viewer: 'Visualizzatore',
};

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  async function fetchInvitation() {
    try {
      const response = await fetch(`/api/team/invitations/accept?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invito non valido');
        return;
      }

      setInvitation(data.invitation);
    } catch {
      setError('Errore nel recupero dell\'invito');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAccept() {
    setIsAccepting(true);
    setError(null);

    try {
      const response = await fetch('/api/team/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresAuth) {
          // Redirect to login with return URL
          signIn(undefined, { callbackUrl: `/accept-invite/${token}` });
          return;
        }
        if (data.emailMismatch) {
          setError(data.error);
          return;
        }
        setError(data.error || 'Errore nell\'accettazione');
        return;
      }

      setSuccess(true);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch {
      setError('Errore di connessione');
    } finally {
      setIsAccepting(false);
    }
  }

  // Loading state
  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl">Caricamento...</CardTitle>
            <CardDescription>
              Stiamo recuperando i dettagli dell'invito.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">Benvenuto nel team!</CardTitle>
            <CardDescription>
              Sei entrato con successo in {invitation?.tenant_name}.
              Verrai reindirizzato alla dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Error state (invalid/expired invite)
  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900 p-3">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">Invito non valido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => router.push('/login')}>
              Vai al login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show invitation details
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Invito al team</CardTitle>
          <CardDescription>
            Sei stato invitato a unirti a un team su Webmaster Monitor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {invitation && (
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Team</p>
                  <p className="font-medium">{invitation.tenant_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Invitato da</p>
                  <p className="font-medium">{invitation.inviter_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 flex items-center justify-center">
                  <span className="text-lg">@</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{invitation.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 flex items-center justify-center">
                  <span className="text-lg font-bold text-muted-foreground">#</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ruolo</p>
                  <p className="font-medium">{roleLabels[invitation.role] || invitation.role}</p>
                </div>
              </div>
            </div>
          )}

          {!session ? (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Effettua il login per accettare l'invito
              </p>
              <Button
                onClick={() => signIn(undefined, { callbackUrl: `/accept-invite/${token}` })}
                className="w-full"
              >
                Accedi
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Non hai un account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => router.push(`/register?invite=${token}`)}
                >
                  Registrati
                </Button>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Connesso come <strong>{session.user?.email}</strong>
              </p>
              <Button
                onClick={handleAccept}
                disabled={isAccepting}
                className="w-full"
              >
                {isAccepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accetta invito
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

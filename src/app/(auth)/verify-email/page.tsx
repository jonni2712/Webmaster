'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const isPending = searchParams.get('pending') === 'true';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    // Get stored email
    const storedEmail = sessionStorage.getItem('pendingVerificationEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }

    // Auto-verify if token is present
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  async function verifyEmail(verificationToken: string) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Errore nella verifica');
        return;
      }

      setSuccess(true);
      sessionStorage.removeItem('pendingVerificationEmail');
    } catch {
      setError('Errore di connessione');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendEmail() {
    if (!email) {
      setError('Inserisci la tua email');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResendSuccess(false);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Errore nell'invio");
        return;
      }

      setResendSuccess(true);
    } catch {
      setError('Errore di connessione');
    } finally {
      setIsLoading(false);
    }
  }

  // Show success state
  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Email Verificata!</CardTitle>
          <CardDescription>
            Il tuo account e stato verificato con successo.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push('/login')}>Accedi ora</Button>
        </CardContent>
      </Card>
    );
  }

  // Verifying token
  if (token && isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <CardTitle className="text-2xl">Verifica in corso...</CardTitle>
          <CardDescription>
            Stiamo verificando il tuo indirizzo email.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Pending verification or resend form
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">Verifica la tua email</CardTitle>
        <CardDescription>
          {isPending
            ? 'Ti abbiamo inviato un link di verifica. Controlla la tua casella di posta.'
            : 'Inserisci la tua email per ricevere un nuovo link di verifica.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resendSuccess && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Email di verifica inviata! Controlla la tua casella di posta.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Input
            type="email"
            placeholder="nome@esempio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            onClick={handleResendEmail}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Invia link di verifica
          </Button>
        </div>

        <div className="text-center">
          <Button variant="link" onClick={() => router.push('/login')}>
            Torna al login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          </CardHeader>
        </Card>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

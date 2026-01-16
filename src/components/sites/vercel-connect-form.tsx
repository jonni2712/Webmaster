'use client';

import { useState } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  repo: string | null;
}

interface VercelTeam {
  id: string;
  name: string;
  slug: string;
}

interface VercelConnectFormProps {
  siteId: string;
  isConnected: boolean;
  projectName?: string;
  lastSync?: string;
  onConnect: () => void;
}

export function VercelConnectForm({
  siteId,
  isConnected,
  projectName,
  lastSync,
  onConnect,
}: VercelConnectFormProps) {
  const [token, setToken] = useState('');
  const [teamId, setTeamId] = useState<string>('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [teams, setTeams] = useState<VercelTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenVerified, setTokenVerified] = useState(false);

  const verifyToken = async () => {
    if (!token.trim()) {
      setError('Inserisci un token Vercel valido');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const res = await fetch(`/api/sites/${siteId}/vercel/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, team_id: teamId || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore nella verifica del token');
        return;
      }

      setProjects(data.projects || []);
      setTeams(data.teams || []);
      setTokenVerified(true);
      toast.success('Token verificato con successo');
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setVerifying(false);
    }
  };

  const handleTeamChange = async (newTeamId: string) => {
    setTeamId(newTeamId);
    setProjectId('');
    setProjects([]);

    if (tokenVerified && token) {
      setVerifying(true);
      try {
        const res = await fetch(`/api/sites/${siteId}/vercel/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            team_id: newTeamId || undefined,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setProjects(data.projects || []);
        }
      } finally {
        setVerifying(false);
      }
    }
  };

  const handleConnect = async () => {
    if (!projectId) {
      setError('Seleziona un progetto');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const res = await fetch(`/api/sites/${siteId}/vercel/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vercel_token: token,
          vercel_project_id: projectId,
          vercel_team_id: teamId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore nella connessione');
        return;
      }

      toast.success(`Connesso a ${data.project.name}. ${data.deployments_synced} deployment sincronizzati.`);

      // Show webhook info
      if (data.webhook_secret) {
        toast.info(
          'Configura il webhook su Vercel per ricevere notifiche in tempo reale',
          { duration: 5000 }
        );
      }

      onConnect();
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setConnecting(false);
    }
  };

  if (isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Vercel Connesso
          </CardTitle>
          <CardDescription>
            Progetto: <strong>{projectName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lastSync && (
              <p className="text-sm text-muted-foreground">
                Ultima sincronizzazione:{' '}
                {new Date(lastSync).toLocaleString('it-IT')}
              </p>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Per ricevere notifiche in tempo reale, configura un webhook su Vercel:
                <br />
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/api/webhooks/vercel`
                    : '/api/webhooks/vercel'}
                </code>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://vercel.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apri Vercel
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Connetti a Vercel
        </CardTitle>
        <CardDescription>
          Collega questo sito al tuo progetto Vercel per monitorare i deployment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="vercel-token">Token Vercel</Label>
            <div className="flex gap-2">
              <Input
                id="vercel-token"
                type="password"
                placeholder="Inserisci il tuo token Vercel"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setTokenVerified(false);
                  setProjects([]);
                }}
              />
              <Button
                variant="outline"
                onClick={verifyToken}
                disabled={verifying || !token.trim()}
              >
                {verifying ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : tokenVerified ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  'Verifica'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Genera un token su{' '}
              <a
                href="https://vercel.com/account/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Vercel Settings → Tokens
              </a>
            </p>
          </div>

          {tokenVerified && teams.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="team">Team (opzionale)</Label>
              <Select value={teamId} onValueChange={handleTeamChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Account personale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Account personale</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {tokenVerified && projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="project">Progetto</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un progetto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <span>{project.name}</span>
                        {project.framework && (
                          <Badge variant="secondary" className="text-xs">
                            {project.framework}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projects.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nessun progetto trovato. Verifica di aver selezionato il team corretto.
                </p>
              )}
            </div>
          )}

          {tokenVerified && projectId && (
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full"
            >
              {connecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connessione in corso...
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Connetti Progetto
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

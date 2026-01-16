'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  RefreshCw,
  ExternalLink,
  GitBranch,
  GitCommit,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';
import type { VercelDeployment, VercelDeploymentState } from '@/types/database';

interface VercelDeploymentsListProps {
  siteId: string;
  isConnected: boolean;
}

const stateConfig: Record<
  VercelDeploymentState,
  { label: string; color: string; icon: React.ElementType }
> = {
  READY: { label: 'Completato', color: 'bg-green-500', icon: CheckCircle },
  ERROR: { label: 'Errore', color: 'bg-red-500', icon: XCircle },
  BUILDING: { label: 'In corso', color: 'bg-blue-500', icon: Loader2 },
  QUEUED: { label: 'In coda', color: 'bg-yellow-500', icon: Clock },
  INITIALIZING: { label: 'Inizializzazione', color: 'bg-gray-500', icon: Loader2 },
  CANCELED: { label: 'Annullato', color: 'bg-gray-500', icon: AlertTriangle },
};

export function VercelDeploymentsList({
  siteId,
  isConnected,
}: VercelDeploymentsListProps) {
  const [deployments, setDeployments] = useState<VercelDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchDeployments = async () => {
    if (!isConnected) return;

    try {
      const res = await fetch(`/api/sites/${siteId}/vercel/deployments`);
      if (res.ok) {
        const data = await res.json();
        setDeployments(data.deployments || []);
      }
    } catch (error) {
      console.error('Error fetching deployments:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncDeployments = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/vercel/deployments`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`${data.synced} deployment sincronizzati`);
        fetchDeployments();
      } else {
        toast.error(data.error || 'Errore nella sincronizzazione');
      }
    } catch (error) {
      toast.error('Errore nella sincronizzazione');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, [siteId, isConnected]);

  if (!isConnected) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Deployment</CardTitle>
            <CardDescription>
              Cronologia dei deployment Vercel
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={syncDeployments}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizza
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {deployments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nessun deployment trovato
          </p>
        ) : (
          <div className="space-y-3">
            {deployments.map((deployment) => {
              const config = stateConfig[deployment.state] || stateConfig.BUILDING;
              const StateIcon = config.icon;

              return (
                <div
                  key={deployment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${config.color} text-white`}>
                      <StateIcon className={`h-4 w-4 ${deployment.state === 'BUILDING' ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={deployment.target === 'production' ? 'default' : 'secondary'}
                        >
                          {deployment.target || 'preview'}
                        </Badge>
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>

                      {deployment.git_branch && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <GitBranch className="h-3 w-3" />
                          <span>{deployment.git_branch}</span>
                        </div>
                      )}

                      {deployment.git_commit_message && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {deployment.git_commit_message}
                        </p>
                      )}

                      {deployment.git_commit_sha && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <GitCommit className="h-3 w-3" />
                          <span className="font-mono">
                            {deployment.git_commit_sha.substring(0, 7)}
                          </span>
                          {deployment.git_commit_author && (
                            <span>by {deployment.git_commit_author}</span>
                          )}
                        </div>
                      )}

                      {deployment.error_message && (
                        <p className="text-sm text-red-500">
                          {deployment.error_message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(deployment.created_at), {
                        addSuffix: true,
                        locale: it,
                      })}
                    </div>

                    {deployment.build_duration_ms && (
                      <span className="text-xs">
                        Build: {Math.round(deployment.build_duration_ms / 1000)}s
                      </span>
                    )}

                    {deployment.deployment_url && (
                      <a
                        href={deployment.deployment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Apri
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PortfolioStats } from '@/components/portfolio/portfolio-stats';
import { Server, RefreshCw, Loader2, Wand2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { DomainPortfolioSummary, ServerWithStats, ExpiringDomain } from '@/types/database';

interface PortfolioData {
  summary: DomainPortfolioSummary;
  serverStats: ServerWithStats[];
  expiringDomains: ExpiringDomain[];
  statusDistribution: Record<string, number>;
  unassignedSites: { id: string; name: string; url: string; lifecycle_status: string }[];
}

interface AutoAssignResult {
  siteId: string;
  siteName: string;
  domain: string;
  resolvedIp: string | null;
  assignedServerId: string | null;
  assignedServerName: string | null;
  status: 'assigned' | 'no_match' | 'error';
  error?: string;
}

interface AutoAssignResponse {
  success: boolean;
  dryRun: boolean;
  message: string;
  summary: {
    total: number;
    assigned: number;
    noMatch: number;
    errors: number;
  };
  results: AutoAssignResult[];
  serverIps: Record<string, { id: string; name: string }>;
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-assign state
  const [isAutoAssignOpen, setIsAutoAssignOpen] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [autoAssignResults, setAutoAssignResults] = useState<AutoAssignResponse | null>(null);

  const fetchData = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/portfolio');
      if (!res.ok) {
        throw new Error('Errore nel caricamento dei dati');
      }
      const portfolioData = await res.json();
      setData(portfolioData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAutoAssign = async (dryRun: boolean) => {
    setIsAutoAssigning(true);
    try {
      const res = await fetch('/api/portfolio/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, onlyUnassigned: true }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Errore durante l\'auto-assegnazione');
      }

      setAutoAssignResults(result);

      if (!dryRun && result.summary.assigned > 0) {
        toast.success(`${result.summary.assigned} siti assegnati automaticamente`);
        fetchData(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore durante l\'auto-assegnazione');
    } finally {
      setIsAutoAssigning(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => fetchData()}>Riprova</Button>
      </div>
    );
  }

  const hasUnassignedSites = (data?.summary.domains_without_server || 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Domini</h1>
          <p className="text-muted-foreground">
            Panoramica completa del portfolio di {data?.summary.total_domains || 0} domini
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasUnassignedSites && (
            <Button
              variant="default"
              onClick={() => {
                setAutoAssignResults(null);
                setIsAutoAssignOpen(true);
              }}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Auto-assegna Server
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/portfolio/servers">
              <Server className="h-4 w-4 mr-2" />
              Gestisci Server
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {data && (
        <PortfolioStats
          summary={data.summary}
          serverStats={data.serverStats}
          expiringDomains={data.expiringDomains}
          statusDistribution={data.statusDistribution}
          unassignedSites={data.unassignedSites}
        />
      )}

      {/* Auto-assign Dialog */}
      <Dialog open={isAutoAssignOpen} onOpenChange={setIsAutoAssignOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Auto-assegnazione Server via DNS</DialogTitle>
            <DialogDescription>
              Risolve l'IP di ogni dominio e lo associa automaticamente al server corretto.
              Assicurati che i server abbiano l'IP configurato nel campo "Hostname".
            </DialogDescription>
          </DialogHeader>

          {!autoAssignResults ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground mb-4">
                {data?.summary.domains_without_server || 0} siti senza server assegnato
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleAutoAssign(true)}
                  disabled={isAutoAssigning}
                >
                  {isAutoAssigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Anteprima
                </Button>
                <Button
                  onClick={() => handleAutoAssign(false)}
                  disabled={isAutoAssigning}
                >
                  {isAutoAssigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Assegna Ora
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{autoAssignResults.summary.total}</p>
                  <p className="text-xs text-muted-foreground">Totale</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{autoAssignResults.summary.assigned}</p>
                  <p className="text-xs text-muted-foreground">Assegnati</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{autoAssignResults.summary.noMatch}</p>
                  <p className="text-xs text-muted-foreground">No Match</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{autoAssignResults.summary.errors}</p>
                  <p className="text-xs text-muted-foreground">Errori</p>
                </div>
              </div>

              {autoAssignResults.dryRun && (
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-center">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Questa è un'anteprima. Nessuna modifica è stata applicata.
                  </p>
                </div>
              )}

              {/* Results list */}
              <ScrollArea className="h-[300px] rounded-md border p-3">
                <div className="space-y-2">
                  {autoAssignResults.results.map((result) => (
                    <div
                      key={result.siteId}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {result.status === 'assigned' && (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                        {result.status === 'no_match' && (
                          <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        )}
                        {result.status === 'error' && (
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{result.siteName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {result.domain} → {result.resolvedIp || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {result.status === 'assigned' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                            {result.assignedServerName}
                          </Badge>
                        )}
                        {result.status === 'no_match' && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
                            IP non trovato
                          </Badge>
                        )}
                        {result.status === 'error' && (
                          <Badge variant="destructive" className="text-xs">
                            Errore
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <DialogFooter>
                {autoAssignResults.dryRun && autoAssignResults.summary.assigned > 0 && (
                  <Button
                    onClick={() => handleAutoAssign(false)}
                    disabled={isAutoAssigning}
                  >
                    {isAutoAssigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Conferma e Assegna
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsAutoAssignOpen(false)}>
                  Chiudi
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

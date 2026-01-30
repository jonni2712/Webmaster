'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PortfolioStats } from '@/components/portfolio/portfolio-stats';
import { Server, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { DomainPortfolioSummary, ServerWithStats, ExpiringDomain } from '@/types/database';

interface PortfolioData {
  summary: DomainPortfolioSummary;
  serverStats: ServerWithStats[];
  expiringDomains: ExpiringDomain[];
  statusDistribution: Record<string, number>;
  unassignedSites: { id: string; name: string; url: string; lifecycle_status: string }[];
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Domini</h1>
          <p className="text-muted-foreground">
            Panoramica completa del portfolio di {data?.summary.total_domains || 0} domini
          </p>
        </div>
        <div className="flex gap-2">
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
    </div>
  );
}

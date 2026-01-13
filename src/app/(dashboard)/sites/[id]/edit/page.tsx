'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { SiteForm } from '@/components/sites/site-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface SiteData {
  id: string;
  name: string;
  url: string;
  platform: 'wordpress' | 'prestashop' | 'other';
  client_id: string | null;
  ssl_check_enabled: boolean;
  uptime_check_enabled: boolean;
  performance_check_enabled: boolean;
  updates_check_enabled: boolean;
  ecommerce_check_enabled: boolean;
  tags: string[];
  notes: string | null;
}

function EditFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function EditSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [site, setSite] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSite();
  }, [id]);

  const fetchSite = async () => {
    try {
      const res = await fetch(`/api/sites/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSite(data);
      } else if (res.status === 404) {
        setError('Sito non trovato');
      } else {
        setError('Errore nel caricamento del sito');
      }
    } catch (err) {
      setError('Errore nel caricamento del sito');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <EditFormSkeleton />
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-muted-foreground mb-4">{error || 'Sito non trovato'}</p>
        <Button variant="outline" onClick={() => router.push('/sites')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alla lista siti
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
          onClick={() => router.push(`/sites/${id}`)}
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Modifica Sito</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {site.name}
          </p>
        </div>
      </div>

      <SiteForm
        siteId={id}
        initialData={{
          name: site.name,
          url: site.url,
          platform: site.platform,
          client_id: site.client_id || undefined,
          ssl_check_enabled: site.ssl_check_enabled,
          uptime_check_enabled: site.uptime_check_enabled,
          performance_check_enabled: site.performance_check_enabled,
          updates_check_enabled: site.updates_check_enabled,
          ecommerce_check_enabled: site.ecommerce_check_enabled,
          tags: site.tags || [],
          notes: site.notes || '',
        }}
      />
    </div>
  );
}

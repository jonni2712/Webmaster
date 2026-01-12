'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientForm } from '@/components/clients';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { Client } from '@/types';

function EditSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const clientId = params.id as string;

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data);
      } else {
        toast.error('Cliente non trovato');
        router.push('/clients');
      }
    } catch (error) {
      console.error('Error fetching client:', error);
      toast.error('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <EditSkeleton />;
  }

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={`/clients/${clientId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Modifica Cliente</h1>
          <p className="text-sm text-muted-foreground">{client.name}</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <ClientForm
          clientId={clientId}
          initialData={{
            name: client.name,
            company_name: client.company_name || '',
            email: client.email || '',
            phone: client.phone || '',
            referent_name: client.referent_name || '',
            referent_email: client.referent_email || '',
            referent_phone: client.referent_phone || '',
            address: client.address || '',
            vat_number: client.vat_number || '',
            fiscal_code: client.fiscal_code || '',
            logo_url: client.logo_url || '',
            notes: client.notes || '',
            is_active: client.is_active,
          }}
        />
      </div>
    </div>
  );
}

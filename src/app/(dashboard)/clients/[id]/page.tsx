'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Globe,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Client, Site } from '@/types';

interface ClientWithSites extends Client {
  sites_count: number;
  sites_up: number;
  sites_down: number;
  sites: Site[];
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientWithSites | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Cliente eliminato');
        router.push('/clients');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Errore durante l\'eliminazione');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore durante l\'eliminazione');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" asChild>
            <Link href="/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {client.logo_url ? (
                <img
                  src={client.logo_url}
                  alt={client.name}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold">{client.name}</h1>
                {!client.is_active && (
                  <Badge variant="secondary">Inattivo</Badge>
                )}
              </div>
              {client.company_name && (
                <p className="text-sm sm:text-base text-muted-foreground">
                  {client.company_name}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 ml-11 sm:ml-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${clientId}/edit`}>
              <Pencil className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Modifica</span>
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Elimina</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminare il cliente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione non puo' essere annullata. I siti associati non verranno eliminati ma saranno scollegati dal cliente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting ? 'Eliminazione...' : 'Elimina'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm text-muted-foreground">Siti</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-1">{client.sites_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Online</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-green-600">{client.sites_up}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Offline</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-red-600">{client.sites_down}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm text-muted-foreground">Stato</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-1">
              {client.is_active ? 'Attivo' : 'Inattivo'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Informazioni */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informazioni Aziendali
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-3">
            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <a href={`mailto:${client.email}`} className="text-sm hover:text-primary">
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <a href={`tel:${client.phone}`} className="text-sm hover:text-primary">
                  {client.phone}
                </a>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-sm">{client.address}</span>
              </div>
            )}
            {(client.vat_number || client.fiscal_code) && (
              <div className="pt-2 border-t space-y-2">
                {client.vat_number && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">P.IVA:</span> {client.vat_number}
                  </div>
                )}
                {client.fiscal_code && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">C.F.:</span> {client.fiscal_code}
                  </div>
                )}
              </div>
            )}
            {!client.email && !client.phone && !client.address && !client.vat_number && !client.fiscal_code && (
              <p className="text-sm text-muted-foreground">Nessuna informazione aggiuntiva</p>
            )}
          </CardContent>
        </Card>

        {/* Referente */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Referente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-3">
            {client.referent_name && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium">{client.referent_name}</span>
              </div>
            )}
            {client.referent_email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <a href={`mailto:${client.referent_email}`} className="text-sm hover:text-primary">
                  {client.referent_email}
                </a>
              </div>
            )}
            {client.referent_phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <a href={`tel:${client.referent_phone}`} className="text-sm hover:text-primary">
                  {client.referent_phone}
                </a>
              </div>
            )}
            {!client.referent_name && !client.referent_email && !client.referent_phone && (
              <p className="text-sm text-muted-foreground">Nessun referente specificato</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Note */}
      {client.notes && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Note
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Siti */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Siti ({client.sites.length})
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/sites/new?client_id=${clientId}`}>
                Aggiungi Sito
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {client.sites.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nessun sito associato a questo cliente
            </p>
          ) : (
            <div className="space-y-2">
              {client.sites.map((site) => (
                <Link
                  key={site.id}
                  href={`/sites/${site.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                      site.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{site.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{site.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {site.platform}
                    </Badge>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

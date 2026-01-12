'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Users,
  Globe,
  MoreVertical,
  Building2,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { ClientWithStats } from '@/types';

function ClientCard({ client }: { client: ClientWithStats }) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {client.logo_url ? (
                <img
                  src={client.logo_url}
                  alt={client.name}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <Link
                href={`/clients/${client.id}`}
                className="font-semibold text-sm sm:text-base hover:text-primary transition-colors line-clamp-1 block"
              >
                {client.name}
              </Link>
              {client.company_name && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                  {client.company_name}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {client.email && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="hidden sm:inline">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span className="hidden sm:inline">{client.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/clients/${client.id}`}>Dettagli</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/clients/${client.id}/edit`}>Modifica</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{client.sites_count}</span>
            <span className="text-xs text-muted-foreground">siti</span>
          </div>
          {client.sites_count > 0 && (
            <>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs text-green-600">{client.sites_up}</span>
              </div>
              {client.sites_down > 0 && (
                <div className="flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-xs text-red-600">{client.sites_down}</span>
                </div>
              )}
            </>
          )}
          {!client.is_active && (
            <Badge variant="secondary" className="text-xs">
              Inattivo
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ClientsGridSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="flex gap-4 mt-4 pt-4 border-t">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.company_name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Clienti</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestisci i tuoi clienti ({clients.length} totali)
          </p>
        </div>
        <Button size="sm" className="sm:size-default" asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nuovo Cliente</span>
            <span className="sm:hidden">Nuovo</span>
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca clienti..."
            className="pl-9 h-9 sm:h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <ClientsGridSkeleton />
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
            <p className="text-muted-foreground mb-3 sm:mb-4 text-center text-sm sm:text-base">
              {search ? 'Nessun cliente trovato' : 'Nessun cliente'}
            </p>
            {!search && (
              <Button asChild size="sm" className="sm:size-default">
                <Link href="/clients/new">Aggiungi il primo cliente</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}

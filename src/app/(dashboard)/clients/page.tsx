'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { PageHeader } from '@/components/layout/page-header';

function ClientCard({ client }: { client: ClientWithStats }) {
  return (
    <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-4 hover:border-zinc-300 dark:hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-8 w-8 rounded-md bg-zinc-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
            {client.logo_url ? (
              <img
                src={client.logo_url}
                alt={client.name}
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              <Building2 className="h-4 w-4 text-zinc-400" />
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/clients/${client.id}`}
              className="text-sm font-semibold text-zinc-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1 block"
            >
              {client.name}
            </Link>
            {client.company_name && (
              <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                {client.company_name}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {client.email && (
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <Phone className="h-3 w-3" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100">
              <MoreVertical className="h-3.5 w-3.5" />
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
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-100 dark:border-white/5">
        <div className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-sm font-mono font-medium text-zinc-900 dark:text-white">{client.sites_count}</span>
          <span className="text-xs text-zinc-500">siti</span>
        </div>
        {client.sites_count > 0 && (
          <>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{client.sites_up}</span>
            </div>
            {client.sites_down > 0 && (
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                <span className="text-xs font-mono text-red-600 dark:text-red-400">{client.sites_down}</span>
              </div>
            )}
          </>
        )}
        {!client.is_active && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-auto">
            Inattivo
          </Badge>
        )}
      </div>
    </div>
  );
}

function ClientsGridSkeleton() {
  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-4 w-28 mb-1.5" />
              <Skeleton className="h-3 w-20 mb-1.5" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-100 dark:border-white/5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
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
    <div>
      <PageHeader
        title="Clienti"
        description="Gestisci i tuoi clienti"
        actions={
          <Button size="sm" className="h-8 text-sm" asChild>
            <Link href="/clients/new">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nuovo cliente
            </Link>
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Search bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <Input
            placeholder="Cerca clienti..."
            className="pl-9 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Clients Grid */}
        {loading ? (
          <ClientsGridSkeleton />
        ) : filteredClients.length === 0 ? (
          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg flex flex-col items-center justify-center py-12 px-4">
            <Users className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-500 mb-3 text-center">
              {search ? 'Nessun cliente trovato' : 'Nessun cliente'}
            </p>
            {!search && (
              <Button asChild size="sm" className="h-8 text-sm">
                <Link href="/clients/new">Aggiungi il primo cliente</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredClients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

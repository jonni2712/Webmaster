'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  MoreHorizontal,
  Edit,
  ExternalLink,
  Server,
  Calendar,
  CheckSquare,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  LIFECYCLE_STATUS_CONFIG,
  getLifecycleStatusConfig,
  getLifecycleStatusOptions
} from '@/lib/constants/lifecycle-status';

interface DomainSite {
  id: string;
  name: string;
  url: string;
  platform: string;
  lifecycle_status: string;
  server_id: string | null;
  server_name: string | null;
  domain_expires_at: string | null;
  domain_registrar: string | null;
  domain_notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface ServerOption {
  id: string;
  name: string;
}

const ITEMS_PER_PAGE = 50;

export default function DomainsPage() {
  const [domains, setDomains] = useState<DomainSite[]>([]);
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serverFilter, setServerFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit modal
  const [editingDomain, setEditingDomain] = useState<DomainSite | null>(null);
  const [editForm, setEditForm] = useState({
    lifecycle_status: '',
    server_id: '',
    domain_notes: '',
    domain_registrar: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Bulk edit modal
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    lifecycle_status: '',
    server_id: '',
  });
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const fetchDomains = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/portfolio/domains');
      if (!res.ok) throw new Error('Errore nel caricamento');
      const data = await res.json();
      setDomains(data.domains || []);
      setServers(data.servers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  // Filtered domains
  const filteredDomains = domains.filter(d => {
    const matchesSearch = search === '' ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.url.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.lifecycle_status === statusFilter;
    const matchesServer = serverFilter === 'all' ||
      (serverFilter === 'none' ? !d.server_id : d.server_id === serverFilter);
    return matchesSearch && matchesStatus && matchesServer;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDomains.length / ITEMS_PER_PAGE);
  const paginatedDomains = filteredDomains.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedDomains.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedDomains.map(d => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Edit handlers
  const openEdit = (domain: DomainSite) => {
    setEditingDomain(domain);
    setEditForm({
      lifecycle_status: domain.lifecycle_status || 'active',
      server_id: domain.server_id || '',
      domain_notes: domain.domain_notes || '',
      domain_registrar: domain.domain_registrar || '',
    });
  };

  const saveEdit = async () => {
    if (!editingDomain) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/sites/${editingDomain.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lifecycle_status: editForm.lifecycle_status,
          server_id: editForm.server_id || null,
          domain_notes: editForm.domain_notes || null,
          domain_registrar: editForm.domain_registrar || null,
        }),
      });

      if (!res.ok) throw new Error('Errore nel salvataggio');

      toast.success('Dominio aggiornato');
      setEditingDomain(null);
      fetchDomains(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk edit handlers
  const openBulkEdit = () => {
    setBulkForm({ lifecycle_status: '', server_id: '' });
    setIsBulkEditOpen(true);
  };

  const saveBulkEdit = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkSaving(true);

    try {
      const updates: Record<string, unknown> = {};
      if (bulkForm.lifecycle_status) {
        updates.lifecycle_status = bulkForm.lifecycle_status;
      }
      if (bulkForm.server_id) {
        updates.server_id = bulkForm.server_id === 'none' ? null : bulkForm.server_id;
      }

      if (Object.keys(updates).length === 0) {
        toast.error('Seleziona almeno un campo da modificare');
        return;
      }

      const res = await fetch('/api/sites/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          updates,
        }),
      });

      if (!res.ok) throw new Error('Errore nel salvataggio');

      const data = await res.json();
      toast.success(`${data.updated} domini aggiornati`);
      setIsBulkEditOpen(false);
      setSelectedIds(new Set());
      fetchDomains(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setIsBulkSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT');
  };

  const getDaysUntilExpiry = (dateStr: string | null) => {
    if (!dateStr) return null;
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => fetchDomains()}>Riprova</Button>
      </div>
    );
  }

  const statusOptions = getLifecycleStatusOptions();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/portfolio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gestione Domini</h1>
            <p className="text-sm text-muted-foreground">
              {filteredDomains.length} domini {statusFilter !== 'all' && `(filtrati)`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button onClick={openBulkEdit}>
              <CheckSquare className="h-4 w-4 mr-2" />
              Modifica {selectedIds.size} selezionati
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => fetchDomains(true)}
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

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca dominio..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {statusOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={serverFilter} onValueChange={(v) => { setServerFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <Server className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Server" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i server</SelectItem>
            <SelectItem value="none">Senza server</SelectItem>
            {servers.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <ScrollArea className="h-[calc(100vh-320px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === paginatedDomains.length && paginatedDomains.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Dominio</TableHead>
                <TableHead className="hidden md:table-cell">Stato</TableHead>
                <TableHead className="hidden lg:table-cell">Server</TableHead>
                <TableHead className="hidden xl:table-cell">Scadenza</TableHead>
                <TableHead className="hidden xl:table-cell">Note</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDomains.map(domain => {
                const statusConfig = getLifecycleStatusConfig(domain.lifecycle_status);
                const daysUntilExpiry = getDaysUntilExpiry(domain.domain_expires_at);
                const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30;

                return (
                  <TableRow key={domain.id} className={selectedIds.has(domain.id) ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(domain.id)}
                        onCheckedChange={() => toggleSelect(domain.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{domain.name}</span>
                        <a
                          href={domain.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          {domain.url.replace('https://', '')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {/* Mobile status */}
                        <div className="flex items-center gap-2 md:hidden mt-1">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </Badge>
                          {domain.server_name && (
                            <Badge variant="outline" className="text-xs">
                              {domain.server_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant="secondary"
                        className={statusConfig.color}
                      >
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {domain.server_name ? (
                        <Badge variant="outline">{domain.server_name}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {domain.domain_expires_at ? (
                        <div className="flex items-center gap-1">
                          {isExpiringSoon && (
                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                          )}
                          <span className={isExpiringSoon ? 'text-yellow-600 font-medium' : ''}>
                            {formatDate(domain.domain_expires_at)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell max-w-48">
                      <span className="text-sm text-muted-foreground truncate block">
                        {domain.domain_notes || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(domain)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/sites/${domain.id}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Dettagli Sito
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <a href={domain.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Apri Sito
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedDomains.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nessun dominio trovato
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {page} di {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingDomain} onOpenChange={(open) => !open && setEditingDomain(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Dominio</DialogTitle>
            <DialogDescription>
              {editingDomain?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Stato Ciclo di Vita</Label>
              <Select
                value={editForm.lifecycle_status}
                onValueChange={(v) => setEditForm(f => ({ ...f, lifecycle_status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Server</Label>
              <Select
                value={editForm.server_id || 'none'}
                onValueChange={(v) => setEditForm(f => ({ ...f, server_id: v === 'none' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessun server</SelectItem>
                  {servers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Registrar</Label>
              <Input
                value={editForm.domain_registrar}
                onChange={(e) => setEditForm(f => ({ ...f, domain_registrar: e.target.value }))}
                placeholder="es. Register.it, Aruba..."
              />
            </div>
            <div className="space-y-2">
              <Label>Note / Cosa fa questo sito</Label>
              <Textarea
                value={editForm.domain_notes}
                onChange={(e) => setEditForm(f => ({ ...f, domain_notes: e.target.value }))}
                placeholder="Descrivi cosa fa questo sito, azioni pianificate, etc."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDomain(null)}>
              Annulla
            </Button>
            <Button onClick={saveEdit} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Multipla</DialogTitle>
            <DialogDescription>
              Modifica {selectedIds.size} domini selezionati
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Stato Ciclo di Vita</Label>
              <Select
                value={bulkForm.lifecycle_status}
                onValueChange={(v) => setBulkForm(f => ({ ...f, lifecycle_status: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Non modificare" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Non modificare</SelectItem>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Server</Label>
              <Select
                value={bulkForm.server_id}
                onValueChange={(v) => setBulkForm(f => ({ ...f, server_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Non modificare" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Non modificare</SelectItem>
                  <SelectItem value="none">Rimuovi server</SelectItem>
                  {servers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>
              Annulla
            </Button>
            <Button onClick={saveBulkEdit} disabled={isBulkSaving}>
              {isBulkSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Applica a {selectedIds.size} domini
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

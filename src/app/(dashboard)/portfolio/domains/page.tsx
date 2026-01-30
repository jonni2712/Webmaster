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
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  MoreHorizontal,
  Edit,
  ExternalLink,
  Server,
  CheckSquare,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Building2,
  Globe,
  Star,
  Languages,
  LayoutGrid,
  Copy,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  LIFECYCLE_STATUS_CONFIG,
  getLifecycleStatusConfig,
  getLifecycleStatusOptions,
  DOMAIN_RELATION_CONFIG,
  getDomainRelationConfig,
  getWeglotLanguageLabel,
  WEGLOT_LANGUAGES,
  type DomainRelationType,
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
  // Redirect fields
  is_redirect_source: boolean;
  redirect_url: string | null;
  redirect_type: string | null;
  // Brand fields
  brand_id: string | null;
  brand_name: string | null;
  is_primary_for_brand: boolean;
  domain_relation: DomainRelationType | null;
  weglot_language_code: string | null;
  parent_site_id: string | null;
}

interface ServerOption {
  id: string;
  name: string;
}

interface BrandOption {
  id: string;
  name: string;
}

// Icon mapping for domain relation
const RelationIcon = ({ relation, size = 'sm' }: { relation: DomainRelationType | null; size?: 'sm' | 'xs' }) => {
  const className = size === 'sm' ? 'h-3.5 w-3.5' : 'h-3 w-3';
  switch (relation) {
    case 'primary':
      return <Star className={`${className} text-yellow-500 fill-yellow-500`} />;
    case 'redirect':
      return <ArrowRight className={`${className} text-blue-500`} />;
    case 'weglot_language':
      return <Languages className={`${className} text-purple-500`} />;
    case 'wordpress_subsite':
      return <LayoutGrid className={`${className} text-indigo-500`} />;
    case 'alias':
      return <Copy className={`${className} text-gray-500`} />;
    default:
      return <Globe className={`${className} text-green-500`} />;
  }
};

const ITEMS_PER_PAGE = 50;

export default function DomainsPage() {
  const [domains, setDomains] = useState<DomainSite[]>([]);
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serverFilter, setServerFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [relationFilter, setRelationFilter] = useState<string>('all');
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
    is_redirect_source: false,
    redirect_url: '',
    redirect_type: '301',
    brand_id: '',
    domain_relation: 'standalone' as DomainRelationType,
    weglot_language_code: '',
    parent_site_id: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Bulk edit modal
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    lifecycle_status: '',
    server_id: '',
    brand_id: '',
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
      setBrands(data.brands || []);
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
      d.url.toLowerCase().includes(search.toLowerCase()) ||
      (d.brand_name && d.brand_name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || d.lifecycle_status === statusFilter;
    const matchesServer = serverFilter === 'all' ||
      (serverFilter === 'none' ? !d.server_id : d.server_id === serverFilter);
    const matchesBrand = brandFilter === 'all' ||
      (brandFilter === 'none' ? !d.brand_id : d.brand_id === brandFilter);
    const matchesRelation = relationFilter === 'all' ||
      (relationFilter === 'none' ? !d.domain_relation || d.domain_relation === 'standalone' : d.domain_relation === relationFilter);
    return matchesSearch && matchesStatus && matchesServer && matchesBrand && matchesRelation;
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

  // Get domains in same brand for parent selection
  const getDomainsInSameBrand = (brandId: string | null, excludeId: string) => {
    if (!brandId) return [];
    return domains.filter(d => d.brand_id === brandId && d.id !== excludeId);
  };

  // Edit handlers
  const openEdit = (domain: DomainSite) => {
    setEditingDomain(domain);
    setEditForm({
      lifecycle_status: domain.lifecycle_status || 'active',
      server_id: domain.server_id || '',
      domain_notes: domain.domain_notes || '',
      domain_registrar: domain.domain_registrar || '',
      is_redirect_source: domain.is_redirect_source || false,
      redirect_url: domain.redirect_url || '',
      redirect_type: domain.redirect_type || '301',
      brand_id: domain.brand_id || '',
      domain_relation: domain.domain_relation || 'standalone',
      weglot_language_code: domain.weglot_language_code || '',
      parent_site_id: domain.parent_site_id || '',
    });
  };

  const saveEdit = async () => {
    if (!editingDomain) return;
    setIsSaving(true);

    try {
      // Prepare update data
      const updateData: Record<string, unknown> = {
        lifecycle_status: editForm.lifecycle_status,
        server_id: editForm.server_id || null,
        domain_notes: editForm.domain_notes || null,
        domain_registrar: editForm.domain_registrar || null,
        brand_id: editForm.brand_id || null,
        domain_relation: editForm.domain_relation,
      };

      // Handle relation-specific fields
      if (editForm.domain_relation === 'redirect') {
        updateData.is_redirect_source = true;
        updateData.redirect_url = editForm.redirect_url || null;
        updateData.redirect_type = editForm.redirect_type || '301';
        updateData.weglot_language_code = null;
        updateData.parent_site_id = null;
      } else if (editForm.domain_relation === 'weglot_language') {
        updateData.weglot_language_code = editForm.weglot_language_code || null;
        updateData.parent_site_id = editForm.parent_site_id || null;
        updateData.is_redirect_source = false;
        updateData.redirect_url = null;
        updateData.redirect_type = null;
      } else if (editForm.domain_relation === 'wordpress_subsite') {
        updateData.parent_site_id = editForm.parent_site_id || null;
        updateData.weglot_language_code = null;
        updateData.is_redirect_source = false;
        updateData.redirect_url = null;
        updateData.redirect_type = null;
      } else {
        updateData.is_redirect_source = false;
        updateData.redirect_url = null;
        updateData.redirect_type = null;
        updateData.weglot_language_code = null;
        updateData.parent_site_id = null;
      }

      const res = await fetch(`/api/sites/${editingDomain.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
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
    setBulkForm({ lifecycle_status: '', server_id: '', brand_id: '' });
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
      if (bulkForm.brand_id) {
        updates.brand_id = bulkForm.brand_id === 'none' ? null : bulkForm.brand_id;
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

  const getDomainDisplay = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
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
              {filteredDomains.length} domini {(statusFilter !== 'all' || brandFilter !== 'all' || relationFilter !== 'all') && `(filtrati)`}
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

      {/* Filters - Row 1 */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca dominio o brand..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40">
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
      </div>

      {/* Filters - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select value={brandFilter} onValueChange={(v) => { setBrandFilter(v); setPage(1); }}>
          <SelectTrigger>
            <Building2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i brand</SelectItem>
            <SelectItem value="none">Senza brand</SelectItem>
            {brands.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={relationFilter} onValueChange={(v) => { setRelationFilter(v); setPage(1); }}>
          <SelectTrigger>
            <LinkIcon className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo Relazione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le relazioni</SelectItem>
            <SelectItem value="none">Senza relazione</SelectItem>
            {DOMAIN_RELATION_CONFIG.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={serverFilter} onValueChange={(v) => { setServerFilter(v); setPage(1); }}>
          <SelectTrigger>
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
        <ScrollArea className="h-[calc(100vh-380px)]">
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
                <TableHead className="hidden md:table-cell">Brand</TableHead>
                <TableHead className="hidden lg:table-cell">Relazione</TableHead>
                <TableHead className="hidden md:table-cell">Stato</TableHead>
                <TableHead className="hidden xl:table-cell">Server</TableHead>
                <TableHead className="hidden xl:table-cell">Scadenza</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDomains.map(domain => {
                const statusConfig = getLifecycleStatusConfig(domain.lifecycle_status as any);
                const daysUntilExpiry = getDaysUntilExpiry(domain.domain_expires_at);
                const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30;
                const relationConfig = getDomainRelationConfig(domain.domain_relation);

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
                        <div className="flex items-center gap-2">
                          <RelationIcon relation={domain.domain_relation} size="xs" />
                          <span className="font-medium">{domain.name || getDomainDisplay(domain.url)}</span>
                          {domain.is_primary_for_brand && (
                            <Badge variant="secondary" className="text-[10px] px-1 bg-yellow-100 text-yellow-700">
                              Principale
                            </Badge>
                          )}
                        </div>
                        <a
                          href={domain.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          {getDomainDisplay(domain.url)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {/* Mobile info */}
                        <div className="flex flex-wrap items-center gap-1.5 md:hidden mt-1">
                          {domain.brand_name && (
                            <Badge variant="outline" className="text-xs">
                              <Building2 className="h-3 w-3 mr-1" />
                              {domain.brand_name}
                            </Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className={`text-xs ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {domain.brand_name ? (
                        <Badge variant="outline" className="font-normal">
                          <Building2 className="h-3 w-3 mr-1.5" />
                          {domain.brand_name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <RelationIcon relation={domain.domain_relation} />
                          <span className="text-sm">{relationConfig.label}</span>
                        </div>
                        {domain.domain_relation === 'weglot_language' && domain.weglot_language_code && (
                          <span className="text-xs text-muted-foreground pl-5">
                            {getWeglotLanguageLabel(domain.weglot_language_code)}
                          </span>
                        )}
                        {domain.domain_relation === 'redirect' && domain.redirect_url && (
                          <span className="text-xs text-muted-foreground pl-5 truncate max-w-32" title={domain.redirect_url}>
                            → {domain.redirect_url.replace(/^https?:\/\//, '').split('/')[0]}
                          </span>
                        )}
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
                    <TableCell className="hidden xl:table-cell">
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Dominio</DialogTitle>
            <DialogDescription>
              {editingDomain && getDomainDisplay(editingDomain.url)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Brand */}
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select
                value={editForm.brand_id || 'none'}
                onValueChange={(v) => setEditForm(f => ({ ...f, brand_id: v === 'none' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona brand..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessun brand</SelectItem>
                  {brands.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Domain Relation */}
            <div className="space-y-2">
              <Label>Tipo Relazione</Label>
              <Select
                value={editForm.domain_relation}
                onValueChange={(v) => setEditForm(f => ({ ...f, domain_relation: v as DomainRelationType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOMAIN_RELATION_CONFIG.filter(c => c.value !== 'primary').map((config) => (
                    <SelectItem key={config.value} value={config.value}>
                      <div className="flex items-center gap-2">
                        <RelationIcon relation={config.value} />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getDomainRelationConfig(editForm.domain_relation).description}
              </p>
            </div>

            {/* Weglot Language */}
            {editForm.domain_relation === 'weglot_language' && (
              <div className="space-y-2">
                <Label>Lingua Weglot</Label>
                <Select
                  value={editForm.weglot_language_code || 'none'}
                  onValueChange={(v) => setEditForm(f => ({ ...f, weglot_language_code: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona lingua..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seleziona lingua...</SelectItem>
                    {WEGLOT_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.label} ({lang.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Redirect URL */}
            {editForm.domain_relation === 'redirect' && (
              <>
                <div className="space-y-2">
                  <Label>URL Destinazione</Label>
                  <Input
                    value={editForm.redirect_url}
                    onChange={(e) => setEditForm(f => ({ ...f, redirect_url: e.target.value }))}
                    placeholder="https://esempio.it"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo Redirect</Label>
                  <Select
                    value={editForm.redirect_type}
                    onValueChange={(v) => setEditForm(f => ({ ...f, redirect_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="301">301 - Permanente</SelectItem>
                      <SelectItem value="302">302 - Temporaneo</SelectItem>
                      <SelectItem value="307">307 - Temporaneo (HTTP/1.1)</SelectItem>
                      <SelectItem value="308">308 - Permanente (HTTP/1.1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Parent Site */}
            {(editForm.domain_relation === 'wordpress_subsite' || editForm.domain_relation === 'weglot_language') &&
              editForm.brand_id && (
                <div className="space-y-2">
                  <Label>Sito Padre</Label>
                  <Select
                    value={editForm.parent_site_id || 'none'}
                    onValueChange={(v) => setEditForm(f => ({ ...f, parent_site_id: v === 'none' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona sito padre..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessun sito padre</SelectItem>
                      {getDomainsInSameBrand(editForm.brand_id, editingDomain?.id || '').map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {getDomainDisplay(d.url)}
                          {d.is_primary_for_brand && ' (Principale)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            <div className="border-t pt-4 space-y-4">
              {/* Lifecycle Status */}
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

              {/* Server */}
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

              {/* Registrar */}
              <div className="space-y-2">
                <Label>Registrar</Label>
                <Input
                  value={editForm.domain_registrar}
                  onChange={(e) => setEditForm(f => ({ ...f, domain_registrar: e.target.value }))}
                  placeholder="es. Register.it, Aruba..."
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea
                  value={editForm.domain_notes}
                  onChange={(e) => setEditForm(f => ({ ...f, domain_notes: e.target.value }))}
                  placeholder="Note sul dominio..."
                  rows={2}
                />
              </div>
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
              <Label>Brand</Label>
              <Select
                value={bulkForm.brand_id}
                onValueChange={(v) => setBulkForm(f => ({ ...f, brand_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Non modificare" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Non modificare</SelectItem>
                  <SelectItem value="none">Rimuovi brand</SelectItem>
                  {brands.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Plus,
  RefreshCw,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  Globe,
  ArrowRight,
  Unlink,
  Building2,
  Star,
  Search,
  Languages,
  LayoutGrid,
  Copy,
  Settings2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  DOMAIN_RELATION_CONFIG,
  WEGLOT_LANGUAGES,
  getDomainRelationConfig,
  getWeglotLanguageLabel,
  type DomainRelationType,
} from '@/lib/constants/lifecycle-status';

interface Brand {
  id: string;
  name: string;
  description: string | null;
  primary_domain_id: string | null;
  client_id: string | null;
  client_name?: string;
  is_active: boolean;
  created_at: string;
}

interface DomainSite {
  id: string;
  name: string;
  url: string;
  lifecycle_status: string;
  is_redirect_source: boolean;
  redirect_url: string | null;
  redirect_type: string | null;
  brand_id: string | null;
  is_primary_for_brand: boolean;
  domain_relation: DomainRelationType | null;
  weglot_language_code: string | null;
  parent_site_id: string | null;
}

interface BrandWithDomains extends Brand {
  domains: DomainSite[];
  primaryDomain: DomainSite | null;
}

interface Client {
  id: string;
  name: string;
}

// Icon mapping for domain relation
const RelationIcon = ({ relation }: { relation: DomainRelationType | null }) => {
  switch (relation) {
    case 'primary':
      return <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />;
    case 'redirect':
      return <ArrowRight className="h-3.5 w-3.5 text-blue-500" />;
    case 'weglot_language':
      return <Languages className="h-3.5 w-3.5 text-purple-500" />;
    case 'wordpress_subsite':
      return <LayoutGrid className="h-3.5 w-3.5 text-indigo-500" />;
    case 'alias':
      return <Copy className="h-3.5 w-3.5 text-gray-500" />;
    default:
      return <Globe className="h-3.5 w-3.5 text-green-500" />;
  }
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandWithDomains[]>([]);
  const [unassignedDomains, setUnassignedDomains] = useState<DomainSite[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search
  const [search, setSearch] = useState('');

  // Create brand modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: '', description: '', client_id: '' });
  const [isCreating, setIsCreating] = useState(false);

  // Edit brand modal
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', client_id: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Add domains modal
  const [addToBrandId, setAddToBrandId] = useState<string | null>(null);
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Edit domain relation modal
  const [editingDomain, setEditingDomain] = useState<DomainSite | null>(null);
  const [editingDomainBrand, setEditingDomainBrand] = useState<BrandWithDomains | null>(null);
  const [domainRelationForm, setDomainRelationForm] = useState({
    domain_relation: 'standalone' as DomainRelationType,
    weglot_language_code: '',
    redirect_url: '',
    redirect_type: '301',
    parent_site_id: '',
  });
  const [isSavingRelation, setIsSavingRelation] = useState(false);

  const fetchData = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await fetch('/api/portfolio/brands');
      if (!res.ok) throw new Error('Errore nel caricamento');
      const data = await res.json();
      setBrands(data.brands || []);
      setUnassignedDomains(data.unassigned || []);
      setClients(data.clients || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateBrand = async () => {
    if (!newBrand.name.trim()) {
      toast.error('Inserisci il nome del brand');
      return;
    }
    setIsCreating(true);

    try {
      const res = await fetch('/api/portfolio/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBrand,
          client_id: newBrand.client_id === 'none' ? null : newBrand.client_id || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore nella creazione');
      }

      toast.success('Brand creato');
      setIsCreateOpen(false);
      setNewBrand({ name: '', description: '', client_id: '' });
      fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nella creazione');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveBrand = async () => {
    if (!editingBrand) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/portfolio/brands/${editingBrand.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          client_id: editForm.client_id === 'none' ? null : editForm.client_id || null,
        }),
      });

      if (!res.ok) throw new Error('Errore nel salvataggio');

      toast.success('Brand aggiornato');
      setEditingBrand(null);
      fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm('Vuoi eliminare questo brand? I domini verranno scollegati ma non eliminati.')) {
      return;
    }

    try {
      const res = await fetch(`/api/portfolio/brands/${brandId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Errore nell\'eliminazione');

      toast.success('Brand eliminato');
      fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nell\'eliminazione');
    }
  };

  const handleAddDomains = async () => {
    if (!addToBrandId || selectedDomainIds.length === 0) {
      toast.error('Seleziona almeno un dominio');
      return;
    }
    setIsAdding(true);

    try {
      const res = await fetch('/api/portfolio/brands/add-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: addToBrandId,
          domainIds: selectedDomainIds,
        }),
      });

      if (!res.ok) throw new Error('Errore nell\'aggiunta');

      toast.success(`${selectedDomainIds.length} domini aggiunti`);
      setAddToBrandId(null);
      setSelectedDomainIds([]);
      fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nell\'aggiunta');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveDomain = async (domainId: string) => {
    try {
      const res = await fetch('/api/portfolio/brands/remove-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });

      if (!res.ok) throw new Error('Errore nella rimozione');

      toast.success('Dominio rimosso dal brand');
      fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nella rimozione');
    }
  };

  const handleSetPrimary = async (brandId: string, domainId: string) => {
    try {
      const res = await fetch('/api/portfolio/brands/set-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, domainId }),
      });

      if (!res.ok) throw new Error('Errore nell\'impostazione');

      const data = await res.json();
      toast.success(data.isPrimary ? 'Dominio aggiunto ai principali' : 'Dominio rimosso dai principali');
      fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nell\'impostazione');
    }
  };

  const openEditDomainRelation = (domain: DomainSite, brand: BrandWithDomains) => {
    setEditingDomain(domain);
    setEditingDomainBrand(brand);
    setDomainRelationForm({
      domain_relation: domain.domain_relation || 'standalone',
      weglot_language_code: domain.weglot_language_code || '',
      redirect_url: domain.redirect_url || '',
      redirect_type: domain.redirect_type || '301',
      parent_site_id: domain.parent_site_id || '',
    });
  };

  const handleSaveDomainRelation = async () => {
    if (!editingDomain) return;
    setIsSavingRelation(true);

    try {
      const res = await fetch('/api/portfolio/brands/update-domain-relation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: editingDomain.id,
          ...domainRelationForm,
          parent_site_id: domainRelationForm.parent_site_id || null,
          weglot_language_code: domainRelationForm.weglot_language_code || null,
          redirect_url: domainRelationForm.redirect_url || null,
        }),
      });

      if (!res.ok) throw new Error('Errore nel salvataggio');

      toast.success('Relazione dominio aggiornata');
      setEditingDomain(null);
      setEditingDomainBrand(null);
      fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setIsSavingRelation(false);
    }
  };

  const getDomainDisplay = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // Group domains by relation type
  const groupDomainsByRelation = (domains: DomainSite[]) => {
    const primaries = domains.filter(d => d.is_primary_for_brand);
    const redirects = domains.filter(d => d.domain_relation === 'redirect' && !d.is_primary_for_brand);
    const weglot = domains.filter(d => d.domain_relation === 'weglot_language' && !d.is_primary_for_brand);
    const subsites = domains.filter(d => d.domain_relation === 'wordpress_subsite' && !d.is_primary_for_brand);
    const aliases = domains.filter(d => d.domain_relation === 'alias' && !d.is_primary_for_brand);
    const others = domains.filter(d =>
      !d.is_primary_for_brand &&
      !['redirect', 'weglot_language', 'wordpress_subsite', 'alias'].includes(d.domain_relation || '')
    );

    return { primaries, redirects, weglot, subsites, aliases, others };
  };

  // Filter brands and domains based on search
  const filteredBrands = useMemo(() => {
    if (!search.trim()) return brands;

    const searchLower = search.toLowerCase();
    return brands.map(brand => {
      const brandMatches = brand.name.toLowerCase().includes(searchLower);
      const matchingDomains = brand.domains.filter(d =>
        getDomainDisplay(d.url).toLowerCase().includes(searchLower) ||
        d.name.toLowerCase().includes(searchLower)
      );

      if (brandMatches || matchingDomains.length > 0) {
        return {
          ...brand,
          domains: brandMatches ? brand.domains : matchingDomains,
        };
      }
      return null;
    }).filter(Boolean) as BrandWithDomains[];
  }, [brands, search]);

  const filteredUnassigned = useMemo(() => {
    if (!search.trim()) return unassignedDomains;
    const searchLower = search.toLowerCase();
    return unassignedDomains.filter(d =>
      getDomainDisplay(d.url).toLowerCase().includes(searchLower) ||
      d.name.toLowerCase().includes(searchLower)
    );
  }, [unassignedDomains, search]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/portfolio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Brand & Zone Domini</h1>
            <p className="text-sm text-muted-foreground">
              {brands.length} brand, {unassignedDomains.length} domini non assegnati
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Brand
          </Button>
          <Button
            variant="outline"
            size="icon"
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

      {/* Legend */}
      <div className="flex flex-wrap gap-3 p-3 bg-muted/50 rounded-lg text-xs">
        {DOMAIN_RELATION_CONFIG.map((config) => (
          <div key={config.value} className="flex items-center gap-1.5">
            <RelationIcon relation={config.value} />
            <span className="text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca domini o brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {search && (
        <p className="text-sm text-muted-foreground">
          {filteredBrands.length} brand e {filteredUnassigned.length} domini trovati per "{search}"
        </p>
      )}

      {/* Brands Grid */}
      {filteredBrands.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredBrands.map((brand) => {
            const grouped = groupDomainsByRelation(brand.domains);

            return (
              <Card key={brand.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-base">{brand.name}</CardTitle>
                        {brand.client_name && (
                          <CardDescription className="text-xs">
                            Cliente: {brand.client_name}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingBrand(brand);
                          setEditForm({
                            name: brand.name,
                            description: brand.description || '',
                            client_id: brand.client_id || 'none',
                          });
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifica Brand
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAddToBrandId(brand.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Aggiungi Domini
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteBrand(brand.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Elimina Brand
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {brand.description && (
                    <p className="text-xs text-muted-foreground mt-1">{brand.description}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {/* Primary Domains Section */}
                  {grouped.primaries.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        <p className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
                          {grouped.primaries.length === 1 ? 'Dominio Principale' : `Domini Principali (${grouped.primaries.length})`}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        {grouped.primaries.map((domain) => (
                          <div
                            key={domain.id}
                            className="group flex items-center gap-2 p-2.5 rounded-lg border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-700 hover:shadow-md transition-shadow"
                          >
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            <a
                              href={domain.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium flex-1 truncate hover:text-primary transition-colors"
                            >
                              {getDomainDisplay(domain.url)}
                            </a>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => openEditDomainRelation(domain, brand)}
                                title="Configura"
                              >
                                <Settings2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-yellow-600 hover:text-yellow-700"
                                onClick={() => handleSetPrimary(brand.id, domain.id)}
                                title="Rimuovi da principali"
                              >
                                <Star className="h-3 w-3 fill-current" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Connected Domains Section */}
                  {(grouped.weglot.length > 0 || grouped.redirects.length > 0 || grouped.subsites.length > 0 || grouped.aliases.length > 0 || grouped.others.length > 0) && (
                    <div className="space-y-3">
                      {/* Weglot Languages */}
                      {grouped.weglot.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Languages className="h-3.5 w-3.5 text-purple-500" />
                            <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                              Lingue Weglot ({grouped.weglot.length})
                            </p>
                          </div>
                          <div className="pl-2 border-l-2 border-purple-200 dark:border-purple-800 space-y-1">
                            {grouped.weglot.map((domain) => (
                              <DomainRow
                                key={domain.id}
                                domain={domain}
                                brand={brand}
                                onEdit={() => openEditDomainRelation(domain, brand)}
                                onSetPrimary={() => handleSetPrimary(brand.id, domain.id)}
                                onRemove={() => handleRemoveDomain(domain.id)}
                                getDomainDisplay={getDomainDisplay}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Redirects */}
                      {grouped.redirects.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
                            <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                              Redirect ({grouped.redirects.length})
                            </p>
                          </div>
                          <div className="pl-2 border-l-2 border-blue-200 dark:border-blue-800 space-y-1">
                            {grouped.redirects.map((domain) => (
                              <DomainRow
                                key={domain.id}
                                domain={domain}
                                brand={brand}
                                onEdit={() => openEditDomainRelation(domain, brand)}
                                onSetPrimary={() => handleSetPrimary(brand.id, domain.id)}
                                onRemove={() => handleRemoveDomain(domain.id)}
                                getDomainDisplay={getDomainDisplay}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* WordPress Subsites */}
                      {grouped.subsites.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <LayoutGrid className="h-3.5 w-3.5 text-indigo-500" />
                            <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                              WordPress Subsites ({grouped.subsites.length})
                            </p>
                          </div>
                          <div className="pl-2 border-l-2 border-indigo-200 dark:border-indigo-800 space-y-1">
                            {grouped.subsites.map((domain) => (
                              <DomainRow
                                key={domain.id}
                                domain={domain}
                                brand={brand}
                                onEdit={() => openEditDomainRelation(domain, brand)}
                                onSetPrimary={() => handleSetPrimary(brand.id, domain.id)}
                                onRemove={() => handleRemoveDomain(domain.id)}
                                getDomainDisplay={getDomainDisplay}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Aliases */}
                      {grouped.aliases.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Copy className="h-3.5 w-3.5 text-gray-500" />
                            <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                              Alias ({grouped.aliases.length})
                            </p>
                          </div>
                          <div className="pl-2 border-l-2 border-gray-200 dark:border-gray-700 space-y-1">
                            {grouped.aliases.map((domain) => (
                              <DomainRow
                                key={domain.id}
                                domain={domain}
                                brand={brand}
                                onEdit={() => openEditDomainRelation(domain, brand)}
                                onSetPrimary={() => handleSetPrimary(brand.id, domain.id)}
                                onRemove={() => handleRemoveDomain(domain.id)}
                                getDomainDisplay={getDomainDisplay}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Others (standalone) */}
                      {grouped.others.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-green-500" />
                            <p className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                              Altri Domini ({grouped.others.length})
                            </p>
                          </div>
                          <div className="pl-2 border-l-2 border-green-200 dark:border-green-800 space-y-1">
                            {grouped.others.map((domain) => (
                              <DomainRow
                                key={domain.id}
                                domain={domain}
                                brand={brand}
                                onEdit={() => openEditDomainRelation(domain, brand)}
                                onSetPrimary={() => handleSetPrimary(brand.id, domain.id)}
                                onRemove={() => handleRemoveDomain(domain.id)}
                                getDomainDisplay={getDomainDisplay}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {brand.domains.length === 0 && (
                    <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
                      <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Nessun dominio assegnato
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddToBrandId(brand.id)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Aggiungi Domini
                      </Button>
                    </div>
                  )}

                  {brand.domains.length > 0 && grouped.primaries.length === 0 && (
                    <div className="flex items-center gap-2 p-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <Star className="h-4 w-4 text-amber-500" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Clicca la stella per impostare uno o più domini principali
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nessun brand creato</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crea Primo Brand
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Unassigned Domains */}
      {filteredUnassigned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Domini Non Assegnati</CardTitle>
            <CardDescription>
              {filteredUnassigned.length} domini senza brand
              {search && unassignedDomains.length !== filteredUnassigned.length && (
                <> (su {unassignedDomains.length} totali)</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {filteredUnassigned.slice(0, 30).map((domain) => (
                <Badge key={domain.id} variant="outline" className="py-1.5">
                  <Globe className="h-3 w-3 mr-1.5" />
                  {getDomainDisplay(domain.url)}
                </Badge>
              ))}
              {filteredUnassigned.length > 30 && (
                <Badge variant="secondary">
                  +{filteredUnassigned.length - 30} altri
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Brand Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Brand</DialogTitle>
            <DialogDescription>
              Crea un brand per raggruppare domini correlati
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Brand *</Label>
              <Input
                value={newBrand.name}
                onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                placeholder="es. Mafra, ClienteXYZ..."
              />
            </div>
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea
                value={newBrand.description}
                onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
                placeholder="Descrizione del brand..."
                rows={2}
              />
            </div>
            {clients.length > 0 && (
              <div className="space-y-2">
                <Label>Cliente associato</Label>
                <Select
                  value={newBrand.client_id}
                  onValueChange={(v) => setNewBrand({ ...newBrand, client_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessun cliente</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreateBrand} disabled={isCreating || !newBrand.name.trim()}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crea Brand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Brand Dialog */}
      <Dialog open={!!editingBrand} onOpenChange={(open) => !open && setEditingBrand(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Brand</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Brand</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
              />
            </div>
            {clients.length > 0 && (
              <div className="space-y-2">
                <Label>Cliente associato</Label>
                <Select
                  value={editForm.client_id}
                  onValueChange={(v) => setEditForm({ ...editForm, client_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessun cliente</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBrand(null)}>
              Annulla
            </Button>
            <Button onClick={handleSaveBrand} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Domains Dialog */}
      <Dialog open={!!addToBrandId} onOpenChange={(open) => !open && setAddToBrandId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Aggiungi Domini al Brand</DialogTitle>
            <DialogDescription>
              Seleziona i domini da aggiungere
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {unassignedDomains.length > 0 ? (
              <ScrollArea className="h-64 rounded-md border p-2">
                <div className="space-y-1">
                  {unassignedDomains.map((domain) => (
                    <label
                      key={domain.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDomainIds.includes(domain.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDomainIds([...selectedDomainIds, domain.id]);
                          } else {
                            setSelectedDomainIds(selectedDomainIds.filter(id => id !== domain.id));
                          }
                        }}
                        className="rounded"
                      />
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{getDomainDisplay(domain.url)}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Tutti i domini sono già assegnati a un brand
              </p>
            )}
            {selectedDomainIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedDomainIds.length} domini selezionati
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToBrandId(null)}>
              Annulla
            </Button>
            <Button onClick={handleAddDomains} disabled={isAdding || selectedDomainIds.length === 0}>
              {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Domain Relation Dialog */}
      <Dialog open={!!editingDomain} onOpenChange={(open) => !open && setEditingDomain(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configura Dominio</DialogTitle>
            <DialogDescription>
              {editingDomain && getDomainDisplay(editingDomain.url)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo Relazione</Label>
              <Select
                value={domainRelationForm.domain_relation}
                onValueChange={(v) => setDomainRelationForm({
                  ...domainRelationForm,
                  domain_relation: v as DomainRelationType,
                })}
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
                {getDomainRelationConfig(domainRelationForm.domain_relation).description}
              </p>
            </div>

            {/* Weglot Language */}
            {domainRelationForm.domain_relation === 'weglot_language' && (
              <div className="space-y-2">
                <Label>Lingua</Label>
                <Select
                  value={domainRelationForm.weglot_language_code}
                  onValueChange={(v) => setDomainRelationForm({
                    ...domainRelationForm,
                    weglot_language_code: v === 'none' ? '' : v,
                  })}
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

            {/* Redirect */}
            {domainRelationForm.domain_relation === 'redirect' && (
              <>
                <div className="space-y-2">
                  <Label>URL Destinazione</Label>
                  <Input
                    value={domainRelationForm.redirect_url}
                    onChange={(e) => setDomainRelationForm({
                      ...domainRelationForm,
                      redirect_url: e.target.value,
                    })}
                    placeholder="https://esempio.it"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo Redirect</Label>
                  <Select
                    value={domainRelationForm.redirect_type}
                    onValueChange={(v) => setDomainRelationForm({
                      ...domainRelationForm,
                      redirect_type: v,
                    })}
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

            {/* WordPress Subsite / Parent */}
            {(domainRelationForm.domain_relation === 'wordpress_subsite' ||
              domainRelationForm.domain_relation === 'weglot_language') &&
              editingDomainBrand && (
                <div className="space-y-2">
                  <Label>Sito Padre</Label>
                  <Select
                    value={domainRelationForm.parent_site_id || 'none'}
                    onValueChange={(v) => setDomainRelationForm({
                      ...domainRelationForm,
                      parent_site_id: v === 'none' ? '' : v,
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona sito padre..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessun sito padre</SelectItem>
                      {editingDomainBrand.domains
                        .filter(d => d.id !== editingDomain?.id)
                        .map((domain) => (
                          <SelectItem key={domain.id} value={domain.id}>
                            {getDomainDisplay(domain.url)}
                            {domain.is_primary_for_brand && ' (Principale)'}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDomain(null)}>
              Annulla
            </Button>
            <Button onClick={handleSaveDomainRelation} disabled={isSavingRelation}>
              {isSavingRelation && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Domain Row Component
function DomainRow({
  domain,
  brand,
  onEdit,
  onSetPrimary,
  onRemove,
  getDomainDisplay,
}: {
  domain: DomainSite;
  brand: BrandWithDomains;
  onEdit: () => void;
  onSetPrimary: () => void;
  onRemove: () => void;
  getDomainDisplay: (url: string) => string;
}) {
  const relationConfig = getDomainRelationConfig(domain.domain_relation);

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md group hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <a
          href={domain.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm truncate block hover:text-primary transition-colors"
        >
          {getDomainDisplay(domain.url)}
        </a>
        <span className="text-[10px] text-muted-foreground">
          {domain.domain_relation === 'weglot_language' && domain.weglot_language_code
            ? getWeglotLanguageLabel(domain.weglot_language_code)
            : domain.domain_relation === 'redirect' && domain.redirect_url
            ? `→ ${getDomainDisplay(domain.redirect_url)}`
            : ''}
        </span>
      </div>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onEdit}
          title="Configura"
        >
          <Settings2 className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:text-yellow-600"
          onClick={onSetPrimary}
          title="Aggiungi ai principali"
        >
          <Star className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:text-red-600"
          onClick={onRemove}
          title="Rimuovi dal brand"
        >
          <Unlink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

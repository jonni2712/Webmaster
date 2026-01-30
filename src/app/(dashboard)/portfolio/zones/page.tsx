'use client';

import { useEffect, useState, useCallback } from 'react';
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
  ExternalLink,
  Trash2,
  Globe,
  ArrowRight,
  Link as LinkIcon,
  Unlink,
  Network,
  Building2,
  Star,
  StarOff,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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
}

interface BrandWithDomains extends Brand {
  domains: DomainSite[];
  primaryDomain: DomainSite | null;
}

interface Client {
  id: string;
  name: string;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandWithDomains[]>([]);
  const [unassignedDomains, setUnassignedDomains] = useState<DomainSite[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        body: JSON.stringify(newBrand),
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
        body: JSON.stringify(editForm),
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

      toast.success('Dominio principale impostato');
      fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nell\'impostazione');
    }
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

      {/* Brands Grid */}
      {brands.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {brands.map((brand) => (
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
                          client_id: brand.client_id || '',
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
              <CardContent className="pt-0">
                {/* Domains */}
                {brand.domains.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Domini ({brand.domains.length})
                    </p>
                    <ScrollArea className={brand.domains.length > 5 ? 'h-40' : ''}>
                      <div className="space-y-1.5">
                        {brand.domains.map((domain) => (
                          <div
                            key={domain.id}
                            className="flex items-center gap-2 p-2 rounded border bg-muted/30 group"
                          >
                            {domain.is_primary_for_brand ? (
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            ) : domain.is_redirect_source ? (
                              <ArrowRight className="h-3 w-3 text-blue-500 flex-shrink-0" />
                            ) : (
                              <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="text-sm flex-1 truncate">
                              {getDomainDisplay(domain.url)}
                            </span>
                            {domain.is_primary_for_brand && (
                              <Badge variant="secondary" className="text-[10px] px-1 bg-yellow-100 text-yellow-700">
                                Principale
                              </Badge>
                            )}
                            {domain.is_redirect_source && domain.redirect_type && (
                              <Badge variant="outline" className="text-[10px] px-1">
                                {domain.redirect_type}
                              </Badge>
                            )}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!domain.is_primary_for_brand && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleSetPrimary(brand.id, domain.id)}
                                  title="Imposta come principale"
                                >
                                  <Star className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemoveDomain(domain.id)}
                                title="Rimuovi dal brand"
                              >
                                <Unlink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      Nessun dominio assegnato
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddToBrandId(brand.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Aggiungi Domini
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
      {unassignedDomains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Domini Non Assegnati</CardTitle>
            <CardDescription>
              {unassignedDomains.length} domini senza brand
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unassignedDomains.slice(0, 30).map((domain) => (
                <Badge key={domain.id} variant="outline" className="py-1.5">
                  <Globe className="h-3 w-3 mr-1.5" />
                  {getDomainDisplay(domain.url)}
                </Badge>
              ))}
              {unassignedDomains.length > 30 && (
                <Badge variant="secondary">
                  +{unassignedDomains.length - 30} altri
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
                    <SelectItem value="">Nessun cliente</SelectItem>
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
                    <SelectItem value="">Nessun cliente</SelectItem>
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
    </div>
  );
}

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
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface DomainSite {
  id: string;
  name: string;
  url: string;
  lifecycle_status: string;
  is_redirect_source: boolean;
  redirect_url: string | null;
  redirect_type: string | null;
  primary_domain_id: string | null;
  zone_name: string | null;
}

interface DomainZone {
  primary: DomainSite;
  secondaryDomains: DomainSite[];
}

export default function ZonesPage() {
  const [domains, setDomains] = useState<DomainSite[]>([]);
  const [zones, setZones] = useState<DomainZone[]>([]);
  const [unassignedDomains, setUnassignedDomains] = useState<DomainSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Create zone modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [selectedPrimaryId, setSelectedPrimaryId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Add to zone modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addToZoneId, setAddToZoneId] = useState('');
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Edit zone modal
  const [editingZone, setEditingZone] = useState<DomainZone | null>(null);
  const [editZoneName, setEditZoneName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await fetch('/api/portfolio/zones');
      if (!res.ok) throw new Error('Errore nel caricamento');
      const data = await res.json();
      setDomains(data.domains || []);
      setZones(data.zones || []);
      setUnassignedDomains(data.unassigned || []);
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

  const handleCreateZone = async () => {
    if (!selectedPrimaryId) {
      toast.error('Seleziona un dominio principale');
      return;
    }
    setIsCreating(true);

    try {
      const res = await fetch('/api/portfolio/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryDomainId: selectedPrimaryId,
          zoneName: newZoneName || null,
        }),
      });

      if (!res.ok) throw new Error('Errore nella creazione');

      toast.success('Zona creata');
      setIsCreateOpen(false);
      setNewZoneName('');
      setSelectedPrimaryId('');
      fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nella creazione');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddToZone = async () => {
    if (!addToZoneId || selectedDomainIds.length === 0) {
      toast.error('Seleziona la zona e almeno un dominio');
      return;
    }
    setIsAdding(true);

    try {
      const res = await fetch('/api/portfolio/zones/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryDomainId: addToZoneId,
          domainIds: selectedDomainIds,
        }),
      });

      if (!res.ok) throw new Error('Errore nell\'aggiunta');

      toast.success(`${selectedDomainIds.length} domini aggiunti alla zona`);
      setIsAddOpen(false);
      setAddToZoneId('');
      setSelectedDomainIds([]);
      fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nell\'aggiunta');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveFromZone = async (domainId: string) => {
    try {
      const res = await fetch('/api/portfolio/zones/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });

      if (!res.ok) throw new Error('Errore nella rimozione');

      toast.success('Dominio rimosso dalla zona');
      fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nella rimozione');
    }
  };

  const handleSaveZone = async () => {
    if (!editingZone) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/sites/${editingZone.primary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_name: editZoneName || null,
        }),
      });

      if (!res.ok) throw new Error('Errore nel salvataggio');

      toast.success('Zona aggiornata');
      setEditingZone(null);
      fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('Vuoi eliminare questa zona? I domini verranno scollegati ma non eliminati.')) {
      return;
    }

    try {
      const res = await fetch('/api/portfolio/zones/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryDomainId: zoneId }),
      });

      if (!res.ok) throw new Error('Errore nell\'eliminazione');

      toast.success('Zona eliminata');
      fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nell\'eliminazione');
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
            <h1 className="text-2xl font-bold">Zone Domini</h1>
            <p className="text-sm text-muted-foreground">
              {zones.length} zone, {unassignedDomains.length} domini non assegnati
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Zona
          </Button>
          {unassignedDomains.length > 0 && zones.length > 0 && (
            <Button variant="outline" onClick={() => setIsAddOpen(true)}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Assegna Domini
            </Button>
          )}
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

      {/* Zones Grid */}
      {zones.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {zones.map((zone) => (
            <Card key={zone.primary.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">
                        {zone.primary.zone_name || getDomainDisplay(zone.primary.url)}
                      </CardTitle>
                      {zone.primary.zone_name && (
                        <CardDescription className="text-xs">
                          {getDomainDisplay(zone.primary.url)}
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
                        setEditingZone(zone);
                        setEditZoneName(zone.primary.zone_name || '');
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifica Nome
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={zone.primary.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Apri Sito
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteZone(zone.primary.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Elimina Zona
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Primary Domain */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 mb-3">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium flex-1 truncate">
                    {getDomainDisplay(zone.primary.url)}
                  </span>
                  <Badge variant="secondary" className="text-xs">Principale</Badge>
                </div>

                {/* Secondary Domains */}
                {zone.secondaryDomains.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Domini collegati ({zone.secondaryDomains.length})
                    </p>
                    <ScrollArea className={zone.secondaryDomains.length > 4 ? 'h-32' : ''}>
                      <div className="space-y-1.5">
                        {zone.secondaryDomains.map((domain) => (
                          <div
                            key={domain.id}
                            className="flex items-center gap-2 p-2 rounded border bg-muted/30 group"
                          >
                            {domain.is_redirect_source ? (
                              <ArrowRight className="h-3 w-3 text-blue-500 flex-shrink-0" />
                            ) : (
                              <LinkIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="text-sm flex-1 truncate">
                              {getDomainDisplay(domain.url)}
                            </span>
                            {domain.is_redirect_source && domain.redirect_type && (
                              <Badge variant="outline" className="text-[10px] px-1">
                                {domain.redirect_type}
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveFromZone(domain.id)}
                            >
                              <Unlink className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nessun dominio collegato
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Network className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nessuna zona creata</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crea Prima Zona
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
              {unassignedDomains.length} domini senza zona
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unassignedDomains.slice(0, 20).map((domain) => (
                <Badge key={domain.id} variant="outline" className="py-1.5">
                  <Globe className="h-3 w-3 mr-1.5" />
                  {getDomainDisplay(domain.url)}
                </Badge>
              ))}
              {unassignedDomains.length > 20 && (
                <Badge variant="secondary">
                  +{unassignedDomains.length - 20} altri
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Zone Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Zona Domini</DialogTitle>
            <DialogDescription>
              Seleziona il dominio principale della zona
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Zona (opzionale)</Label>
              <Input
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="es. Mafra, ClienteXYZ..."
              />
            </div>
            <div className="space-y-2">
              <Label>Dominio Principale</Label>
              <Select value={selectedPrimaryId} onValueChange={setSelectedPrimaryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona dominio..." />
                </SelectTrigger>
                <SelectContent>
                  {unassignedDomains.map((domain) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {getDomainDisplay(domain.url)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreateZone} disabled={isCreating || !selectedPrimaryId}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crea Zona
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Zone Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assegna Domini a Zona</DialogTitle>
            <DialogDescription>
              Seleziona la zona e i domini da aggiungere
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Zona di destinazione</Label>
              <Select value={addToZoneId} onValueChange={setAddToZoneId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona zona..." />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.primary.id} value={zone.primary.id}>
                      {zone.primary.zone_name || getDomainDisplay(zone.primary.url)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Domini da aggiungere</Label>
              <ScrollArea className="h-48 rounded-md border p-2">
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
                      <span className="text-sm">{getDomainDisplay(domain.url)}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
              {selectedDomainIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedDomainIds.length} domini selezionati
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleAddToZone} disabled={isAdding || !addToZoneId || selectedDomainIds.length === 0}>
              {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Zone Dialog */}
      <Dialog open={!!editingZone} onOpenChange={(open) => !open && setEditingZone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Zona</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Zona</Label>
              <Input
                value={editZoneName}
                onChange={(e) => setEditZoneName(e.target.value)}
                placeholder="es. Mafra, ClienteXYZ..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingZone(null)}>
              Annulla
            </Button>
            <Button onClick={handleSaveZone} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

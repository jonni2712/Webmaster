'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertCircle, Globe, ExternalLink } from 'lucide-react';
import type { TeamMember } from '@/types/database';

interface SiteAccess {
  id: string;
  name: string;
  url: string;
  hasAccess: boolean;
}

interface MemberSitesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onAccessUpdated: () => void;
}

export function MemberSitesDialog({
  open,
  onOpenChange,
  member,
  onAccessUpdated,
}: MemberSitesDialogProps) {
  const [sites, setSites] = useState<SiteAccess[]>([]);
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFullAccess, setHasFullAccess] = useState(false);

  useEffect(() => {
    if (open && member) {
      fetchSiteAccess();
    }
  }, [open, member]);

  async function fetchSiteAccess() {
    if (!member) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/team/members/${member.id}/sites`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Errore nel caricamento');
        return;
      }

      setSites(data.sites);
      setHasFullAccess(data.member.hasFullAccess);

      // Set initially selected sites
      const accessedIds = new Set(
        data.sites.filter((s: SiteAccess) => s.hasAccess).map((s: SiteAccess) => s.id)
      );
      setSelectedSites(accessedIds);
    } catch {
      setError('Errore di connessione');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!member) return;
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/team/members/${member.id}/sites`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteIds: [...selectedSites] }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Errore nel salvataggio');
        return;
      }

      onAccessUpdated();
      onOpenChange(false);
    } catch {
      setError('Errore di connessione');
    } finally {
      setIsSaving(false);
    }
  }

  function toggleSite(siteId: string) {
    const newSelected = new Set(selectedSites);
    if (newSelected.has(siteId)) {
      newSelected.delete(siteId);
    } else {
      newSelected.add(siteId);
    }
    setSelectedSites(newSelected);
  }

  function selectAll() {
    setSelectedSites(new Set(sites.map(s => s.id)));
  }

  function deselectAll() {
    setSelectedSites(new Set());
  }

  function handleClose() {
    if (!isSaving) {
      setError(null);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gestisci accesso siti</DialogTitle>
          <DialogDescription>
            Seleziona i siti a cui{' '}
            <strong>{member?.name || member?.email}</strong> puo accedere.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : hasFullAccess ? (
          <Alert>
            <AlertDescription>
              Questo utente ha il ruolo di amministratore o proprietario e ha
              automaticamente accesso a tutti i siti.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {selectedSites.size} di {sites.length} siti selezionati
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Seleziona tutti
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Deseleziona tutti
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-4 space-y-2">
                {sites.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nessun sito disponibile
                  </p>
                ) : (
                  sites.map(site => (
                    <label
                      key={site.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedSites.has(site.id)}
                        onCheckedChange={() => toggleSite(site.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{site.name}</p>
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {site.url}
                        </p>
                      </div>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            {hasFullAccess ? 'Chiudi' : 'Annulla'}
          </Button>
          {!hasFullAccess && (
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salva modifiche
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

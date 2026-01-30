'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { REDIRECT_TYPES } from '@/lib/constants/lifecycle-status';
import type { RedirectType } from '@/types/database';

interface Site {
  id: string;
  name: string;
  url: string;
}

interface RedirectConfigProps {
  isRedirectSource: boolean;
  redirectToSiteId: string | null;
  redirectType: RedirectType | null;
  currentSiteId?: string;
  onIsRedirectSourceChange: (value: boolean) => void;
  onRedirectToSiteIdChange: (value: string | null) => void;
  onRedirectTypeChange: (value: RedirectType | null) => void;
}

export function RedirectConfig({
  isRedirectSource,
  redirectToSiteId,
  redirectType,
  currentSiteId,
  onIsRedirectSourceChange,
  onRedirectToSiteIdChange,
  onRedirectTypeChange,
}: RedirectConfigProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/sites?limit=500');
      if (res.ok) {
        const data = await res.json();
        setSites(data.sites || []);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out current site from redirect targets
  const availableTargets = sites.filter(s => s.id !== currentSiteId);

  const selectedTarget = sites.find(s => s.id === redirectToSiteId);

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Questo dominio e un redirect</Label>
          <p className="text-xs text-muted-foreground">
            Abilita se questo dominio reindirizza ad un altro sito
          </p>
        </div>
        <Switch
          checked={isRedirectSource}
          onCheckedChange={(checked) => {
            onIsRedirectSourceChange(checked);
            if (!checked) {
              onRedirectToSiteIdChange(null);
              onRedirectTypeChange(null);
            }
          }}
        />
      </div>

      {isRedirectSource && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label className="text-sm">Sito di destinazione</Label>
            {isLoading ? (
              <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Caricamento siti...</span>
              </div>
            ) : (
              <Select
                value={redirectToSiteId || 'none'}
                onValueChange={(val) => onRedirectToSiteIdChange(val === 'none' ? null : val)}
              >
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue placeholder="Seleziona sito di destinazione">
                    {redirectToSiteId && selectedTarget ? (
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedTarget.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Seleziona sito</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuna destinazione</SelectItem>
                  {availableTargets.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      <div className="flex items-center gap-2">
                        <span>{site.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new URL(site.url).hostname}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedTarget && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm">
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>Redirect verso:</span>
              <a
                href={selectedTarget.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                {selectedTarget.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm">Tipo di redirect</Label>
            <Select
              value={redirectType || 'none'}
              onValueChange={(val) => onRedirectTypeChange(val === 'none' ? null : val as RedirectType)}
            >
              <SelectTrigger className="h-9 sm:h-10">
                <SelectValue placeholder="Seleziona tipo redirect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Non specificato</SelectItem>
                {REDIRECT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {type.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!redirectToSiteId && (
            <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                Seleziona un sito di destinazione per completare la configurazione del redirect
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}

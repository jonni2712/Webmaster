'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  RefreshCw,
  Package,
  Palette,
  Globe,
  AlertTriangle,
  ChevronRight,
  Download,
  CheckCircle,
} from 'lucide-react';
import type { WPUpdate, UpdateType } from '@/types/database';
import { toast } from 'sonner';

interface UpdatesListProps {
  siteId: string;
  onSync?: () => void;
}

interface UpdatesSummary {
  total: number;
  critical: number;
  byType: {
    core: number;
    plugin: number;
    theme: number;
  };
}

const updateTypeConfig: Record<UpdateType, { icon: React.ElementType; label: string; color: string }> = {
  core: { icon: Globe, label: 'WordPress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  plugin: { icon: Package, label: 'Plugin', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
  theme: { icon: Palette, label: 'Tema', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300' },
};

export function UpdatesList({ siteId, onSync }: UpdatesListProps) {
  const [updates, setUpdates] = useState<WPUpdate[]>([]);
  const [summary, setSummary] = useState<UpdatesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedUpdates, setSelectedUpdates] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<UpdateType | 'all'>('all');

  const fetchUpdates = async () => {
    try {
      const res = await fetch(`/api/sites/${siteId}/updates`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(data.updates || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [siteId]);

  const handleSync = async () => {
    setSyncing(true);
    toast.info('Sincronizzazione in corso...');
    try {
      const res = await fetch(`/api/sites/${siteId}/sync`, { method: 'POST' });
      if (res.ok) {
        toast.success('Sincronizzazione completata');
        await fetchUpdates();
        onSync?.();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Errore durante la sincronizzazione');
      }
    } catch (error) {
      toast.error('Errore durante la sincronizzazione');
    } finally {
      setSyncing(false);
    }
  };

  const toggleSelect = (updateId: string) => {
    const newSelected = new Set(selectedUpdates);
    if (newSelected.has(updateId)) {
      newSelected.delete(updateId);
    } else {
      newSelected.add(updateId);
    }
    setSelectedUpdates(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUpdates.size === filteredUpdates.length) {
      setSelectedUpdates(new Set());
    } else {
      setSelectedUpdates(new Set(filteredUpdates.map(u => u.id)));
    }
  };

  const selectCritical = () => {
    setSelectedUpdates(new Set(filteredUpdates.filter(u => u.is_critical).map(u => u.id)));
  };

  const filteredUpdates = filter === 'all'
    ? updates
    : updates.filter(u => u.update_type === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Tutti ({summary?.total || 0})
          </Button>
          <Button
            variant={filter === 'core' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('core')}
          >
            <Globe className="h-4 w-4 mr-1" />
            Core ({summary?.byType.core || 0})
          </Button>
          <Button
            variant={filter === 'plugin' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('plugin')}
          >
            <Package className="h-4 w-4 mr-1" />
            Plugin ({summary?.byType.plugin || 0})
          </Button>
          <Button
            variant={filter === 'theme' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('theme')}
          >
            <Palette className="h-4 w-4 mr-1" />
            Temi ({summary?.byType.theme || 0})
          </Button>
        </div>
        <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          Sincronizza
        </Button>
      </div>

      {/* Bulk Actions */}
      {filteredUpdates.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedUpdates.size === filteredUpdates.length && filteredUpdates.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedUpdates.size > 0
                ? `${selectedUpdates.size} selezionati`
                : 'Seleziona tutti'}
            </span>
          </div>
          {summary && summary.critical > 0 && (
            <Button variant="outline" size="sm" onClick={selectCritical}>
              <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" />
              Seleziona critici ({summary.critical})
            </Button>
          )}
          {selectedUpdates.size > 0 && (
            <Button size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Aggiorna selezionati ({selectedUpdates.size})
            </Button>
          )}
        </div>
      )}

      {/* Updates List */}
      {filteredUpdates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium">Tutto aggiornato!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Non ci sono aggiornamenti disponibili per questo sito.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Controlla aggiornamenti
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredUpdates.map((update) => {
            const config = updateTypeConfig[update.update_type];
            const Icon = config.icon;

            return (
              <Card
                key={update.id}
                className={`transition-all ${
                  update.is_critical
                    ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-950/20'
                    : ''
                }`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedUpdates.has(update.id)}
                      onCheckedChange={() => toggleSelect(update.id)}
                      className="mt-1"
                    />
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium truncate">{update.name}</span>
                        {update.is_critical && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Critico
                          </Badge>
                        )}
                        <Badge variant="secondary" className={config.color}>
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <span>{update.current_version}</span>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-foreground">{update.new_version}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" disabled>
                      <Download className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Aggiorna</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Note about remote updates */}
      {filteredUpdates.length > 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          L'aggiornamento da remoto sara' disponibile nella prossima versione.
          Per ora, puoi aggiornare direttamente dal pannello WordPress.
        </p>
      )}
    </div>
  );
}

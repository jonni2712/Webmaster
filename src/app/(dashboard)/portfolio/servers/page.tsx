'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ServerForm } from '@/components/servers/server-form';
import { ServerAgentTabs } from '@/components/servers/server-agent-tabs';
import {
  Plus,
  Server,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  Globe,
  ArrowLeft,
  Monitor,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { ServerWithStats } from '@/types/database';
import { PageHeader } from '@/components/layout/page-header';

export default function ServersPage() {
  const [servers, setServers] = useState<ServerWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerWithStats | null>(null);
  const [deletingServer, setDeletingServer] = useState<ServerWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingServer, setViewingServer] = useState<ServerWithStats | null>(null);

  const fetchServers = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await fetch('/api/servers?stats=true');
      if (res.ok) {
        const data = await res.json();
        setServers(data.servers || []);
      }
    } catch (error) {
      console.error('Error fetching servers:', error);
      toast.error('Errore nel caricamento dei server');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleDelete = async () => {
    if (!deletingServer) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/servers/${deletingServer.server_id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore durante l\'eliminazione');
      }

      toast.success('Server eliminato');
      setDeletingServer(null);
      fetchServers(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore durante l\'eliminazione');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    setIsCreateOpen(false);
    setEditingServer(null);
    fetchServers(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  const portfolioTabs = [
    { label: 'Dashboard', value: 'dashboard', href: '/portfolio' },
    { label: 'Domini', value: 'domini', href: '/portfolio/domains' },
    { label: 'Brand & Zone', value: 'zones', href: '/portfolio/zones' },
    { label: 'Server', value: 'servers', active: true, href: '/portfolio/servers' },
  ];

  return (
    <div>
      <PageHeader
        title="Portfolio"
        description="Gestisci i server per organizzare il portfolio domini"
        tabs={portfolioTabs}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-sm"
              onClick={() => fetchServers(true)}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-sm">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Nuovo Server
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nuovo Server</DialogTitle>
              </DialogHeader>
              <ServerForm onSuccess={handleFormSuccess} />
            </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="p-6 space-y-4">
      {servers.length === 0 ? (
        <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg flex flex-col items-center justify-center py-12">
          <Server className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" />
          <p className="text-sm text-zinc-500 mb-3">Nessun server configurato</p>
          <Button size="sm" className="h-8 text-sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Aggiungi il primo server
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <div
              key={server.server_id}
              className={`bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-4 hover:border-zinc-300 dark:hover:border-white/10 transition-colors ${!server.is_active ? 'opacity-60' : ''} ${(server as any).panel_type ? 'cursor-pointer' : ''}`}
              onClick={() => (server as any).panel_type && setViewingServer(server)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Server className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{server.server_name}</p>
                    {server.provider && (
                      <p className="text-xs text-zinc-500">{server.provider}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {!server.is_active && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">Inattivo</Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingServer(server)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifica
                      </DropdownMenuItem>
                      {(server as any).panel_type && (
                        <DropdownMenuItem onClick={() => setViewingServer(server)}>
                          <Monitor className="h-4 w-4 mr-2" />
                          Pannello Agente
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDeletingServer(server)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {server.hostname && (
                <p className="text-xs text-zinc-500 font-mono mb-2 truncate">{server.hostname}</p>
              )}

              {(server as any).panel_type && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Monitor className="h-3.5 w-3.5 text-zinc-400" />
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    {(server as any).panel_type === 'cpanel' ? 'cPanel' : 'Plesk'}
                  </Badge>
                  <Badge
                    variant={(server as any).agent_status === 'online' ? 'default' : 'secondary'}
                    className="text-[10px] h-4 px-1.5"
                  >
                    {(server as any).agent_status === 'online' ? 'Online' :
                     (server as any).agent_status === 'offline' ? 'Offline' :
                     'Non installato'}
                  </Badge>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-zinc-100 dark:border-white/5 mt-2">
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-sm font-mono font-medium text-zinc-900 dark:text-white">{server.sites_count}</span>
                  <span className="text-xs text-zinc-500">siti</span>
                </div>
                {server.active_sites !== server.sites_count && (
                  <span className="text-xs text-zinc-500">({server.active_sites} attivi)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingServer} onOpenChange={(open) => !open && setEditingServer(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifica Server</DialogTitle>
          </DialogHeader>
          {editingServer && (
            <ServerForm
              serverId={editingServer.server_id}
              initialData={{
                name: editingServer.server_name,
                provider: editingServer.provider,
                hostname: editingServer.hostname,
                is_active: editingServer.is_active,
              }}
              onSuccess={handleFormSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingServer} onOpenChange={(open) => !open && setDeletingServer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Server</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il server "{deletingServer?.server_name}"?
              {deletingServer && deletingServer.sites_count > 0 && (
                <span className="block mt-2 text-red-500">
                  Attenzione: ci sono {deletingServer.sites_count} siti associati a questo server.
                  Riassegna prima i siti a un altro server.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || (deletingServer?.sites_count ?? 0) > 0}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Agent Detail Sheet */}
      <Sheet open={!!viewingServer} onOpenChange={(open) => !open && setViewingServer(null)}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              {viewingServer?.server_name}
            </SheetTitle>
          </SheetHeader>
          {viewingServer && (viewingServer as any).panel_type && (
            <div className="mt-4">
              <ServerAgentTabs
                serverId={viewingServer.server_id}
                serverName={viewingServer.server_name}
                panelType={(viewingServer as any).panel_type}
                agentStatus={(viewingServer as any).agent_status || 'not_installed'}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
      </div>
    </div>
  );
}

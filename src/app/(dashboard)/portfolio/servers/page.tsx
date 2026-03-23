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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/portfolio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Server</h1>
            <p className="text-muted-foreground">
              Gestisci i server per organizzare il portfolio domini
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchServers(true)}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
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
      </div>

      {servers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nessun server configurato</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi il primo server
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <Card
              key={server.server_id}
              className={`${!server.is_active ? 'opacity-60' : ''} ${(server as any).panel_type ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
              onClick={() => (server as any).panel_type && setViewingServer(server)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{server.server_name}</CardTitle>
                      {server.provider && (
                        <CardDescription>{server.provider}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!server.is_active && (
                      <Badge variant="outline" className="text-xs">Inattivo</Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
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
              </CardHeader>
              <CardContent>
                {server.hostname && (
                  <p className="text-sm text-muted-foreground mb-3 font-mono">
                    {server.hostname}
                  </p>
                )}
                {(server as any).panel_type && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {(server as any).panel_type === 'cpanel' ? 'cPanel' : 'Plesk'}
                    </Badge>
                    <Badge
                      variant={(server as any).agent_status === 'online' ? 'default' : 'secondary'}
                      className="text-[10px] h-5"
                    >
                      {(server as any).agent_status === 'online' ? '🟢 Online' :
                       (server as any).agent_status === 'offline' ? '🔴 Offline' :
                       '⚪ Non installato'}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{server.sites_count}</span>
                    <span className="text-sm text-muted-foreground">siti</span>
                  </div>
                  {server.active_sites !== server.sites_count && (
                    <div className="text-sm text-muted-foreground">
                      ({server.active_sites} attivi)
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
  );
}

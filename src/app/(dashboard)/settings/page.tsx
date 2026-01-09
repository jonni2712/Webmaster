'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Bell,
  Shield,
  Building,
  Mail,
  MessageSquare,
  Webhook,
  Plus,
  Trash2,
  Save,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface AlertChannel {
  id: string;
  type: 'email' | 'slack' | 'telegram' | 'discord' | 'webhook';
  name: string;
  config: Record<string, string>;
  enabled: boolean;
}

const channelIcons = {
  email: Mail,
  slack: MessageSquare,
  telegram: MessageSquare,
  discord: MessageSquare,
  webhook: Webhook,
};

export default function SettingsPage() {
  const { data: session, status, update } = useSession();

  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<AlertChannel[]>([]);

  // Profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch('/api/alert-channels');
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchChannels();
    }
  }, [status, fetchChannels]);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        await update();
        toast.success('Profilo aggiornato');
      } else {
        toast.error('Errore nell\'aggiornamento del profilo');
      }
    } catch (error) {
      toast.error('Errore nell\'aggiornamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Le password non coincidono');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('La password deve essere di almeno 8 caratteri');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        toast.success('Password aggiornata');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Errore nell\'aggiornamento della password');
      }
    } catch (error) {
      toast.error('Errore nell\'aggiornamento della password');
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = async (channelId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/alert-channels/${channelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        setChannels(channels.map(c =>
          c.id === channelId ? { ...c, enabled } : c
        ));
        toast.success(enabled ? 'Canale attivato' : 'Canale disattivato');
      }
    } catch (error) {
      toast.error('Errore nell\'aggiornamento del canale');
    }
  };

  const deleteChannel = async (channelId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo canale?')) return;
    try {
      const res = await fetch(`/api/alert-channels/${channelId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setChannels(channels.filter(c => c.id !== channelId));
        toast.success('Canale eliminato');
      }
    } catch (error) {
      toast.error('Errore nell\'eliminazione del canale');
    }
  };

  // Show loading while session is being fetched
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Impostazioni</h1>
        <p className="text-muted-foreground">
          Gestisci il tuo profilo e le preferenze
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profilo
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sicurezza
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifiche
          </TabsTrigger>
          <TabsTrigger value="workspace" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Workspace
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Profilo</CardTitle>
              <CardDescription>
                Aggiorna le tue informazioni personali
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Il tuo nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    L'email non puo essere modificata
                  </p>
                </div>
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  Salva modifiche
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Cambia Password</CardTitle>
              <CardDescription>
                Aggiorna la tua password di accesso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Password attuale</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nuova password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Conferma password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  <Shield className="mr-2 h-4 w-4" />
                  Aggiorna password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Canali di Notifica</CardTitle>
                    <CardDescription>
                      Configura dove ricevere gli avvisi
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Aggiungi canale
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {channels.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Nessun canale configurato</p>
                    <p className="text-sm">
                      Aggiungi un canale per ricevere notifiche
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {channels.map((channel) => {
                      const Icon = channelIcons[channel.type];
                      return (
                        <div
                          key={channel.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-muted rounded-lg">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{channel.name}</span>
                                <Badge variant="outline" className="capitalize">
                                  {channel.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Switch
                              checked={channel.enabled}
                              onCheckedChange={(checked) =>
                                toggleChannel(channel.id, checked)
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteChannel(channel.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workspace Tab */}
        <TabsContent value="workspace">
          <Card>
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <CardDescription>
                Gestisci il tuo workspace e i membri del team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Building className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Gestione team in arrivo</p>
                <p className="text-sm">
                  Presto potrai invitare membri e gestire i ruoli
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

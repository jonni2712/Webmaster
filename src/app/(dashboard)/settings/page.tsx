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
import { ChannelFormDialog } from '@/components/settings/channel-form-dialog';
import { DigestPreferencesForm } from '@/components/settings/digest-preferences-form';

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
  const [showChannelDialog, setShowChannelDialog] = useState(false);

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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Impostazioni</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gestisci il tuo profilo e le preferenze
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Profilo</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Sicurezza</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Notifiche</span>
          </TabsTrigger>
          <TabsTrigger value="workspace" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Building className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Workspace</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Informazioni Profilo</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Aggiorna le tue informazioni personali
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Il tuo nome"
                    className="h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted h-9 sm:h-10"
                  />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    L'email non puo' essere modificata
                  </p>
                </div>
                <Button type="submit" disabled={loading} size="sm" className="sm:size-default">
                  <Save className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Salva modifiche</span>
                  <span className="sm:hidden">Salva</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Cambia Password</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Aggiorna la tua password di accesso
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm">Password attuale</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm">Nuova password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">Conferma password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-9 sm:h-10"
                  />
                </div>
                <Button type="submit" disabled={loading} size="sm" className="sm:size-default">
                  <Shield className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Aggiorna password</span>
                  <span className="sm:hidden">Aggiorna</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Canali di Notifica</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Configura dove ricevere gli avvisi
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setShowChannelDialog(true)}>
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Aggiungi canale</span>
                    <span className="sm:hidden">Aggiungi</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                {channels.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <Bell className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">Nessun canale configurato</p>
                    <p className="text-xs sm:text-sm">
                      Aggiungi un canale per ricevere notifiche
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {channels.map((channel) => {
                      const Icon = channelIcons[channel.type];
                      return (
                        <div
                          key={channel.id}
                          className="flex items-center justify-between p-3 sm:p-4 border rounded-lg gap-3"
                        >
                          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                            <div className="p-1.5 sm:p-2 bg-muted rounded-lg flex-shrink-0">
                              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                <span className="font-medium text-sm sm:text-base truncate">{channel.name}</span>
                                <Badge variant="outline" className="capitalize text-[10px] sm:text-xs">
                                  {channel.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                            <Switch
                              checked={channel.enabled}
                              onCheckedChange={(checked) =>
                                toggleChannel(channel.id, checked)
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
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

            {/* Digest Preferences */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Digest Email</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Configura il riepilogo periodico dei tuoi siti
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <DigestPreferencesForm userEmail={session?.user?.email || ''} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workspace Tab */}
        <TabsContent value="workspace">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Workspace</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Gestisci il tuo workspace e i membri del team
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Building className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Gestione team in arrivo</p>
                <p className="text-xs sm:text-sm">
                  Presto potrai invitare membri e gestire i ruoli
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Channel Form Dialog */}
      <ChannelFormDialog
        open={showChannelDialog}
        onOpenChange={setShowChannelDialog}
        onSuccess={fetchChannels}
      />
    </div>
  );
}

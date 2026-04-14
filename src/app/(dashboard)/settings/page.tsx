'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Users,
  Mail,
  MessageSquare,
  Webhook,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { ChannelFormDialog } from '@/components/settings/channel-form-dialog';
import { DigestPreferencesForm } from '@/components/settings/digest-preferences-form';
import { BillingTab } from '@/components/settings/billing-tab';
import {
  TeamMembersList,
  InviteMemberDialog,
  PendingInvitations,
  MemberSitesDialog,
  ActivityFeed,
} from '@/components/team';
import type { TeamMember, MemberRole } from '@/types/database';

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
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const { data: session, status, update } = useSession();

  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [showChannelDialog, setShowChannelDialog] = useState(false);

  // Team management state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<MemberRole>('viewer');
  const [teamRefreshKey, setTeamRefreshKey] = useState(0);

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

  const fetchCurrentUserRole = useCallback(async () => {
    try {
      const res = await fetch('/api/team/members');
      if (res.ok) {
        const data = await res.json();
        setCurrentUserRole(data.currentUserRole || 'viewer');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchChannels();
      fetchCurrentUserRole();
    }
  }, [status, fetchChannels, fetchCurrentUserRole]);

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

  const settingsTabs = [
    { label: 'Profilo', value: 'profile' },
    { label: 'Sicurezza', value: 'security' },
    { label: 'Notifiche', value: 'notifications' },
    { label: 'Team', value: 'team' },
  ];

  return (
    <div>
      <PageHeader
        title="Impostazioni"
        description="Gestisci il tuo profilo e le preferenze"
      />

      <div className="p-6 space-y-6">
      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs sm:text-sm px-3">
            <User className="h-3.5 w-3.5" />
            Profilo
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs sm:text-sm px-3">
            <Shield className="h-3.5 w-3.5" />
            Sicurezza
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5 text-xs sm:text-sm px-3">
            <Bell className="h-3.5 w-3.5" />
            Notifiche
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-1.5 text-xs sm:text-sm px-3">
            <Users className="h-3.5 w-3.5" />
            Team
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-1.5 text-xs sm:text-sm px-3">
            <CreditCard className="h-3.5 w-3.5" />
            Abbonamento
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-6 space-y-6">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Informazioni Profilo</p>
              <p className="text-xs text-zinc-500 mt-0.5">Aggiorna le tue informazioni personali</p>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Il tuo nome"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-zinc-50 dark:bg-white/[0.02] h-9 text-sm"
                />
                <p className="text-xs text-zinc-500">L'email non puo' essere modificata</p>
              </div>
              <Button type="submit" disabled={loading} size="sm" className="h-8 text-sm">
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Salva modifiche
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-6 space-y-6">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Cambia Password</p>
              <p className="text-xs text-zinc-500 mt-0.5">Aggiorna la tua password di accesso</p>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword" className="text-xs font-medium">Password attuale</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs font-medium">Nuova password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-medium">Conferma password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <Button type="submit" disabled={loading} size="sm" className="h-8 text-sm">
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                Aggiorna password
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">Canali di Notifica</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Configura dove ricevere gli avvisi</p>
                </div>
                <Button size="sm" className="h-8 text-sm" onClick={() => setShowChannelDialog(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Aggiungi canale
                </Button>
              </div>
              {channels.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Bell className="mx-auto h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">Nessun canale configurato</p>
                  <p className="text-xs mt-0.5">Aggiungi un canale per ricevere notifiche</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-white/5">
                  {channels.map((channel) => {
                    const Icon = channelIcons[channel.type];
                    return (
                      <div
                        key={channel.id}
                        className="flex items-center justify-between py-3 gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 bg-zinc-100 dark:bg-white/5 rounded-md flex-shrink-0">
                            <Icon className="h-3.5 w-3.5 text-zinc-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">{channel.name}</span>
                              <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0 h-4">
                                {channel.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Switch
                            checked={channel.enabled}
                            onCheckedChange={(checked) => toggleChannel(channel.id, checked)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => deleteChannel(channel.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Digest Preferences */}
            <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Digest Email</p>
                <p className="text-xs text-zinc-500 mt-0.5">Configura il riepilogo periodico dei tuoi siti</p>
              </div>
              <DigestPreferencesForm userEmail={session?.user?.email || ''} />
            </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <div className="space-y-4">
            {/* Team Members */}
            <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Membri del Team</p>
                <p className="text-xs text-zinc-500 mt-0.5">Gestisci i membri del tuo team e i loro ruoli</p>
              </div>
              <TeamMembersList
                key={teamRefreshKey}
                currentUserRole={currentUserRole}
                onInviteClick={() => setShowInviteDialog(true)}
                onSiteAccessClick={(member) => setSelectedMember(member)}
              />
            </div>

            {/* Pending Invitations */}
            <PendingInvitations currentUserRole={currentUserRole} />

            {/* Activity Feed */}
            <ActivityFeed limit={10} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Channel Form Dialog */}
      <ChannelFormDialog
        open={showChannelDialog}
        onOpenChange={setShowChannelDialog}
        onSuccess={fetchChannels}
      />

      {/* Invite Member Dialog */}
      <InviteMemberDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        currentUserRole={currentUserRole}
        onInviteSent={() => setTeamRefreshKey(k => k + 1)}
      />

      {/* Member Sites Dialog */}
      <MemberSitesDialog
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
        member={selectedMember}
        onAccessUpdated={() => setTeamRefreshKey(k => k + 1)}
      />
      </div>
    </div>
  );
}

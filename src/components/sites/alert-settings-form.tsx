'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Bell, Shield, Activity, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_ALERT_SETTINGS, type SiteAlertSettings } from '@/types/database';

interface AlertSettingsFormProps {
  siteId: string;
  initialSettings: SiteAlertSettings | null;
  onUpdate?: () => void;
}

export function AlertSettingsForm({ siteId, initialSettings, onUpdate }: AlertSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<SiteAlertSettings>({
    ...DEFAULT_ALERT_SETTINGS,
    ...initialSettings,
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_settings: settings }),
      });

      if (res.ok) {
        toast.success('Impostazioni alert salvate');
        onUpdate?.();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Errore nel salvataggio');
      }
    } catch (error) {
      toast.error('Errore nel salvataggio delle impostazioni');
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_ALERT_SETTINGS);
    toast.info('Impostazioni ripristinate ai valori predefiniti');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Master Toggle */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Alert Attivi</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Abilita o disabilita tutti gli alert per questo sito
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.alerts_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, alerts_enabled: checked })
              }
            />
          </div>
        </CardHeader>
      </Card>

      {settings.alerts_enabled && (
        <>
          {/* SSL Settings */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Soglie SSL</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Quando notificare la scadenza del certificato SSL
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ssl_warning_days" className="text-sm">
                    Avviso (giorni prima)
                  </Label>
                  <Input
                    id="ssl_warning_days"
                    type="number"
                    min={1}
                    max={90}
                    value={settings.ssl_warning_days}
                    onChange={(e) =>
                      setSettings({ ...settings, ssl_warning_days: parseInt(e.target.value) || 14 })
                    }
                    className="h-9 sm:h-10"
                  />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Severita': Warning
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ssl_critical_days" className="text-sm">
                    Critico (giorni prima)
                  </Label>
                  <Input
                    id="ssl_critical_days"
                    type="number"
                    min={1}
                    max={30}
                    value={settings.ssl_critical_days}
                    onChange={(e) =>
                      setSettings({ ...settings, ssl_critical_days: parseInt(e.target.value) || 7 })
                    }
                    className="h-9 sm:h-10"
                  />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Severita': Critical
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ssl_cooldown" className="text-sm">
                  Cooldown SSL (minuti)
                </Label>
                <Input
                  id="ssl_cooldown"
                  type="number"
                  min={60}
                  max={10080}
                  value={settings.ssl_cooldown_minutes}
                  onChange={(e) =>
                    setSettings({ ...settings, ssl_cooldown_minutes: parseInt(e.target.value) || 1440 })
                  }
                  className="h-9 sm:h-10"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Tempo minimo tra notifiche SSL (default: 1440 = 24 ore)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Uptime Settings */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Activity className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Soglie Uptime</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Configurazione notifiche downtime
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uptime_cooldown" className="text-sm">
                  Cooldown Uptime (minuti)
                </Label>
                <Input
                  id="uptime_cooldown"
                  type="number"
                  min={5}
                  max={1440}
                  value={settings.uptime_cooldown_minutes}
                  onChange={(e) =>
                    setSettings({ ...settings, uptime_cooldown_minutes: parseInt(e.target.value) || 60 })
                  }
                  className="h-9 sm:h-10"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Tempo minimo tra notifiche downtime (default: 60 minuti)
                </p>
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 border rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Notifica Recovery</Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Ricevi notifica quando il sito torna online
                  </p>
                </div>
                <Switch
                  checked={settings.notify_on_recovery}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, notify_on_recovery: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={resetToDefaults} disabled={isLoading}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Ripristina default
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salva impostazioni
        </Button>
      </div>
    </div>
  );
}

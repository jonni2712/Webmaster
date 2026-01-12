'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Mail, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_DIGEST_PREFERENCES, type DigestPreferences, type DigestFrequency } from '@/types/database';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domenica' },
  { value: 1, label: 'Lunedi\'' },
  { value: 2, label: 'Martedi\'' },
  { value: 3, label: 'Mercoledi\'' },
  { value: 4, label: 'Giovedi\'' },
  { value: 5, label: 'Venerdi\'' },
  { value: 6, label: 'Sabato' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, '0')}:00`,
}));

interface DigestPreferencesFormProps {
  userEmail: string;
}

export function DigestPreferencesForm({ userEmail }: DigestPreferencesFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [preferences, setPreferences] = useState<DigestPreferences>(DEFAULT_DIGEST_PREFERENCES);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/user/digest-preferences');
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPreferences({ ...DEFAULT_DIGEST_PREFERENCES, ...data.preferences });
        }
      }
    } catch (error) {
      console.error('Error fetching digest preferences:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/digest-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (res.ok) {
        toast.success('Preferenze digest salvate');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Errore nel salvataggio');
      }
    } catch (error) {
      toast.error('Errore nel salvataggio delle preferenze');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Master Toggle */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Digest Email</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Ricevi un riepilogo periodico dello stato dei tuoi siti
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={preferences.enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, enabled: checked })
              }
            />
          </div>
        </CardHeader>
      </Card>

      {preferences.enabled && (
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Configurazione</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Scegli quando ricevere il digest
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4">
            {/* Frequency */}
            <div className="space-y-2">
              <Label className="text-sm">Frequenza</Label>
              <Select
                value={preferences.frequency}
                onValueChange={(value: DigestFrequency) =>
                  setPreferences({ ...preferences, frequency: value })
                }
              >
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Giornaliero</SelectItem>
                  <SelectItem value="weekly">Settimanale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Day of Week (only for weekly) */}
            {preferences.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label className="text-sm">Giorno della settimana</Label>
                <Select
                  value={preferences.day_of_week.toString()}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, day_of_week: parseInt(value) })
                  }
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Hour */}
            <div className="space-y-2">
              <Label className="text-sm">Ora di invio (UTC)</Label>
              <Select
                value={preferences.hour.toString()}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, hour: parseInt(value) })
                }
              >
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((hour) => (
                    <SelectItem key={hour.value} value={hour.value.toString()}>
                      {hour.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                L'orario e' in UTC. Ora locale: {new Date().toLocaleTimeString('it-IT', { timeZoneName: 'short' })}
              </p>
            </div>

            {/* Custom Email */}
            <div className="space-y-2">
              <Label className="text-sm">Email destinatario</Label>
              <Input
                type="email"
                placeholder={userEmail}
                value={preferences.email || ''}
                onChange={(e) =>
                  setPreferences({ ...preferences, email: e.target.value || null })
                }
                className="h-9 sm:h-10"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Lascia vuoto per usare l'email del tuo account ({userEmail})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salva preferenze
        </Button>
      </div>
    </div>
  );
}

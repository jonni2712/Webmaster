'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCookieConsent, CookieConsent } from '@/hooks/use-cookie-consent';
import { Cookie, Settings, X, Shield } from 'lucide-react';

export function CookieBanner() {
  const {
    showBanner,
    acceptAll,
    rejectAll,
    saveConsent,
  } = useCookieConsent();

  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsent>({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  });

  if (!showBanner) return null;

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (showSettings) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Preferenze Cookie</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Gestisci le tue preferenze sui cookie. I cookie necessari sono sempre attivi
              perche essenziali per il funzionamento del sito.
            </p>

            <div className="space-y-4">
              {/* Cookie Necessari */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">Cookie Necessari</Label>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      Sempre attivi
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Essenziali per l'autenticazione e le funzionalita di base del sito.
                  </p>
                </div>
                <Switch checked disabled />
              </div>

              {/* Cookie Funzionali */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="font-medium">Cookie Funzionali</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ricordano le tue preferenze come tema e lingua.
                  </p>
                </div>
                <Switch
                  checked={preferences.functional}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, functional: checked })
                  }
                />
              </div>

              {/* Cookie Analitici */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="font-medium">Cookie Analitici</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ci aiutano a capire come utilizzi il sito per migliorarlo.
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, analytics: checked })
                  }
                />
              </div>

              {/* Cookie Marketing */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="font-medium">Cookie Marketing</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Utilizzati per mostrarti contenuti personalizzati.
                  </p>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketing: checked })
                  }
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <Button onClick={handleSavePreferences} className="flex-1">
                Salva Preferenze
              </Button>
              <Button variant="outline" onClick={acceptAll} className="flex-1">
                Accetta Tutti
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Per maggiori informazioni, leggi la nostra{' '}
              <Link href="/cookies" className="text-primary hover:underline">
                Cookie Policy
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6">
      <Card className="max-w-4xl mx-auto shadow-lg border-2">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Utilizziamo i Cookie</h3>
                <p className="text-sm text-muted-foreground">
                  Questo sito utilizza cookie per migliorare la tua esperienza.
                  Puoi accettare tutti i cookie, personalizzare le preferenze o rifiutare
                  quelli non essenziali.{' '}
                  <Link href="/cookies" className="text-primary hover:underline">
                    Scopri di piu
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="justify-start sm:justify-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Personalizza
              </Button>
              <Button variant="outline" size="sm" onClick={rejectAll}>
                Rifiuta
              </Button>
              <Button size="sm" onClick={acceptAll}>
                Accetta Tutti
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente per modificare le preferenze cookie (da usare nel footer o settings)
export function CookieSettingsButton() {
  const { resetConsent } = useCookieConsent();

  return (
    <button
      onClick={resetConsent}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      Gestisci Cookie
    </button>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';

export type CookieConsent = {
  necessary: boolean; // Sempre true, non modificabile
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

const COOKIE_CONSENT_KEY = 'cookie-consent';
const COOKIE_CONSENT_VERSION = '1.0';

const DEFAULT_CONSENT: CookieConsent = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carica il consenso dal localStorage
  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version === COOKIE_CONSENT_VERSION) {
          setConsent(parsed.consent);
        }
      } catch {
        // Ignora errori di parsing
      }
    }
    setIsLoaded(true);
  }, []);

  // Salva il consenso
  const saveConsent = useCallback((newConsent: CookieConsent) => {
    const data = {
      version: COOKIE_CONSENT_VERSION,
      consent: { ...newConsent, necessary: true }, // necessary sempre true
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data));
    setConsent(data.consent);

    // Dispatch evento per altri componenti
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: data.consent }));
  }, []);

  // Accetta tutti i cookie
  const acceptAll = useCallback(() => {
    saveConsent({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
  }, [saveConsent]);

  // Rifiuta tutti i cookie (eccetto necessari)
  const rejectAll = useCallback(() => {
    saveConsent({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  }, [saveConsent]);

  // Accetta solo i necessari
  const acceptNecessary = useCallback(() => {
    saveConsent(DEFAULT_CONSENT);
  }, [saveConsent]);

  // Aggiorna consenso specifico
  const updateConsent = useCallback((key: keyof CookieConsent, value: boolean) => {
    if (key === 'necessary') return; // Non modificabile

    setConsent((prev) => {
      const newConsent = { ...(prev || DEFAULT_CONSENT), [key]: value };
      saveConsent(newConsent);
      return newConsent;
    });
  }, [saveConsent]);

  // Reset consenso (per test o cambio preferenze)
  const resetConsent = useCallback(() => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    setConsent(null);
  }, []);

  // Controlla se un tipo di cookie e consentito
  const hasConsent = useCallback((type: keyof CookieConsent): boolean => {
    if (type === 'necessary') return true;
    return consent?.[type] ?? false;
  }, [consent]);

  return {
    consent,
    isLoaded,
    hasConsent,
    showBanner: isLoaded && consent === null,
    acceptAll,
    rejectAll,
    acceptNecessary,
    updateConsent,
    saveConsent,
    resetConsent,
  };
}

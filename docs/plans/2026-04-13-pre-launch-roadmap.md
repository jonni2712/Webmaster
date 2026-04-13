# Pre-Launch Roadmap

**Obiettivo**: Completare tutto il necessario per il lancio pubblico.

---

## Sprint 1: Enforcement & Sicurezza (CRITICO)

### 1.1 Enforcement limiti piano
- [ ] Intervallo minimo check: blocca impostazione < piano (es. free non puo' settare 5 min)
- [ ] Team members limit: blocca inviti oltre quota piano
- [ ] Feature gating: scanner, agent, API accessibili solo per i piani che li includono
- [ ] Notification channels: solo email per Starter, tutti per i piani a pagamento

### 1.2 Retention cleanup cron
- [ ] Cron job che cancella dati storici scaduti per piano (7gg free, 30gg pro, 90gg business, 365gg agency)
- [ ] Applicare a: uptime_checks, ssl_checks, performance_checks, alerts

### 1.3 Email transazionali Stripe
- [ ] Email benvenuto post-registrazione
- [ ] Conferma upgrade piano
- [ ] Avviso 3 giorni prima di fine trial
- [ ] Notifica pagamento fallito
- [ ] Conferma cancellazione

## Sprint 2: Pagine & UX

### 2.1 Error pages brandizzate
- [ ] 404 custom (not-found.tsx)
- [ ] Error boundary (error.tsx)

### 2.2 Onboarding flow
- [ ] Schermata "Benvenuto" dopo prima registrazione
- [ ] 3 step guidati: aggiungi primo sito, configura notifiche, installa plugin

### 2.3 Pagine legali aggiornate
- [ ] Privacy policy: aggiungere sezione Stripe/pagamenti
- [ ] Terms of service: aggiungere termini abbonamento, trial, cancellazione

## Sprint 3: Analytics & SEO

### 3.1 Google Analytics + Clarity
- [ ] Integrare GA4 nel layout (richiede Measurement ID)
- [ ] Integrare Microsoft Clarity (richiede Project ID)
- [ ] Rispettare cookie consent

### 3.2 Google Search Console
- [ ] Registrare dominio
- [ ] Aggiungere verification code in layout.tsx
- [ ] Submit sitemap

## Sprint 4: Quality & Polish

### 4.1 Responsive audit
- [ ] Testare tutte le pagine marketing su mobile
- [ ] Testare dashboard su tablet
- [ ] Fix eventuali problemi di overflow/layout

### 4.2 Performance audit
- [ ] Lighthouse score > 90 su tutte le pagine marketing
- [ ] Bundle size check
- [ ] Image optimization

### 4.3 Accessibility
- [ ] Heading hierarchy corretta (h1 > h2 > h3)
- [ ] ARIA labels sui componenti interattivi
- [ ] Keyboard navigation nella dashboard

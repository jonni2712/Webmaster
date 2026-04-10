'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Activity,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Menu,
  Lock,
  Headphones,
  BarChart3,
  Globe,
  Users,
  Bell,
  Clock,
  ChevronDown,
  Plug,
  Workflow,
  MessageSquare,
  Mail,
  Send,
} from 'lucide-react';
import { CookieSettingsButton } from '@/components/cookie-banner';
import { UptimeHeroAnimation } from '@/components/landing/uptime-hero-animation';
import { AnimatedCounter } from '@/components/landing/animated-counter';
import { LandingSection } from '@/components/landing/section';

const plans = [
  {
    name: 'Starter',
    price: '0',
    priceAnnual: '0',
    description: 'Per testare il monitoraggio sui tuoi siti',
    features: [
      { text: 'Fino a 5 siti', included: true },
      { text: 'Uptime check ogni 15 minuti', included: true },
      { text: 'Notifiche email', included: true },
      { text: 'Storico 7 giorni', included: true },
      { text: 'Dashboard base', included: true },
    ],
    cta: 'Inizia Gratis',
    href: '/register',
    popular: false,
  },
  {
    name: 'Pro',
    price: '19',
    priceAnnual: '15',
    description: 'Per freelancer e piccoli team',
    features: [
      { text: 'Fino a 30 siti', included: true },
      { text: 'Uptime check ogni 5 minuti', included: true },
      { text: 'Slack, Telegram, Discord, Webhook', included: true },
      { text: 'Scanner DNS, SSL, CMS, WHOIS', included: true },
      { text: 'Storico 30 giorni', included: true },
      { text: 'Team fino a 5 membri', included: true },
    ],
    cta: 'Prova Gratuita 14 giorni',
    href: '/register',
    popular: true,
  },
  {
    name: 'Business',
    price: '49',
    priceAnnual: '41',
    description: 'Per agenzie in crescita',
    features: [
      { text: 'Fino a 100 siti', included: true },
      { text: 'Uptime check ogni 3 minuti', included: true },
      { text: 'Tutti i canali di notifica', included: true },
      { text: 'Gestione clienti (CRM)', included: true },
      { text: 'Report esportabili', included: true },
      { text: 'API pubblica', included: true },
      { text: 'Team fino a 10 membri', included: true },
      { text: 'Storico 90 giorni', included: true },
    ],
    cta: 'Prova Gratuita 14 giorni',
    href: '/register',
    popular: false,
  },
  {
    name: 'Agency',
    price: '129',
    priceAnnual: '109',
    description: 'Per agenzie con molti clienti e server',
    features: [
      { text: 'Fino a 300 siti', included: true },
      { text: 'Uptime check ogni 1 minuto', included: true },
      { text: 'Agent cPanel e Plesk', included: true },
      { text: 'API pubblica avanzata', included: true },
      { text: 'Team fino a 50 membri', included: true },
      { text: 'Storico 1 anno', included: true },
      { text: 'Account manager dedicato', included: true },
    ],
    cta: 'Contattaci',
    href: '/contact',
    popular: false,
  },
];

const faqs = [
  {
    q: "Quanto tempo serve per configurare il monitoraggio?",
    a: "Meno di 3 minuti. Aggiungi l'URL del tuo sito, scegli l'intervallo di controllo e i canali di notifica. Per WordPress e PrestaShop puoi installare il nostro plugin per dati ancora piu' dettagliati."
  },
  {
    q: "Quali piattaforme supportate?",
    a: "Monitoriamo qualsiasi sito web accessibile via HTTP/HTTPS. Abbiamo integrazioni native per WordPress, PrestaShop e Next.js con dati aggiuntivi come aggiornamenti disponibili, versioni plugin e Core Web Vitals."
  },
  {
    q: "Come funzionano le notifiche?",
    a: "Quando un sito va offline o un certificato SSL sta per scadere, ricevi una notifica immediata sul canale che preferisci: email, Slack, Telegram, Discord o webhook. Puoi configurare soglie e cooldown per evitare alert ridondanti."
  },
  {
    q: "Posso monitorare i server oltre ai siti?",
    a: "Si, con il piano Agency puoi installare il nostro agent su server cPanel e Plesk per monitorare risorse (CPU, RAM, disco), account, certificati SSL, zone DNS e molto altro."
  },
  {
    q: "I dati sono al sicuro?",
    a: "Assolutamente. Le API key sono crittografate con AES-256-GCM, le password con bcrypt, e tutta la piattaforma e' conforme al GDPR. I dati sono ospitati in Europa."
  },
  {
    q: "Posso provare i piani a pagamento?",
    a: "Si, offriamo 14 giorni di prova gratuita dei piani Pro, Business e Agency senza carta di credito. Al termine, puoi continuare con il piano Starter gratuito o effettuare l'upgrade."
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '#come-funziona', label: 'Come funziona' },
    { href: '#features', label: "Funzionalita'" },
    { href: '#pricing', label: 'Prezzi' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <div className="landing-dark min-h-screen bg-[#0A0A0A] text-white">
      {/* ── Navbar ── */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight text-white">Webmaster</span>
              <span className="text-[10px] text-zinc-500 leading-tight -mt-0.5 tracking-widest">MONITOR</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-white/5"
              >
                Accedi
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all"
              >
                Inizia Gratis
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/5">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Apri menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-[#111111] border-white/10 text-white">
              <SheetTitle className="sr-only">Menu navigazione</SheetTitle>
              <div className="flex flex-col gap-6 mt-6">
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2.5 text-base font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/5">
                      Accedi
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                      Inizia Gratis
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      >
        {/* Gradient glow blob */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(16,185,129,0.4) 0%, rgba(14,165,233,0.2) 40%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — text */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Monitoraggio professionale per agenzie
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]">
                <span className="text-white block">Monitora ogni sito.</span>
                <span className="block bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                  Intervieni prima dei tuoi clienti.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto lg:mx-0 mb-8">
                La piattaforma completa per webmaster e agenzie. Uptime, SSL, performance
                e notifiche in tempo reale — tutto in un&apos;unica dashboard.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 px-8 shadow-[0_0_24px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all animate-[glow-pulse_3s_ease-in-out_infinite]"
                  >
                    Inizia Gratis <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/20 hover:border-white/40 text-white bg-transparent hover:bg-white/5 px-8"
                  >
                    Scopri le Funzionalita&apos;
                  </Button>
                </a>
              </div>
            </div>

            {/* Right — animation */}
            <div className="flex items-center justify-center lg:justify-end">
              <UptimeHeroAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof Bar ── */}
      <div className="border-y border-white/5 bg-white/[0.02] py-8">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-zinc-400 text-sm md:text-base">
            Utilizzato da{' '}
            <span className="font-mono font-bold text-emerald-400">500+</span>{' '}
            webmaster e agenzie in Italia
          </p>
        </div>
      </div>

      {/* ── Come funziona ── */}
      <LandingSection id="come-funziona">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-4">
              Come funziona
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Operativo in 3 minuti
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Nessuna configurazione complessa. Aggiungi i tuoi siti e inizia a monitorare.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-emerald-500/50 via-emerald-500/20 to-emerald-500/50" />

            {[
              { step: '01', title: 'Aggiungi i tuoi siti', description: 'Inserisci gli URL dei siti da monitorare. Supporto nativo per WordPress, PrestaShop, Next.js e qualsiasi sito web.', icon: Globe },
              { step: '02', title: 'Configura gli avvisi', description: 'Scegli come e quando ricevere le notifiche: email, Slack, Telegram, Discord o webhook personalizzati.', icon: Bell },
              { step: '03', title: 'Monitora e intervieni', description: 'Dashboard in tempo reale con uptime, SSL, performance e aggiornamenti. Intervieni prima che i tuoi clienti se ne accorgano.', icon: Activity },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6 mx-auto">
                  <item.icon className="h-10 w-10 text-emerald-400" />
                </div>
                <div className="font-mono text-emerald-500/50 text-sm mb-2">{item.step}</div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </LandingSection>

      {/* ── Features Section ── */}
      <div id="features">
        {/* Section header */}
        <div className="container mx-auto px-4 md:px-6 pt-24 pb-12 text-center">
          <span className="inline-block px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-4">
            Funzionalita&apos;
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            Tutto sotto controllo, in tempo reale
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Una suite completa di strumenti per tenere sotto controllo performance,
            disponibilita&apos; e sicurezza dei tuoi siti web.
          </p>
        </div>

        {/* Feature Block 1 — Uptime */}
        <LandingSection className="py-0 md:py-0">
          <div className="container mx-auto px-4 md:px-6 pb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text */}
              <div>
                <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-4">
                  Uptime
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Sai sempre se i tuoi siti sono online
                </h3>
                <p className="text-zinc-400 text-lg leading-relaxed">
                  Controllo continuo ogni 1-15 minuti con notifiche istantanee via email,
                  Slack, Telegram e Discord. Storico dettagliato e report di disponibilita&apos;.
                </p>
              </div>
              {/* Visual */}
              <div className="flex justify-center lg:justify-end">
                <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      <span className="text-white font-medium text-sm">Online</span>
                    </div>
                    <span className="font-mono text-2xl font-bold text-emerald-400">99.98%</span>
                  </div>
                  <div className="text-xs text-zinc-500 mb-3">Tempo di risposta medio</div>
                  <div className="font-mono text-lg text-sky-400 mb-4">247ms</div>
                  {/* Mini chart bars */}
                  <div className="flex items-end gap-1 h-10">
                    {[60, 75, 65, 80, 72, 88, 70, 95, 82, 90, 78, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-emerald-500/30"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-2">Ultimi 30 giorni</div>
                </div>
              </div>
            </div>
          </div>
        </LandingSection>

        {/* Feature Block 2 — SSL (reversed) */}
        <LandingSection className="py-0 md:py-0">
          <div className="container mx-auto px-4 md:px-6 pb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Visual — left on desktop */}
              <div className="flex justify-center lg:justify-start order-2 lg:order-1">
                <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                      <Lock className="h-5 w-5 text-sky-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">Let&apos;s Encrypt</div>
                      <div className="text-xs text-zinc-500">SSL Certificate</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Stato</span>
                      <span className="text-emerald-400 font-medium">Valido</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Scadenza</span>
                      <span className="text-emerald-400 font-mono">Scade tra 45 giorni</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Versione TLS</span>
                      <span className="text-white font-mono">TLS 1.3</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Shield className="h-3.5 w-3.5 text-emerald-400" />
                      Catena certificati verificata
                    </div>
                  </div>
                </div>
              </div>
              {/* Text — right on desktop */}
              <div className="order-1 lg:order-2">
                <span className="inline-block px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 text-xs font-semibold tracking-wider uppercase mb-4">
                  Sicurezza
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Certificati SSL sempre sotto controllo
                </h3>
                <p className="text-zinc-400 text-lg leading-relaxed">
                  Monitora scadenze, validita&apos; e catena dei certificati. Avvisi automatici
                  a 30, 14 e 7 giorni dalla scadenza per evitare downtime.
                </p>
              </div>
            </div>
          </div>
        </LandingSection>

        {/* Feature Block 3 — Performance */}
        <LandingSection className="py-0 md:py-0">
          <div className="container mx-auto px-4 md:px-6 pb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text */}
              <div>
                <span className="inline-block px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-4">
                  Performance
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Core Web Vitals in tempo reale
                </h3>
                <p className="text-zinc-400 text-lg leading-relaxed">
                  Integrazione Google PageSpeed per LCP, FID, CLS e TTFB. Identifica i colli
                  di bottiglia prima che impattino i tuoi utenti.
                </p>
              </div>
              {/* Visual */}
              <div className="flex justify-center lg:justify-end">
                <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                    <span className="text-white font-medium text-sm">Core Web Vitals</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-zinc-400 font-mono">LCP</span>
                        <span className="text-emerald-400 font-mono">1.8s</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[72%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-zinc-400 font-mono">CLS</span>
                        <span className="text-sky-400 font-mono">0.05</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[90%] bg-gradient-to-r from-sky-500 to-sky-400 rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-zinc-400 font-mono">TTFB</span>
                        <span className="text-amber-400 font-mono">320ms</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[60%] bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-xs text-zinc-500">Score: 94/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </LandingSection>
      </div>

      {/* ── Integrazioni ── */}
      <LandingSection className="border-t border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-4">
              Integrazioni
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Si integra con i tuoi strumenti
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Piattaforme CMS, pannelli hosting e canali di notifica — tutto collegato.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { name: 'WordPress', category: 'CMS', color: 'text-sky-400' },
              { name: 'PrestaShop', category: 'E-Commerce', color: 'text-pink-400' },
              { name: 'Next.js', category: 'Framework', color: 'text-white' },
              { name: 'cPanel', category: 'Hosting', color: 'text-orange-400' },
              { name: 'Plesk', category: 'Hosting', color: 'text-sky-400' },
              { name: 'Slack', category: 'Notifiche', color: 'text-purple-400' },
              { name: 'Telegram', category: 'Notifiche', color: 'text-sky-400' },
              { name: 'Discord', category: 'Notifiche', color: 'text-indigo-400' },
              { name: 'Email SMTP', category: 'Notifiche', color: 'text-emerald-400' },
              { name: 'Webhook', category: 'API', color: 'text-amber-400' },
              { name: 'Vercel', category: 'Deploy', color: 'text-white' },
              { name: 'Google PageSpeed', category: 'Performance', color: 'text-green-400' },
            ].map((integration) => (
              <div
                key={integration.name}
                className="group bg-[#141414] border border-white/5 hover:border-white/15 rounded-xl p-5 text-center transition-all duration-200 hover:bg-white/[0.03]"
              >
                <div className={`text-2xl font-bold ${integration.color} mb-2 group-hover:scale-110 transition-transform duration-200`}>
                  {integration.name.charAt(0)}
                </div>
                <div className="text-sm text-white font-medium">{integration.name}</div>
                <div className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">{integration.category}</div>
              </div>
            ))}
          </div>
        </div>
      </LandingSection>

      {/* ── Stats Section ── */}
      <section className="bg-[#141414] border-y border-white/5 py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="font-mono text-4xl md:text-5xl font-bold text-emerald-400 mb-2">
                99.9%
              </div>
              <div className="text-sm text-zinc-500">Uptime Piattaforma</div>
            </div>
            <div>
              <div className="font-mono text-4xl md:text-5xl font-bold text-sky-400 mb-2">
                &lt;50ms
              </div>
              <div className="text-sm text-zinc-500">Latenza Media</div>
            </div>
            <div>
              <div className="font-mono text-4xl md:text-5xl font-bold text-amber-400 mb-2">
                <AnimatedCounter end={800} suffix="+" />
              </div>
              <div className="text-sm text-zinc-500">Siti Monitorati</div>
            </div>
            <div>
              <div className="font-mono text-4xl md:text-5xl font-bold text-violet-400 mb-2">
                <AnimatedCounter end={5} />
              </div>
              <div className="text-sm text-zinc-500">Canali Notifica</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <LandingSection id="pricing">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-4">
              Prezzi
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Piani semplici e trasparenti
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Scegli il piano piu&apos; adatto alle tue esigenze. Inizia gratis, passa a Professional o
              Agency quando ne hai bisogno.
            </p>

            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={`text-sm ${!annual ? 'text-white' : 'text-zinc-500'}`}>Mensile</span>
              <button
                onClick={() => setAnnual(!annual)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${annual ? 'bg-emerald-500' : 'bg-zinc-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${annual ? 'translate-x-6' : ''}`} />
              </button>
              <span className={`text-sm ${annual ? 'text-white' : 'text-zinc-500'}`}>
                Annuale <span className="text-emerald-400 text-xs font-medium">-17%</span>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${
                  plan.popular
                    ? 'bg-[#141414] border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)] scale-[1.02]'
                    : 'bg-[#141414] border-white/10 hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-xs font-semibold">
                      Piu&apos; Popolare
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-zinc-500 text-sm">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-bold text-white">
                      €{annual ? plan.priceAnnual : plan.price}
                    </span>
                    {(annual ? plan.priceAnnual : plan.price) !== '0' && (
                      <span className="text-zinc-500 text-sm">/mese</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 flex-grow mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-2.5">
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 ${
                          feature.included ? 'text-emerald-400' : 'text-zinc-700'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          feature.included ? 'text-zinc-300' : 'text-zinc-600'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href}>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-zinc-500 text-sm mt-8">
            Hai piu&apos; di 300 siti?{' '}
            <Link href="/contact" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
              Contattaci per un piano Enterprise personalizzato
            </Link>
          </p>
        </div>
      </LandingSection>

      {/* ── FAQ ── */}
      <LandingSection id="faq">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-4">FAQ</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">Domande frequenti</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-white font-medium pr-4">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-zinc-500 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-200 ${openFaq === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 pb-5 text-zinc-400 text-sm leading-relaxed">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </LandingSection>

      {/* ── CTA Section ── */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-sky-600" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            Hai bisogno di informazioni?
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Contattaci per saperne di piu&apos; sulla nostra piattaforma di monitoraggio
            professionale per webmaster e agenzie.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="mailto:support@webmaster-monitor.com">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-white/90 gap-2 font-semibold"
              >
                <Headphones className="h-4 w-4" />
                Contattaci
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 hover:border-white/60 text-white bg-transparent hover:bg-white/10"
              >
                Accedi <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/50">
            Nessuna carta di credito richiesta
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0A0A0A] border-t border-white/5 py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Logo + tagline */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold leading-tight text-white">Webmaster</span>
                  <span className="text-[10px] text-zinc-500 leading-tight -mt-0.5 tracking-widest">MONITOR</span>
                </div>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed">
                La piattaforma di monitoraggio professionale per webmaster e agenzie.
              </p>
            </div>

            {/* Prodotto */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Prodotto</h4>
              <ul className="space-y-2.5 text-sm text-zinc-500">
                <li><a href="#come-funziona" className="hover:text-emerald-400 transition-colors">Come funziona</a></li>
                <li><a href="#features" className="hover:text-emerald-400 transition-colors">Funzionalit&agrave;</a></li>
                <li><a href="#pricing" className="hover:text-emerald-400 transition-colors">Prezzi</a></li>
                <li><a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Supporto */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Supporto</h4>
              <ul className="space-y-2.5 text-sm text-zinc-500">
                <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contatti</Link></li>
                <li>
                  <a href="mailto:support@webmaster-monitor.com" className="hover:text-emerald-400 transition-colors">
                    Assistenza
                  </a>
                </li>
              </ul>
            </div>

            {/* Legale */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Legale</h4>
              <ul className="space-y-2.5 text-sm text-zinc-500">
                <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Termini di Servizio</Link></li>
                <li><Link href="/cookies" className="hover:text-emerald-400 transition-colors">Cookie Policy</Link></li>
                <li><Link href="/gdpr" className="hover:text-emerald-400 transition-colors">GDPR</Link></li>
                <li><CookieSettingsButton /></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-600">
              &copy; {new Date().getFullYear()} Webmaster Monitor. Tutti i diritti riservati.
            </p>
            <div className="flex items-center gap-5 text-zinc-600">
              <Link href="https://twitter.com" className="hover:text-emerald-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
              <Link href="https://github.com" className="hover:text-emerald-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link href="https://linkedin.com" className="hover:text-emerald-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

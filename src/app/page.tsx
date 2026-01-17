'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Bell,
  Globe,
  BarChart3,
  Clock,
  CheckCircle2,
  ArrowRight,
  Server,
  Lock,
  Gauge,
  Users,
  Headphones,
  Menu,
  X,
} from 'lucide-react';
import { CookieSettingsButton } from '@/components/cookie-banner';

const features = [
  {
    icon: Activity,
    title: 'Monitoraggio Uptime',
    description: 'Controllo continuo della disponibilità dei tuoi siti con intervalli personalizzabili da 1 a 60 minuti.',
  },
  {
    icon: Shield,
    title: 'Controllo SSL',
    description: 'Monitora la validità dei certificati SSL e ricevi avvisi prima della scadenza.',
  },
  {
    icon: Zap,
    title: 'Analisi Performance',
    description: 'Metriche dettagliate su tempi di risposta e Core Web Vitals per ottimizzare le prestazioni.',
  },
  {
    icon: Bell,
    title: 'Notifiche Intelligenti',
    description: 'Avvisi istantanei via email, Slack, Telegram, Discord o webhook quando qualcosa va storto.',
  },
  {
    icon: Globe,
    title: 'Multi-Piattaforma',
    description: 'Supporto nativo per WordPress, PrestaShop e qualsiasi altro sito web.',
  },
  {
    icon: BarChart3,
    title: 'Report Dettagliati',
    description: 'Dashboard intuitive e report esportabili per tenere traccia dello storico.',
  },
];

const plans = [
  {
    name: 'Starter',
    price: '9',
    description: 'Perfetto per freelancer e piccoli progetti',
    features: [
      'Fino a 5 siti',
      'Controllo ogni 5 minuti',
      'Notifiche email',
      'Storico 7 giorni',
      'Supporto email',
    ],
    cta: 'Contattaci',
    popular: false,
  },
  {
    name: 'Pro',
    price: '29',
    description: 'Ideale per agenzie e professionisti',
    features: [
      'Fino a 25 siti',
      'Controllo ogni 1 minuto',
      'Notifiche multi-canale',
      'Storico 30 giorni',
      'API access',
      'Supporto prioritario',
    ],
    cta: 'Contattaci',
    popular: true,
  },
  {
    name: 'Agency',
    price: '79',
    description: 'Per agenzie con molti clienti',
    features: [
      'Siti illimitati',
      'Controllo ogni 30 secondi',
      'White-label reports',
      'Storico illimitato',
      'Multi-tenant',
      'Account manager dedicato',
    ],
    cta: 'Contattaci',
    popular: false,
  },
];

const benefits = [
  {
    icon: Clock,
    title: 'Risparmia Tempo',
    description: 'Automazione completa del monitoraggio, niente più controlli manuali.',
  },
  {
    icon: Lock,
    title: 'Sicurezza Garantita',
    description: 'Dati crittografati e conformità GDPR per la massima protezione.',
  },
  {
    icon: Gauge,
    title: 'Prestazioni Ottimali',
    description: 'Identifica i colli di bottiglia e migliora la velocità dei tuoi siti.',
  },
  {
    icon: Users,
    title: 'Lavora in Team',
    description: 'Collabora con il tuo team con ruoli e permessi personalizzati.',
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '#features', label: 'Funzionalita\'' },
    { href: '#pricing', label: 'Prezzi' },
    { href: '#benefits', label: 'Vantaggi' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Server className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight">Webmaster</span>
              <span className="text-[10px] text-muted-foreground leading-tight -mt-0.5">MONITOR</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Accedi</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Inizia Gratis</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Apri menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Menu navigazione</SheetTitle>
              <div className="flex flex-col gap-6 mt-6">
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2.5 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="border-t pt-4 flex flex-col gap-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Accedi</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Inizia Gratis</Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            Nuovo: Integrazione PageSpeed API
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Monitora i tuoi siti web
            <br />
            <span className="text-primary">24 ore su 24</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            La piattaforma completa per webmaster e agenzie. Uptime, SSL, performance
            e notifiche in tempo reale per WordPress, PrestaShop e qualsiasi sito web.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Accedi alla Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Scopri le Funzionalità
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">99.9%</div>
              <div className="text-muted-foreground">Uptime Garantito</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">50ms</div>
              <div className="text-muted-foreground">Latenza Media</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">10k+</div>
              <div className="text-muted-foreground">Siti Monitorati</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">24/7</div>
              <div className="text-muted-foreground">Supporto Attivo</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Funzionalità</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tutto ciò che serve per monitorare i tuoi siti
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Una suite completa di strumenti per tenere sotto controllo performance,
              disponibilità e sicurezza dei tuoi siti web.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Prezzi</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Piani semplici e trasparenti
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Scegli il piano più adatto alle tue esigenze. Tutti includono una prova gratuita di 14 giorni.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${plan.popular ? 'border-primary border-2 scale-105' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Più Popolare
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="py-4">
                    <span className="text-4xl font-bold">€{plan.price}</span>
                    <span className="text-muted-foreground">/mese</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-grow">
                  <ul className="space-y-3 flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6" variant={plan.popular ? 'default' : 'outline'}>
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Vantaggi</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perché scegliere Webmaster Monitor?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Non solo monitoraggio, ma un partner affidabile per la gestione dei tuoi siti web.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Hai bisogno di informazioni?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Contattaci per saperne di più sulla nostra piattaforma di monitoraggio
            professionale per webmaster e agenzie.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="mailto:support@webmaster-monitor.com">
              <Button size="lg" variant="secondary" className="gap-2">
                <Headphones className="mr-2 h-4 w-4" />
                Contattaci
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-black text-primary-foreground hover:bg-primary-foreground hover:text-black">
                Accedi <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                  <Server className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold leading-tight">Webmaster</span>
                  <span className="text-[10px] text-muted-foreground leading-tight -mt-0.5">MONITOR</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                La piattaforma di monitoraggio professionale per webmaster e agenzie.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Prodotto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Funzionalita</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">Prezzi</Link></li>
                <li><Link href="#benefits" className="hover:text-foreground">Vantaggi</Link></li>
                <li><Link href="/login" className="hover:text-foreground">Accedi</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Supporto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/contact" className="hover:text-foreground">Contatti</Link></li>
                <li><a href="mailto:support@webmaster-monitor.com" className="hover:text-foreground">Assistenza</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legale</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Termini di Servizio</Link></li>
                <li><Link href="/cookies" className="hover:text-foreground">Cookie Policy</Link></li>
                <li><Link href="/gdpr" className="hover:text-foreground">GDPR</Link></li>
                <li><CookieSettingsButton /></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Webmaster Monitor. Tutti i diritti riservati.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Link href="https://twitter.com" className="hover:text-foreground">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Link>
              <Link href="https://github.com" className="hover:text-foreground">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                </svg>
              </Link>
              <Link href="https://linkedin.com" className="hover:text-foreground">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

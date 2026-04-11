import type { Metadata } from 'next';
import Link from 'next/link';
import { Activity, Shield, Zap, Bell, Plug, Globe } from 'lucide-react';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: "Funzionalita'",
  description:
    "Tutte le funzionalita' di Webmaster Monitor: uptime, SSL, performance, avvisi e integrazioni per webmaster e agenzie.",
};

const features = [
  {
    icon: Activity,
    label: 'Monitoraggio Uptime',
    description: "Controlla la disponibilita' dei tuoi siti ogni minuto con notifiche istantanee in caso di downtime.",
    href: '/features/uptime',
    accent: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    link: 'text-emerald-400',
  },
  {
    icon: Shield,
    label: 'Monitoraggio SSL',
    description: "Avvisi automatici prima della scadenza dei certificati. Mai piu' downtime per SSL scaduti.",
    href: '/features/ssl',
    accent: 'text-sky-400',
    iconBg: 'bg-sky-500/10 border-sky-500/20',
    link: 'text-sky-400',
  },
  {
    icon: Zap,
    label: 'Performance',
    description: 'Core Web Vitals in tempo reale tramite Google PageSpeed API. Monitora LCP, CLS e TTFB.',
    href: '/features/performance',
    accent: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    link: 'text-amber-400',
  },
  {
    icon: Bell,
    label: 'Sistema Avvisi',
    description: 'Notifiche intelligenti su Email, Slack, Telegram, Discord e webhook personalizzati.',
    href: '/features/alerts',
    accent: 'text-violet-400',
    iconBg: 'bg-violet-500/10 border-violet-500/20',
    link: 'text-violet-400',
  },
  {
    icon: Plug,
    label: 'Integrazioni',
    description: "WordPress, PrestaShop, cPanel, Plesk, Vercel e molti altri strumenti gia' integrati.",
    href: '/features/integrations',
    accent: 'text-pink-400',
    iconBg: 'bg-pink-500/10 border-pink-500/20',
    link: 'text-pink-400',
  },
  {
    icon: Globe,
    label: 'Gestione Portfolio',
    description: 'Gestisci tutti i tuoi siti da un unico pannello. Vista d\'insieme per agenzie e freelance.',
    href: '/features/uptime',
    accent: 'text-teal-400',
    iconBg: 'bg-teal-500/10 border-teal-500/20',
    link: 'text-teal-400',
  },
];

export default function FeaturesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: "Funzionalita'", url: '/features' },
        ])}
      />
      <div className="container mx-auto px-4 md:px-6 py-24">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
          Funzionalit&agrave;
        </h1>
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto">
          Tutto ci&ograve; che serve per monitorare i tuoi siti web.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.href + feature.label}
              className="bg-[#141414] border border-white/10 rounded-2xl p-8 flex flex-col gap-5 hover:border-white/20 transition-colors"
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center ${feature.iconBg}`}
              >
                <Icon className={`h-6 w-6 ${feature.accent}`} />
              </div>

              {/* Text */}
              <div className="flex-1">
                <h2 className="text-white font-semibold text-lg mb-2">{feature.label}</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
              </div>

              {/* Link */}
              <Link
                href={feature.href}
                className={`text-sm font-medium ${feature.link} hover:underline inline-flex items-center gap-1`}
              >
                Scopri di pi&ugrave; &rarr;
              </Link>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}

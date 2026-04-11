import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, Shield } from 'lucide-react';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Monitoraggio SSL',
  description:
    "Monitora la scadenza dei certificati SSL dei tuoi siti e ricevi avvisi prima che scadano.",
};

const details = [
  {
    title: 'Avvisi anticipati',
    description: 'Notifiche a 30, 14 e 7 giorni dalla scadenza del certificato.',
  },
  {
    title: 'Verifica catena',
    description:
      'Controllo completo della catena di certificazione, non solo il certificato foglia.',
  },
  {
    title: 'Supporto multi-provider',
    description: "Let's Encrypt, Comodo, DigiCert, Cloudflare e qualsiasi CA.",
  },
  {
    title: 'Auto-detection',
    description:
      'Rilevamento automatico dei certificati SSL su tutti i domini monitorati.',
  },
];

export default function SslPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: "Funzionalita'", url: '/features' },
          { name: 'SSL', url: '/features/ssl' },
        ])}
      />
      <div className="container mx-auto px-4 md:px-6 py-24 max-w-4xl">
      {/* Badge */}
      <div className="mb-6">
        <span className="inline-block px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-semibold tracking-widest uppercase">
          Sicurezza
        </span>
      </div>

      {/* Hero */}
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">
        Certificati SSL sempre sotto controllo
      </h1>
      <p className="text-zinc-400 text-lg md:text-xl mb-14 max-w-2xl">
        Monitora scadenze, validit&agrave; e catena dei certificati. Mai pi&ugrave; downtime per
        certificati scaduti.
      </p>

      {/* Visual */}
      <div className="flex justify-center mb-16">
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

      {/* Feature details */}
      <div className="grid sm:grid-cols-2 gap-6 mb-16">
        {details.map((d) => (
          <div
            key={d.title}
            className="bg-[#141414] border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-white font-semibold mb-2">{d.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{d.description}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/register"
          className="inline-block bg-sky-500 hover:bg-sky-400 text-black font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Proteggi i tuoi siti
        </Link>
      </div>
    </div>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Zap } from 'lucide-react';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Monitoraggio Performance',
  description:
    'Analizza le performance dei tuoi siti con Core Web Vitals, tempi di risposta e metriche dettagliate.',
};

const details = [
  {
    title: 'Google PageSpeed API',
    description: 'Dati reali da Google per tutti e 4 i Core Web Vitals.',
  },
  {
    title: 'Trend nel tempo',
    description:
      'Monitora come cambiano le performance nel tempo con grafici dettagliati.',
  },
  {
    title: 'Alert degradamento',
    description:
      'Notifiche automatiche quando le performance scendono sotto le soglie.',
  },
  {
    title: 'Score sintetico',
    description:
      'Punteggio 0-100 per capire a colpo d\u2019occhio lo stato di ogni sito.',
  },
];

export default function PerformancePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: "Funzionalita'", url: '/features' },
          { name: 'Performance', url: '/features/performance' },
        ])}
      />
      <div className="container mx-auto px-4 md:px-6 py-24 max-w-4xl">
      {/* Badge */}
      <div className="mb-6">
        <span className="inline-block px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold tracking-widest uppercase">
          Performance
        </span>
      </div>

      {/* Hero */}
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">
        Core Web Vitals in tempo reale
      </h1>
      <p className="text-zinc-400 text-lg md:text-xl mb-14 max-w-2xl">
        Integrazione Google PageSpeed per monitorare LCP, FID, CLS e TTFB.
      </p>

      {/* Visual */}
      <div className="flex justify-center mb-16">
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
          className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Ottimizza le performance
        </Link>
      </div>
    </div>
    </>
  );
}

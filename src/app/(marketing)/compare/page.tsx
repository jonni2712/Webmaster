import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, X } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Confronto competitor',
  description: "Confronta Webmaster Monitor con altre soluzioni di monitoraggio. Scopri perché siamo la scelta migliore per webmaster e agenzie.",
};

type CellValue = string | boolean;

const rows: { feature: string; wm: CellValue; uptimerobot: CellValue; betterstack: CellValue; pingdom: CellValue }[] = [
  { feature: 'Prezzo base',        wm: '€19/mo',  uptimerobot: '$7/mo',   betterstack: '$29/mo', pingdom: '$15/mo' },
  { feature: 'Siti inclusi',       wm: '30',       uptimerobot: '50',      betterstack: '10',     pingdom: '10' },
  { feature: '€/sito',             wm: '€0.63',    uptimerobot: '$0.14',   betterstack: '$2.90',  pingdom: '$1.50' },
  { feature: 'Check minimo',       wm: '1 min',    uptimerobot: '1 min',   betterstack: '30s',    pingdom: '1 min' },
  { feature: 'SSL monitoring',     wm: true,       uptimerobot: false,     betterstack: true,     pingdom: true },
  { feature: 'Core Web Vitals',    wm: true,       uptimerobot: false,     betterstack: false,    pingdom: true },
  { feature: 'WordPress plugin',   wm: true,       uptimerobot: false,     betterstack: false,    pingdom: false },
  { feature: 'CMS update tracking',wm: true,       uptimerobot: false,     betterstack: false,    pingdom: false },
  { feature: 'Server agent',       wm: true,       uptimerobot: false,     betterstack: false,    pingdom: false },
  { feature: 'CRM clienti',        wm: true,       uptimerobot: false,     betterstack: false,    pingdom: false },
  { feature: 'Telegram/Discord',   wm: true,       uptimerobot: true,      betterstack: true,     pingdom: false },
  { feature: 'GDPR / Dati in UE',  wm: true,       uptimerobot: false,     betterstack: false,    pingdom: true },
  { feature: 'Interfaccia italiano',wm: true,       uptimerobot: false,     betterstack: false,    pingdom: false },
];

const differentiators = [
  {
    title: 'Fatto per il mercato italiano',
    description: 'Interfaccia in italiano, dati in Europa, supporto GDPR nativo.',
  },
  {
    title: 'Più di un uptime monitor',
    description: 'WordPress plugin, agent cPanel, CRM clienti — tutto integrato.',
  },
  {
    title: 'Prezzo giusto per le agenzie',
    description: 'Da €0.43/sito con il piano Agency. I competitor partono da €1.50/sito.',
  },
];

function Cell({ value }: { value: CellValue }) {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
    ) : (
      <X className="w-5 h-5 text-zinc-600 mx-auto" />
    );
  }
  return <span className="text-zinc-300 text-sm">{value}</span>;
}

export default function ComparePage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Perch&eacute; scegliere Webmaster Monitor?
        </h1>
      </div>

      {/* Comparison table */}
      <div className="max-w-5xl mx-auto mb-20 overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Header */}
          <div className="grid grid-cols-5 border border-white/10 rounded-t-2xl overflow-hidden">
            <div className="bg-white/5 px-5 py-4 text-zinc-500 text-sm font-semibold border-r border-white/5">
              Funzionalit&agrave;
            </div>
            <div className="bg-emerald-500/5 border-r border-white/5 px-5 py-4 text-center">
              <span className="text-emerald-400 font-bold text-sm">Webmaster Monitor</span>
            </div>
            <div className="bg-white/5 border-r border-white/5 px-5 py-4 text-center">
              <span className="text-zinc-400 font-semibold text-sm">UptimeRobot</span>
            </div>
            <div className="bg-white/5 border-r border-white/5 px-5 py-4 text-center">
              <span className="text-zinc-400 font-semibold text-sm">Better Stack</span>
            </div>
            <div className="bg-white/5 px-5 py-4 text-center">
              <span className="text-zinc-400 font-semibold text-sm">Pingdom</span>
            </div>
          </div>

          {/* Rows */}
          <div className="border-l border-r border-b border-white/10 rounded-b-2xl overflow-hidden">
            {rows.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-5 ${i < rows.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <div className="px-5 py-3.5 text-zinc-400 text-sm border-r border-white/5 flex items-center">
                  {row.feature}
                </div>
                <div className="bg-emerald-500/5 border-r border-white/5 px-5 py-3.5 flex items-center justify-center">
                  <Cell value={row.wm} />
                </div>
                <div className="border-r border-white/5 px-5 py-3.5 flex items-center justify-center">
                  <Cell value={row.uptimerobot} />
                </div>
                <div className="border-r border-white/5 px-5 py-3.5 flex items-center justify-center">
                  <Cell value={row.betterstack} />
                </div>
                <div className="px-5 py-3.5 flex items-center justify-center">
                  <Cell value={row.pingdom} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key differentiators */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          I nostri punti di forza
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {differentiators.map((d) => (
            <div
              key={d.title}
              className="bg-[#141414] border border-white/10 hover:border-emerald-500/30 rounded-2xl p-6 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{d.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{d.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-3.5 rounded-xl transition-colors text-lg"
        >
          Prova gratis per 14 giorni &rarr;
        </Link>
      </div>
    </div>
  );
}

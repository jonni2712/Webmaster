import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Monitoraggio Uptime',
  description:
    "Monitora la disponibilita' dei tuoi siti in tempo reale con controlli ogni minuto e notifiche immediate.",
};

const details = [
  {
    title: 'Intervalli configurabili',
    description:
      "Scegli la frequenza di controllo: ogni 1, 3, 5 o 15 minuti in base al tuo piano.",
  },
  {
    title: 'Notifiche multi-canale',
    description:
      'Email, Slack, Telegram, Discord o webhook. Scegli dove ricevere gli avvisi.',
  },
  {
    title: 'Storico dettagliato',
    description:
      'Consulta lo storico completo degli uptime check con tempi di risposta e codici HTTP.',
  },
  {
    title: 'Report automatici',
    description:
      "Report di disponibilita' esportabili per i tuoi clienti.",
  },
];

const bars = [60, 75, 65, 80, 72, 88, 70, 95, 82, 90, 78, 100];

export default function UptimePage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24 max-w-4xl">
      {/* Badge */}
      <div className="mb-6">
        <span className="inline-block px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-widest uppercase">
          Uptime
        </span>
      </div>

      {/* Hero */}
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">
        Sai sempre se i tuoi siti sono online
      </h1>
      <p className="text-zinc-400 text-lg md:text-xl mb-14 max-w-2xl">
        Monitoraggio continuo con intervalli da 1 a 15 minuti. Notifiche istantanee quando
        qualcosa va storto.
      </p>

      {/* Visual */}
      <div className="flex justify-center mb-16">
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
          <div className="flex items-end gap-1 h-10">
            {bars.map((h, i) => (
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
          className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Inizia a monitorare i tuoi siti
        </Link>
      </div>
    </div>
  );
}

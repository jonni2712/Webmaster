import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Zap, Eye } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Chi siamo',
  description:
    'Scopri il team dietro Webmaster Monitor, la piattaforma di monitoraggio professionale per webmaster e agenzie italiane.',
};

const values = [
  {
    icon: Eye,
    title: 'Trasparenza',
    description:
      'Prezzi chiari, nessun costo nascosto. Sai sempre cosa paghi e cosa ottieni in ogni piano.',
  },
  {
    icon: ShieldCheck,
    title: 'Affidabilit\u00e0',
    description:
      'La nostra piattaforma monitora 24/7 con uptime del 99.9%. Se il tuo sito va gi\u00f9, lo saprai prima dei tuoi clienti.',
  },
  {
    icon: Zap,
    title: 'Semplicit\u00e0',
    description:
      'Setup in 3 minuti, dashboard intuitiva. Nessuna curva di apprendimento, operativo da subito.',
  },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Costruito da webmaster, per webmaster
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed">
          Uno strumento professionale pensato da chi gestisce siti web ogni giorno.
        </p>
      </div>

      {/* Mission */}
      <div className="max-w-3xl mx-auto mb-20">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 md:p-10 space-y-5">
          <h2 className="text-2xl font-bold text-white">La nostra storia</h2>
          <p className="text-zinc-400 leading-relaxed">
            Webmaster Monitor nasce dall&apos;esigenza reale di monitorare decine di siti web senza
            impazzire. Dopo anni a controllare manualmente uptime, certificati SSL e aggiornamenti
            per i nostri clienti, abbiamo deciso di costruire lo strumento che avremmo sempre voluto
            avere.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            La nostra missione &egrave; semplice: dare ai webmaster e alle agenzie italiane uno
            strumento professionale, affidabile e facile da usare per tenere sotto controllo tutti i
            loro siti.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="mb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-10">I nostri valori</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <div
                key={value.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">{value.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{value.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Made in Italy */}
      <div className="mb-20 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="text-3xl mb-4">🇮🇹</div>
        <h2 className="text-xl font-bold text-white mb-2">Made in Italy</h2>
        <p className="text-zinc-400 max-w-xl mx-auto">
          Progettato e sviluppato in Italia. Dati ospitati in Europa, conformi al GDPR. Il tuo
          investimento resta in mani europee.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Pronto a provare?</h2>
        <p className="text-zinc-400 mb-6">
          Inizia gratuitamente, senza carta di credito. Setup in 3 minuti.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Crea il tuo account gratuito
        </Link>
      </div>
    </div>
  );
}

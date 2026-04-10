import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Guida Rapida — Documentazione',
  description: 'Inizia a usare Webmaster Monitor in pochi minuti. Guida passo dopo passo per configurare il monitoraggio.',
};

const steps = [
  {
    number: 1,
    title: 'Registrazione',
    description:
      'Crea un account gratuito su webmaster-monitor.it/register. Non serve carta di credito. Riceverai un\'email di verifica — clicca il link per attivare l\'account.',
  },
  {
    number: 2,
    title: 'Aggiungi il primo sito',
    description:
      'Dalla dashboard, clicca \'Aggiungi Sito\'. Inserisci l\'URL del sito (es. https://example.com). Scegli la piattaforma (WordPress, PrestaShop, Next.js o Altro). Conferma.',
  },
  {
    number: 3,
    title: 'Configura l\'intervallo di controllo',
    description:
      'L\'intervallo predefinito è ogni 15 minuti (piano Starter). Con i piani Pro e superiori puoi scendere fino a 1 minuto.',
  },
  {
    number: 4,
    title: 'Imposta le notifiche',
    description:
      'Vai in Impostazioni > Notifiche. Aggiungi i canali: email (già attivo), Slack, Telegram, Discord o webhook. Testa ogni canale con il pulsante \'Invia test\'.',
  },
  {
    number: 5,
    title: 'Installa il plugin (opzionale)',
    description:
      'Per WordPress e PrestaShop, installa il plugin dalla sezione Plugin nella dashboard. Questo abilita il sync automatico di aggiornamenti, versioni e dati e-commerce.',
  },
];

export default function QuickstartPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-10">
        <Link href="/docs" className="hover:text-zinc-300 transition-colors">
          Documentazione
        </Link>
        <span>/</span>
        <span className="text-zinc-300">Guida Rapida</span>
      </nav>

      {/* Hero */}
      <div className="mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Guida Rapida</h1>
        <p className="text-zinc-400 text-lg">
          Inizia a monitorare i tuoi siti in meno di 3 minuti.
        </p>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-10">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-6">
            {/* Number badge */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                <span className="text-black font-bold text-sm">{step.number}</span>
              </div>
            </div>
            {/* Content */}
            <div className="pt-1.5">
              <h2 className="text-white font-semibold text-xl mb-2">{step.title}</h2>
              <p className="text-zinc-400 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Next steps */}
      <div className="mt-16 border-t border-white/10 pt-10">
        <h3 className="text-white font-semibold text-lg mb-4">Esplora anche:</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/docs/wordpress"
            className="flex-1 bg-[#141414] border border-white/10 hover:border-emerald-500/30 rounded-xl p-5 transition-all"
          >
            <span className="text-emerald-400 font-medium text-sm">Plugin WordPress</span>
            <p className="text-zinc-400 text-sm mt-1">
              Collega i tuoi siti WordPress per dati avanzati.
            </p>
          </Link>
          <Link
            href="/docs/api"
            className="flex-1 bg-[#141414] border border-white/10 hover:border-emerald-500/30 rounded-xl p-5 transition-all"
          >
            <span className="text-emerald-400 font-medium text-sm">API Reference</span>
            <p className="text-zinc-400 text-sm mt-1">
              Accesso programmatico a tutti i dati di monitoraggio.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

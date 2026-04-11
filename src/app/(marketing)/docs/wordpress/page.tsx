import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Plugin WordPress — Documentazione',
  description: 'Installa e configura il plugin WordPress di Webmaster Monitor per monitoraggio avanzato.',
};

const installSteps = [
  "Dalla dashboard di Webmaster Monitor, vai alla sezione Plugin",
  "Clicca 'Scarica Plugin' per ottenere il file .zip",
  "Nel pannello WordPress, vai su Plugin > Aggiungi nuovo > Carica plugin",
  "Seleziona il file .zip e clicca 'Installa ora'",
  "Attiva il plugin e inserisci la API Key dalla dashboard",
];

const features = [
  'Aggiornamenti disponibili (core, plugin, temi) con flag di sicurezza',
  'Versioni installate di WordPress, PHP e MySQL',
  'Dati WooCommerce: ordini, fatturato, prodotti (se presente)',
  'Stato salute del sito (WordPress Site Health)',
];

export default function WordpressDocsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Documentazione', url: '/docs' },
          { name: 'Plugin WordPress', url: '/docs/wordpress' },
        ])}
      />
      <div className="container mx-auto px-4 md:px-6 py-24 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-10">
        <Link href="/docs" className="hover:text-zinc-300 transition-colors">
          Documentazione
        </Link>
        <span>/</span>
        <span className="text-zinc-300">Plugin WordPress</span>
      </nav>

      {/* Hero */}
      <div className="mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Plugin WordPress</h1>
        <p className="text-zinc-400 text-lg">
          Collega i tuoi siti WordPress per monitoraggio avanzato.
        </p>
      </div>

      {/* Installation */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Installazione</h2>
        <div className="flex flex-col gap-4">
          {installSteps.map((step, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-0.5">
                <span className="text-emerald-400 text-xs font-bold">{i + 1}</span>
              </div>
              <p className="text-zinc-400 leading-relaxed pt-0.5">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">
          Funzionalit&agrave; quando connesso
        </h2>
        <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden">
          {features.map((feature, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-6 py-4 border-b border-white/5 last:border-0"
            >
              <span className="text-emerald-400 mt-0.5 flex-shrink-0 font-bold">&#10003;</span>
              <p className="text-zinc-400 text-sm leading-relaxed">{feature}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Troubleshooting */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Risoluzione problemi</h2>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
          <p className="text-amber-400 text-sm leading-relaxed">
            Se il plugin non si connette, verifica che il sito sia raggiungibile via HTTPS e che la
            API Key sia corretta.
          </p>
        </div>
      </section>
    </div>
    </>
  );
}

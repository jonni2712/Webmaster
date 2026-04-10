import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Integrazioni',
  description:
    "Integra Webmaster Monitor con WordPress, PrestaShop, Slack, Telegram, Discord e molti altri strumenti.",
};

const categories = [
  {
    heading: 'CMS e Framework',
    items: [
      {
        name: 'WordPress',
        description: 'Plugin nativo con sync aggiornamenti, versioni e WooCommerce.',
      },
      {
        name: 'PrestaShop',
        description: 'Monitoraggio moduli, temi e vendite.',
      },
      {
        name: 'Next.js',
        description: 'Integrazione Vercel deploy e performance.',
      },
    ],
  },
  {
    heading: 'Hosting',
    items: [
      {
        name: 'cPanel',
        description: 'Agent con monitoraggio risorse, account, DNS e SSL.',
      },
      {
        name: 'Plesk',
        description: 'Supporto completo come cPanel.',
      },
    ],
  },
  {
    heading: 'Notifiche',
    items: [
      {
        name: 'Slack',
        description: 'Canale dedicato per avvisi in tempo reale.',
      },
      {
        name: 'Telegram',
        description: 'Bot per notifiche istantanee.',
      },
      {
        name: 'Discord',
        description: 'Webhook per il tuo server.',
      },
      {
        name: 'Email',
        description: 'SMTP o Resend per notifiche affidabili.',
      },
      {
        name: 'Webhook',
        description: 'Endpoint personalizzato per qualsiasi integrazione.',
      },
    ],
  },
  {
    heading: 'Performance',
    items: [
      {
        name: 'Google PageSpeed',
        description: 'Core Web Vitals automatici.',
      },
      {
        name: 'Vercel',
        description: 'Deploy tracking e analytics.',
      },
    ],
  },
];

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24 max-w-4xl">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">
          Si integra con i tuoi strumenti
        </h1>
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto">
          Piattaforme CMS, pannelli hosting e canali di notifica &mdash; tutto collegato.
        </p>
      </div>

      {/* Integration categories */}
      <div className="space-y-12 mb-16">
        {categories.map((cat) => (
          <div key={cat.heading}>
            <h2 className="text-white font-semibold text-sm uppercase tracking-widest mb-4 text-emerald-400">
              {cat.heading}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.items.map((item) => (
                <div
                  key={item.name}
                  className="bg-[#141414] border border-white/5 rounded-xl p-6"
                >
                  <p className="text-white font-bold mb-1">{item.name}</p>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/register"
          className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Scopri tutte le integrazioni in azione
        </Link>
      </div>
    </div>
  );
}

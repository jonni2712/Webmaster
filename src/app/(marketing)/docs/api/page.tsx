import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'API Reference — Documentazione',
  description: 'Documentazione completa delle API di Webmaster Monitor. Integra il monitoraggio nei tuoi strumenti.',
};

const endpoints = [
  { method: 'GET', path: '/api/v1/sites', description: 'Lista tutti i siti' },
  { method: 'GET', path: '/api/v1/sites/:id', description: 'Dettaglio sito' },
  { method: 'POST', path: '/api/v1/sites', description: 'Aggiungi sito' },
  { method: 'GET', path: '/api/v1/sites/:id/uptime', description: 'Storico uptime' },
  { method: 'GET', path: '/api/v1/sites/:id/ssl', description: 'Stato SSL' },
  { method: 'GET', path: '/api/v1/sites/:id/performance', description: 'Metriche performance' },
  { method: 'GET', path: '/api/v1/alerts', description: 'Lista alert attivi' },
  { method: 'POST', path: '/api/v1/alerts/:id/acknowledge', description: 'Acknowledge alert' },
];

const methodColor: Record<string, string> = {
  GET: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  POST: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
};

export default function ApiReferencePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Documentazione', url: '/docs' },
          { name: 'API Reference', url: '/docs/api' },
        ])}
      />
      <div className="container mx-auto px-4 md:px-6 py-24 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-10">
        <Link href="/docs" className="hover:text-zinc-300 transition-colors">
          Documentazione
        </Link>
        <span>/</span>
        <span className="text-zinc-300">API Reference</span>
      </nav>

      {/* Hero */}
      <div className="mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">API Reference</h1>
        <p className="text-zinc-400 text-lg">
          Accesso programmatico a tutti i dati di monitoraggio.
        </p>
      </div>

      {/* Auth */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Autenticazione</h2>
        <p className="text-zinc-400 leading-relaxed mb-6">
          Tutte le richieste richiedono un header{' '}
          <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-sm">
            Authorization
          </code>{' '}
          con il tuo API token. Puoi generare un token dalla sezione{' '}
          <span className="text-zinc-300">Impostazioni &gt; API</span> nella dashboard.
        </p>
        <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-5">
          <code className="text-emerald-400 text-sm font-mono">
            Authorization: Bearer wm_xxxxxxxxxxxxx
          </code>
        </div>
      </section>

      {/* Endpoints */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Endpoints</h2>
        <div className="border border-white/10 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[100px_1fr_1fr] bg-white/5 px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-white/5">
            <span>Metodo</span>
            <span>Endpoint</span>
            <span>Descrizione</span>
          </div>
          {/* Rows */}
          {endpoints.map((ep, i) => (
            <div
              key={i}
              className="grid grid-cols-[100px_1fr_1fr] px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
            >
              <span>
                <span
                  className={`inline-block text-xs font-bold px-2 py-0.5 rounded border ${methodColor[ep.method]}`}
                >
                  {ep.method}
                </span>
              </span>
              <code className="text-zinc-300 text-sm font-mono self-center">{ep.path}</code>
              <span className="text-zinc-400 text-sm self-center">{ep.description}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Rate limits */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Rate Limits</h2>
        <p className="text-zinc-400 leading-relaxed">
          L&apos;API è limitata a <span className="text-zinc-300">100 richieste al minuto</span> per
          token. Disponibile con i piani Business e Agency.
        </p>
      </section>

      {/* Beta note */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
        <p className="text-amber-400 text-sm leading-relaxed">
          L&apos;API pubblica è attualmente in beta. La documentazione completa OpenAPI sarà
          disponibile a breve.
        </p>
      </div>
    </div>
    </>
  );
}

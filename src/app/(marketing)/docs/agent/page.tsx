import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Agent cPanel/Plesk — Documentazione',
  description: "Installa l'agent Webmaster Monitor su server cPanel e Plesk per monitorare risorse, account e certificati SSL.",
};

const requirements = [
  'Server con cPanel o Plesk',
  'Accesso root o sudo',
  'PHP 7.4+',
  'cURL',
];

const installSteps = [
  'Dalla dashboard, vai su Server > Aggiungi Server',
  'Copia il comando di installazione one-line',
  'Esegui il comando sul server via SSH',
  "L'agent si registra automaticamente e inizia a inviare dati",
];

const monitored = [
  'Risorse server: CPU, RAM, disco in tempo reale',
  'Account hosting: lista completa con domini e spazio',
  'Certificati SSL: rilevamento automatico per tutti i domini',
  'Zone DNS: record A, CNAME, MX, TXT',
  'Database: lista MySQL/PostgreSQL con dimensioni',
  'Email: account email con quota utilizzata',
  'Backup: stato e schedulazione backup',
];

export default function AgentDocsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Documentazione', url: '/docs' },
          { name: 'Agent', url: '/docs/agent' },
        ])}
      />
      <div className="container mx-auto px-4 md:px-6 py-24 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-10">
        <Link href="/docs" className="hover:text-zinc-300 transition-colors">
          Documentazione
        </Link>
        <span>/</span>
        <span className="text-zinc-300">Agent cPanel/Plesk</span>
      </nav>

      {/* Hero */}
      <div className="mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Agent per Server</h1>
        <p className="text-zinc-400 text-lg">
          Monitora risorse, account e servizi direttamente dal server.
        </p>
      </div>

      {/* Requirements */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Requisiti</h2>
        <div className="flex flex-wrap gap-2">
          {requirements.map((req) => (
            <span
              key={req}
              className="bg-white/5 border border-white/10 text-zinc-300 text-sm px-3 py-1.5 rounded-lg"
            >
              {req}
            </span>
          ))}
        </div>
      </section>

      {/* Installation */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Installazione</h2>
        <div className="flex flex-col gap-4 mb-6">
          {installSteps.map((step, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-0.5">
                <span className="text-emerald-400 text-xs font-bold">{i + 1}</span>
              </div>
              <p className="text-zinc-400 leading-relaxed pt-0.5">{step}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-5 overflow-x-auto">
          <code className="text-emerald-400 text-sm font-mono whitespace-nowrap">
            curl -sSL https://webmaster-monitor.it/install.sh | sudo bash -s -- --token=YOUR_TOKEN
          </code>
        </div>
      </section>

      {/* What it monitors */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Cosa monitora l&apos;agent</h2>
        <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden">
          {monitored.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-6 py-4 border-b border-white/5 last:border-0"
            >
              <span className="text-emerald-400 mt-0.5 flex-shrink-0 font-bold">&#10003;</span>
              <p className="text-zinc-400 text-sm leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Sicurezza</h2>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
          <p className="text-emerald-400 text-sm leading-relaxed">
            L&apos;agent comunica solo in uscita (outbound HTTPS) verso i nostri server. Non apre
            porte in ingresso. Il token di autenticazione &egrave; crittografato.
          </p>
        </div>
      </section>
    </div>
    </>
  );
}

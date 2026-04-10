import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog',
  description:
    "Tutte le novit\u00e0, aggiornamenti e miglioramenti di Webmaster Monitor.",
};

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  items: string[];
  type: 'feature' | 'improvement' | 'fix';
}

const entries: ChangelogEntry[] = [
  {
    version: 'v1.4.0',
    date: '10 Aprile 2026',
    title: 'Redesign completo e nuovi piani',
    type: 'feature',
    items: [
      'Nuova landing page con design professionale',
      '4 piani tariffari: Starter, Pro, Business, Agency',
      'Pricing annuale con sconto 17%',
      'Nuove pagine: documentazione, changelog, chi siamo',
    ],
  },
  {
    version: 'v1.3.0',
    date: '23 Marzo 2026',
    title: 'Agent cPanel/Plesk e Scanner Domini',
    type: 'feature',
    items: [
      'Agent per server cPanel e Plesk con monitoraggio risorse',
      'Scanner esterno DNS, SSL, CMS e WHOIS per tutti i domini',
      'Gestione portfolio domini con 5 viste diverse',
      'Supporto brand e relazioni tra domini',
    ],
  },
  {
    version: 'v1.2.0',
    date: '15 Marzo 2026',
    title: 'Team e Notifiche Multi-canale',
    type: 'feature',
    items: [
      'Gestione team con ruoli (owner, admin, member, viewer)',
      'Notifiche Slack, Telegram, Discord e webhook',
      'Gestione clienti (CRM) per agenzie',
      'Sistema alert con soglie personalizzabili',
    ],
  },
  {
    version: 'v1.1.0',
    date: '5 Marzo 2026',
    title: 'Core Web Vitals e WordPress Plugin',
    type: 'improvement',
    items: [
      'Integrazione Google PageSpeed API',
      'Plugin WordPress per sync dati',
      'Monitoraggio aggiornamenti core, plugin e temi',
      'Report performance esportabili',
    ],
  },
  {
    version: 'v1.0.0',
    date: '20 Febbraio 2026',
    title: 'Lancio iniziale',
    type: 'feature',
    items: [
      'Monitoraggio uptime con check configurabili',
      'Monitoraggio certificati SSL',
      'Dashboard con statistiche in tempo reale',
      'Notifiche email per downtime e scadenze',
    ],
  },
];

const typeConfig: Record<ChangelogEntry['type'], { label: string; className: string }> = {
  feature: {
    label: 'Novit\u00e0',
    className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  },
  improvement: {
    label: 'Miglioramento',
    className: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
  },
  fix: {
    label: 'Fix',
    className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  },
};

export default function ChangelogPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Changelog</h1>
        <p className="text-zinc-400 text-lg">
          Tutte le novit&agrave; e i miglioramenti della piattaforma.
        </p>
      </div>

      {/* Timeline */}
      <div className="max-w-2xl mx-auto">
        <div className="relative border-l-2 border-white/10 pl-8 space-y-12">
          {entries.map((entry) => {
            const config = typeConfig[entry.type];
            return (
              <div key={entry.version} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-[2.65rem] top-1.5 w-4 h-4 rounded-full bg-[#0A0A0A] border-2 border-emerald-500" />

                {/* Card */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-white font-bold font-mono">{entry.version}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
                      {config.label}
                    </span>
                    <span className="text-zinc-500 text-sm ml-auto">{entry.date}</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-semibold text-white mb-4">{entry.title}</h2>

                  {/* Items */}
                  <ul className="space-y-2">
                    {entry.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-zinc-400">
                        <span className="text-emerald-500 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-emerald-500 block" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

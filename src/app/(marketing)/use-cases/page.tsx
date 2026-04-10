import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Casi d'uso",
  description: "Scopri come webmaster e agenzie utilizzano Webmaster Monitor per monitorare i siti dei loro clienti.",
};

const useCases = [
  {
    title: 'Freelancer con 10-20 siti',
    plan: 'Pro',
    planPrice: '€19/mo',
    borderColor: 'border-l-emerald-500',
    planColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    scenario:
      'Gestisci i siti dei tuoi clienti e vuoi sapere subito se qualcosa va storto. Con il piano Pro monitori fino a 30 siti con check ogni 5 minuti. Ricevi notifiche su Telegram e dimostri ai clienti la tua professionalità con report automatici.',
    features: ['Uptime monitoring', 'Notifiche Telegram', 'SSL monitoring'],
  },
  {
    title: 'Agenzia con 50-80 siti',
    plan: 'Business',
    planPrice: '€49/mo',
    borderColor: 'border-l-sky-500',
    planColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    scenario:
      'La tua agenzia gestisce decine di siti per clienti diversi. Con il CRM integrato organizzi i clienti, assegni i siti e generi report per ciascuno. Il team ha accesso con ruoli diversi — il junior vede, il senior interviene.',
    features: ['CRM clienti', 'Gestione team', 'API access', 'Report automatici'],
  },
  {
    title: 'Agenzia con 100+ siti e server',
    plan: 'Agency',
    planPrice: '€129/mo',
    borderColor: 'border-l-violet-500',
    planColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    scenario:
      "Gestisci server dedicati con cPanel o Plesk e centinaia di siti. L'agent installato sui server ti dà visibilità completa su risorse, account e servizi. L'API ti permette di integrare i dati nel tuo sistema di ticketing.",
    features: ['Server agent', 'API completa', 'Check ogni minuto', 'Account manager dedicato'],
  },
];

export default function UseCasesPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Casi d&apos;uso</h1>
        <p className="text-zinc-400 text-lg">
          Come webmaster e agenzie usano Webmaster Monitor.
        </p>
      </div>

      {/* Use cases */}
      <div className="flex flex-col gap-8 max-w-3xl mx-auto mb-16">
        {useCases.map((uc) => (
          <div
            key={uc.title}
            className={`bg-[#141414] border border-white/10 border-l-4 ${uc.borderColor} rounded-2xl p-8`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <h2 className="text-white font-bold text-xl">{uc.title}</h2>
              <span
                className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-lg border ${uc.planColor}`}
              >
                Piano {uc.plan}
                <span className="text-xs font-normal opacity-75">{uc.planPrice}</span>
              </span>
            </div>

            {/* Scenario */}
            <p className="text-zinc-400 leading-relaxed mb-6">{uc.scenario}</p>

            {/* Features */}
            <div className="flex flex-wrap gap-2">
              {uc.features.map((f) => (
                <span
                  key={f}
                  className="bg-white/5 border border-white/10 text-zinc-300 text-xs px-3 py-1.5 rounded-lg"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-zinc-400 mb-4">Non sai quale piano scegliere?</p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Confronta i piani &rarr;
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stato della piattaforma',
  description: 'Stato operativo della piattaforma Webmaster Monitor e dei suoi servizi.',
};

const services = [
  'Dashboard Web',
  'API',
  'Uptime Checks',
  'SSL Checks',
  'Performance Checks',
  'Notifiche Email',
  'Notifiche Slack/Telegram',
  'Agent Server',
];

export default function StatusPage() {
  const lastUpdated = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="container mx-auto px-4 md:px-6 py-24 max-w-3xl">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Stato della piattaforma
        </h1>

        {/* Overall status */}
        <div className="inline-flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 font-semibold text-lg">
            Tutti i sistemi operativi
          </span>
        </div>
      </div>

      {/* Services grid */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden mb-8">
        {services.map((service, i) => (
          <div
            key={service}
            className={`flex items-center justify-between px-6 py-4 ${
              i < services.length - 1 ? 'border-b border-white/5' : ''
            }`}
          >
            <span className="text-zinc-300 text-sm font-medium">{service}</span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-emerald-400 text-sm">Operativo</span>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
        <p className="text-zinc-400 text-sm leading-relaxed">
          Questa pagina mostra lo stato corrente dei servizi. Per incidenti passati e manutenzioni
          programmate, contattaci.
        </p>
      </div>

      {/* Last updated */}
      <p className="text-center text-zinc-600 text-sm">
        Ultimo aggiornamento: {lastUpdated}
      </p>
    </div>
  );
}

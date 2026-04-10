import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sistema di Avvisi',
  description:
    'Ricevi notifiche immediate su email, Slack, Telegram, Discord e webhook quando un sito ha problemi.',
};

const details = [
  {
    title: '5 canali',
    description: 'Email, Slack, Telegram, Discord e webhook personalizzati.',
  },
  {
    title: 'Soglie configurabili',
    description:
      "Definisci quando un avviso \u00e8 critico, warning o informativo.",
  },
  {
    title: 'Cooldown',
    description:
      'Evita alert ripetitivi con periodi di cooldown personalizzabili.',
  },
  {
    title: 'Escalation',
    description:
      'Scala gli avvisi non gestiti a membri senior del team.',
  },
];

const mockAlerts = [
  {
    icon: AlertCircle,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-500/10 border-red-500/20',
    label: 'CRITICO',
    labelColor: 'text-red-400',
    message: 'miosito.it \u2014 Downtime rilevato',
    time: '2 min fa',
  },
  {
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    label: 'WARNING',
    labelColor: 'text-amber-400',
    message: 'shop.example.com \u2014 SSL scade tra 7 giorni',
    time: '1 ora fa',
  },
  {
    icon: Info,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    label: 'INFO',
    labelColor: 'text-blue-400',
    message: 'blog.example.com \u2014 Performance scesa a 78/100',
    time: '3 ore fa',
  },
];

export default function AlertsPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24 max-w-4xl">
      {/* Badge */}
      <div className="mb-6">
        <span className="inline-block px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold tracking-widest uppercase">
          Avvisi
        </span>
      </div>

      {/* Hero */}
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">
        Notifiche intelligenti, zero rumore
      </h1>
      <p className="text-zinc-400 text-lg md:text-xl mb-14 max-w-2xl">
        Ricevi solo gli avvisi che contano, sul canale che preferisci.
      </p>

      {/* Visual */}
      <div className="flex justify-center mb-16">
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-3">
          {mockAlerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <div
                key={alert.label + alert.message}
                className="flex items-start gap-3"
              >
                <div
                  className={`mt-0.5 h-8 w-8 flex-shrink-0 rounded-lg border flex items-center justify-center ${alert.iconBg}`}
                >
                  <Icon className={`h-4 w-4 ${alert.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold tracking-wider ${alert.labelColor}`}>
                      {alert.label}
                    </span>
                    <span className="text-[10px] text-zinc-600">{alert.time}</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-snug">{alert.message}</p>
                </div>
              </div>
            );
          })}
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
          className="inline-block bg-violet-500 hover:bg-violet-400 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Configura i tuoi avvisi
        </Link>
      </div>
    </div>
  );
}

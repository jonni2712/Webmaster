import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sistema di Avvisi',
  description: 'Ricevi notifiche immediate su email, Slack, Telegram, Discord e webhook quando un sito ha problemi.',
};

export default function AlertsPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      <h1 className="text-4xl font-bold text-white mb-4">Sistema di Avvisi</h1>
      <p className="text-zinc-400">Pagina in costruzione.</p>
    </div>
  );
}

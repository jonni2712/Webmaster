import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monitoraggio Uptime',
  description: 'Monitora la disponibilita\u0027 dei tuoi siti in tempo reale con controlli ogni minuto e notifiche immediate.',
};

export default function UptimePage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      <h1 className="text-4xl font-bold text-white mb-4">Monitoraggio Uptime</h1>
      <p className="text-zinc-400">Pagina in costruzione.</p>
    </div>
  );
}

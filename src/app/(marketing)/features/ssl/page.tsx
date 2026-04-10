import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monitoraggio SSL',
  description: 'Monitora la scadenza dei certificati SSL dei tuoi siti e ricevi avvisi prima che scadano.',
};

export default function SslPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      <h1 className="text-4xl font-bold text-white mb-4">Monitoraggio SSL</h1>
      <p className="text-zinc-400">Pagina in costruzione.</p>
    </div>
  );
}

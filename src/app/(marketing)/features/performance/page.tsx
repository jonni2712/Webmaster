import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monitoraggio Performance',
  description: 'Analizza le performance dei tuoi siti con Core Web Vitals, tempi di risposta e metriche dettagliate.',
};

export default function PerformancePage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      <h1 className="text-4xl font-bold text-white mb-4">Monitoraggio Performance</h1>
      <p className="text-zinc-400">Pagina in costruzione.</p>
    </div>
  );
}

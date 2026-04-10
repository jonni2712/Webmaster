import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Confronto',
  description: 'Confronta Webmaster Monitor con altre soluzioni di monitoraggio. Scopri perche\u0027 siamo la scelta migliore per webmaster e agenzie.',
};

export default function ComparePage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      <h1 className="text-4xl font-bold text-white mb-4">Confronto</h1>
      <p className="text-zinc-400">Pagina in costruzione.</p>
    </div>
  );
}

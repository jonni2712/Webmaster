import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Tutte le novita\u0027, aggiornamenti e miglioramenti di Webmaster Monitor.',
};

export default function ChangelogPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      <h1 className="text-4xl font-bold text-white mb-4">Changelog</h1>
      <p className="text-zinc-400">Pagina in costruzione.</p>
    </div>
  );
}

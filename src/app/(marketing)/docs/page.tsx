import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentazione',
  description: 'Documentazione completa di Webmaster Monitor. Guide, API reference e tutorial per iniziare.',
};

export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      <h1 className="text-4xl font-bold text-white mb-4">Documentazione</h1>
      <p className="text-zinc-400">Pagina in costruzione.</p>
    </div>
  );
}

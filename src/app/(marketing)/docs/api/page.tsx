import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Reference',
  description: 'Documentazione completa delle API di Webmaster Monitor. Integra il monitoraggio nei tuoi strumenti.',
};

export default function ApiReferencePage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      <h1 className="text-4xl font-bold text-white mb-4">API Reference</h1>
      <p className="text-zinc-400">Pagina in costruzione.</p>
    </div>
  );
}

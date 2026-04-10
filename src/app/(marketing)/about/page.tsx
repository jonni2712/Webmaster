import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chi siamo',
  description: 'Scopri il team dietro Webmaster Monitor, la piattaforma di monitoraggio professionale per webmaster e agenzie italiane.',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      <h1 className="text-4xl font-bold text-white mb-4">Chi siamo</h1>
      <p className="text-zinc-400">Pagina in costruzione.</p>
    </div>
  );
}

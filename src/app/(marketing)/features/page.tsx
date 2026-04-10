import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Funzionalita'",
  description: "Tutte le funzionalita\u0027 di Webmaster Monitor: uptime, SSL, performance, avvisi e integrazioni per webmaster e agenzie.",
};

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      <h1 className="text-4xl font-bold text-white mb-4">Funzionalit&agrave;</h1>
      <p className="text-zinc-400">Pagina in costruzione.</p>
    </div>
  );
}

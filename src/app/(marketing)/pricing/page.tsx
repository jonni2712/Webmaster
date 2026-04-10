import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prezzi',
  description: 'Piani e prezzi di Webmaster Monitor. Starter gratuito, Pro, Business e Agency.',
};

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      <h1 className="text-4xl font-bold text-white mb-4">Prezzi</h1>
      <p className="text-zinc-400">Pagina in costruzione.</p>
    </div>
  );
}

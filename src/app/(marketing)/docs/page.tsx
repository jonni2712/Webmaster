import type { Metadata } from 'next';
import Link from 'next/link';
import { Zap, Globe, Code, Server } from 'lucide-react';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Documentazione',
  description: 'Documentazione completa di Webmaster Monitor. Guide, API reference e tutorial per iniziare.',
};

const sections = [
  {
    icon: Zap,
    title: 'Guida Rapida',
    description: 'Configura il monitoraggio in meno di 3 minuti. Dalla registrazione al primo alert.',
    href: '/docs/quickstart',
  },
  {
    icon: Globe,
    title: 'Plugin WordPress',
    description: 'Installa e configura il plugin per WordPress con sync automatico.',
    href: '/docs/wordpress',
  },
  {
    icon: Code,
    title: 'API Reference',
    description: 'Documentazione completa delle API REST per automazione e integrazioni.',
    href: '/docs/api',
  },
  {
    icon: Server,
    title: 'Agent cPanel/Plesk',
    description: 'Installa l&apos;agent sui tuoi server per monitoraggio risorse avanzato.',
    href: '/docs/agent',
  },
];

export default function DocsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Documentazione', url: '/docs' },
        ])}
      />
      <div className="container mx-auto px-4 md:px-6 py-24">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Documentazione</h1>
        <p className="text-zinc-400 text-lg">
          Guide, tutorial e reference per iniziare rapidamente.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="bg-[#141414] border border-white/10 hover:border-emerald-500/30 rounded-2xl p-8 flex flex-col gap-5 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Icon className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-xl mb-2 group-hover:text-emerald-400 transition-colors">
                  {section.title}
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed">{section.description}</p>
              </div>
              <span className="text-emerald-400 text-sm font-medium">
                Leggi la documentazione &rarr;
              </span>
            </Link>
          );
        })}
      </div>
    </div>
    </>
  );
}

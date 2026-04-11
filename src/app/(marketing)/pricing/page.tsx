import type { Metadata } from 'next';
import { PricingContent } from '@/components/marketing/pricing-content';
import { JsonLd } from '@/components/seo/json-ld';
import { softwareApplicationSchema, faqSchema, breadcrumbSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Prezzi',
  description:
    'Piani e prezzi di Webmaster Monitor. Starter gratuito, Pro, Business e Agency. Scegli il piano giusto per te.',
};

const faqs = [
  {
    question: "Quanto tempo serve per configurare il monitoraggio?",
    answer: "Meno di 3 minuti. Aggiungi l'URL del tuo sito, scegli l'intervallo di controllo e i canali di notifica. Per WordPress e PrestaShop puoi installare il nostro plugin per dati ancora piu' dettagliati.",
  },
  {
    question: "Quali piattaforme supportate?",
    answer: "Monitoriamo qualsiasi sito web accessibile via HTTP/HTTPS. Abbiamo integrazioni native per WordPress, PrestaShop e Next.js con dati aggiuntivi come aggiornamenti disponibili, versioni plugin e Core Web Vitals.",
  },
  {
    question: "Come funzionano le notifiche?",
    answer: "Quando un sito va offline o un certificato SSL sta per scadere, ricevi una notifica immediata sul canale che preferisci: email, Slack, Telegram, Discord o webhook. Puoi configurare soglie e cooldown per evitare alert ridondanti.",
  },
  {
    question: "Posso monitorare i server oltre ai siti?",
    answer: "Si, con il piano Agency puoi installare il nostro agent su server cPanel e Plesk per monitorare risorse (CPU, RAM, disco), account, certificati SSL, zone DNS e molto altro.",
  },
  {
    question: "I dati sono al sicuro?",
    answer: "Assolutamente. Le API key sono crittografate con AES-256-GCM, le password con bcrypt, e tutta la piattaforma e' conforme al GDPR. I dati sono ospitati in Europa.",
  },
  {
    question: "Posso provare i piani a pagamento?",
    answer: "Si, offriamo 14 giorni di prova gratuita dei piani Pro, Business e Agency senza carta di credito. Al termine, puoi continuare con il piano Starter gratuito o effettuare l'upgrade.",
  },
];

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareApplicationSchema(),
          breadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Prezzi', url: '/pricing' },
          ]),
          faqSchema(faqs),
        ]}
      />
      <PricingContent />
    </>
  );
}

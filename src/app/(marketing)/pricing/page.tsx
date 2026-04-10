import type { Metadata } from 'next';
import { PricingContent } from '@/components/marketing/pricing-content';

export const metadata: Metadata = {
  title: 'Prezzi',
  description:
    'Piani e prezzi di Webmaster Monitor. Starter gratuito, Pro, Business e Agency. Scegli il piano giusto per te.',
};

export default function PricingPage() {
  return <PricingContent />;
}

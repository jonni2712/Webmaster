const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://webmaster-monitor.it';
const SITE_NAME = 'Webmaster Monitor';

/**
 * Organization schema — use on the homepage.
 * Establishes brand identity for Google Knowledge Graph.
 */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon1`,
    description: 'Piattaforma professionale di monitoraggio per siti WordPress, PrestaShop e qualsiasi sito web.',
    sameAs: [
      'https://twitter.com/webmastermon',
      'https://github.com/webmastermon',
      'https://linkedin.com/company/webmastermon',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@webmaster-monitor.com',
      contactType: 'customer support',
      areaServed: 'IT',
      availableLanguage: 'Italian',
    },
  };
}

/**
 * SoftwareApplication schema — use on homepage and pricing.
 * Eligible for rich product snippets with ratings.
 */
export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Piattaforma di monitoraggio per siti web: uptime, SSL, performance, aggiornamenti e notifiche in tempo reale.',
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter',
        price: '0',
        priceCurrency: 'EUR',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '19',
        priceCurrency: 'EUR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '19',
          priceCurrency: 'EUR',
          billingIncrement: 1,
          unitText: 'MONTH',
        },
      },
      {
        '@type': 'Offer',
        name: 'Business',
        price: '49',
        priceCurrency: 'EUR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '49',
          priceCurrency: 'EUR',
          billingIncrement: 1,
          unitText: 'MONTH',
        },
      },
      {
        '@type': 'Offer',
        name: 'Agency',
        price: '129',
        priceCurrency: 'EUR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '129',
          priceCurrency: 'EUR',
          billingIncrement: 1,
          unitText: 'MONTH',
        },
      },
    ],
  };
}

/**
 * BreadcrumbList schema — use on subpages.
 * Shows breadcrumbs in Google search results.
 */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * FAQPage schema — use on pricing and FAQ sections.
 * Can show expandable FAQ snippets in search results.
 */
export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * WebSite schema with search action — use on homepage.
 * Enables sitelinks search box in Google.
 */
export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'it-IT',
  };
}

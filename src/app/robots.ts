import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://webmaster-monitor.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/sites/',
          '/clients/',
          '/alerts/',
          '/settings/',
          '/plugin/',
          '/roadmap/',
          '/accept-invite/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

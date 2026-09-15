import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/login', '/privacy', '/terms'],
      disallow: [
        '/dashboard',
        '/admin',
        '/ai',
        '/api',
        '/assets',
        '/audit',
        '/compliance',
        '/evidence',
        '/fair',
        '/findings',
        '/ml',
        '/optimizer',
        '/profile',
        '/reports',
        '/risk-explorer',
        '/scenarios',
      ],
    },
    sitemap: 'https://cybervest-sigma.vercel.app/sitemap.xml',
  }
}

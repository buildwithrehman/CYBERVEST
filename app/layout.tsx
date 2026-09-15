import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  metadataBase: new URL('https://cybervest-sigma.vercel.app'),
  title: 'CYBERVEST',
  description: 'AI-Powered Continuous Cyber Risk Quantification',
  openGraph: {
    title: 'CYBERVEST',
    description: 'AI-Powered Continuous Cyber Risk Quantification',
    url: 'https://cybervest-sigma.vercel.app',
    siteName: 'CYBERVEST',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CYBERVEST',
    description: 'AI-Powered Continuous Cyber Risk Quantification',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-background text-slate-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

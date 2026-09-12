import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'CYBERVEST',
  description: 'AI-Powered Continuous Cyber Risk Quantification',
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

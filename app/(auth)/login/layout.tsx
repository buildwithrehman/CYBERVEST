import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - CYBERVEST',
  description: 'Sign in to the CYBERVEST cyber risk quantification platform.',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

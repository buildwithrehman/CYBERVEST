import type { Metadata } from 'next'
import { AppShell } from "@/components/layout/AppShell"
import { AuthGuard } from "@/components/layout/AuthGuard"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <AppShell>
        {children}
      </AppShell>
    </AuthGuard>
  )
}

import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'SarkariResult API', description: 'API for SarkariResult.com' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body style={{ fontFamily: 'system-ui', margin: 0 }}>{children}</body></html>
}

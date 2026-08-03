import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CubeNexus — Professional Speedcubing Tournament Platform',
  description: 'The professional speedcubing tournament platform. Offline tournament management, live judge stations, online 1v1 arena, and real-time leaderboards.',
  generator: 'CubeNexus.app',
  keywords: ['speedcubing', 'rubik', 'tournament', 'WCA', 'offline competition', 'judge station', 'live board'],
  authors: [{ name: 'CubeNexus Team' }],
  openGraph: {
    title: 'CubeNexus — Professional Speedcubing Platform',
    description: 'Join the global speedcubing arena. Compete. Inspire.',
    type: 'website',
  },
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png' }],
    apple: '/icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors position="top-right" closeButton />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

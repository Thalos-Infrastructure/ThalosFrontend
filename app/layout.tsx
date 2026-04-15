import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/lib/i18n'
import { StellarWalletProvider } from '@/lib/stellar-wallet'
import { AuthProvider } from '@/lib/auth-provider'
import './globals.css'

const _inter = Inter({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Thalos - Secure Payment Agreements',
  description: 'Create secure payment agreements with protected funds and staged releases. Simple, transparent, and reliable.',
  generator: 'v0.app',
  metadataBase: new URL('https://www.thalosplatform.xyz'),
  icons: {
    icon: '/thalos-icon.png',
    apple: '/thalos-icon.png',
  },
  openGraph: {
    title: 'Thalos - Secure Payment Agreements',
    description: 'Create secure payment agreements with protected funds and staged releases.',
    url: 'https://www.thalosplatform.xyz',
    siteName: 'Thalos',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Thalos - Secure Payment Agreements',
    description: 'Create secure payment agreements with protected funds and staged releases.',
  },
}

export const viewport: Viewport = {
  themeColor: '#171a1f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="font-sans antialiased transition-colors duration-300">
        <LanguageProvider>
          <AuthProvider>
            <StellarWalletProvider>
              {children}
            </StellarWalletProvider>
          </AuthProvider>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}

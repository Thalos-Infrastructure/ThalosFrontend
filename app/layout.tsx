import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/lib/i18n'
import { StellarWalletProvider } from '@/lib/stellar-wallet'
import './globals.css'

const _inter = Inter({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Thalos - Escrow & Payments Infrastructure on Stellar',
  description: 'Build secure payment platforms with programmable escrows, protected funds, and staged releases on Stellar.',
  generator: 'v0.app',
  icons: {
    icon: '/thalos-icon.png',
    apple: '/thalos-icon.png',
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
      <body className="font-sans antialiased">
        <LanguageProvider>
          <StellarWalletProvider>
            {children}
          </StellarWalletProvider>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}

import Link from 'next/link'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import AppHeader from './components/AppHeader'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Creative Exchange',
  description: 'サブカルチャークリエイターのための取引市場',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gray-50 text-gray-900">
        <AppHeader />
        <main>{children}</main>
        <footer className="border-t border-gray-200 bg-white mt-16">
  <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-500">
    <div>© 2026 Creative Exchange</div>
    <div className="flex items-center gap-4">
      <Link href="/terms" className="hover:text-gray-700 transition">
        利用規約
      </Link>
      <Link href="/privacy" className="hover:text-gray-700 transition">
        プライバシーポリシー
      </Link>
    </div>
  </div>
</footer>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { Geist, Geist_Mono } from 'next/font/google'
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
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4">
            <div className="h-16 flex items-center justify-between">
              <Link href="/" className="text-xl font-bold tracking-tight">
                Creative Exchange
              </Link>

              <nav className="flex items-center gap-2 md:gap-3 text-sm">
                <Link
                  href="/"
                  className="px-3 py-2 rounded-xl hover:bg-gray-100 transition"
                >
                  トップ
                </Link>
                <Link
                  href="/mypage"
                  className="px-3 py-2 rounded-xl hover:bg-gray-100 transition"
                >
                  マイページ
                </Link>
                <Link
                  href="/market"
                  className="px-3 py-2 rounded-xl hover:bg-gray-100 transition"
                >
                  相場ボード
                </Link>
                <Link
                  href="/request/new"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  新しい依頼
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main>{children}</main>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
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
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="flex flex-col lg:flex-row justify-between gap-8">
              <div>
                <div className="text-lg font-bold text-gray-900">
                  Creative Exchange
                </div>
                <p className="mt-2 text-sm text-gray-500 leading-6 max-w-md">
                  クリエイターの相場・実績・信用・工程を見える化する、
                  クリエイティブ制作の取引プラットフォームです。
                </p>
                <p className="mt-3 text-xs text-gray-400">
                  © 2026 Creative Exchange
                </p>
              </div>

              <nav className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm text-gray-500">
                <Link href="/operator" className="hover:text-gray-900 transition">
                  運営者情報
                </Link>
                <Link href="/terms" className="hover:text-gray-900 transition">
                  利用規約
                </Link>
                <Link href="/privacy" className="hover:text-gray-900 transition">
                  プライバシーポリシー
                </Link>
                <Link href="/commercial-law" className="hover:text-gray-900 transition">
                  特定商取引法に基づく表記
                </Link>
                <Link href="/refund-policy" className="hover:text-gray-900 transition">
                  キャンセル・返金ポリシー
                </Link>
                <Link href="/payment-guide" className="hover:text-gray-900 transition">
                  決済・仮払いについて
                </Link>
                <Link href="/contact" className="hover:text-gray-900 transition">
                  お問い合わせ
                </Link>
              </nav>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400 leading-6">
              現在、決済・仮払い機能はβ提供準備中です。正式な提供条件は、決済・仮払いについて、利用規約、キャンセル・返金ポリシーをご確認ください。
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

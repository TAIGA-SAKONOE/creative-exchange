'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function AppHeader() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4">
        <div className="min-h-16 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Creative Exchange
          </Link>

          <nav className="flex flex-wrap items-center gap-2 md:gap-3 text-sm">
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
              href="/exchange"
              className="px-3 py-2 rounded-xl hover:bg-gray-100 transition"
            >
              Exchange
            </Link>

            <Link
              href="/listing"
              className="px-3 py-2 rounded-xl hover:bg-gray-100 transition"
            >
              作品マーケット
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

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl hover:bg-gray-100 transition text-gray-700"
            >
              ログアウト
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}

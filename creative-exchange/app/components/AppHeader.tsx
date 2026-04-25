'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react'

export default function AppHeader() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4">
        <div className="py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <Link href="/" className="text-2xl md:text-xl font-bold tracking-tight">
              Creative Exchange
            </Link>

            <nav className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3 text-sm">
              <Link
                href="/exchange?tab=creators"
                className="px-3 py-2 rounded-xl hover:bg-gray-100 transition text-center"
              >
                人を探す
              </Link>

              <Link
                href="/listing"
                className="px-3 py-2 rounded-xl hover:bg-gray-100 transition text-center"
              >
                作品を探す
              </Link>

              <Link
                href="/exchange?tab=requests"
                className="px-3 py-2 rounded-xl hover:bg-gray-100 transition text-center"
              >
                依頼を受ける
              </Link>

              <Link
                href="/listing/new"
                className="px-3 py-2 rounded-xl hover:bg-gray-100 transition text-center"
              >
                出品する
              </Link>

              <Link
                href="/market"
                className="px-3 py-2 rounded-xl hover:bg-gray-100 transition text-center"
              >
                相場を確認する
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/mypage"
                    className="px-3 py-2 rounded-xl hover:bg-gray-100 transition text-center"
                  >
                    マイページ
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-xl hover:bg-gray-100 transition text-gray-700 text-center col-span-2 md:col-span-1"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-center"
                >
                  ログイン
                </Link>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}

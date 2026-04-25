'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react'

export default function AppHeader() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [exchangeOpen, setExchangeOpen] = useState(false)
  const [marketOpen, setMarketOpen] = useState(false)

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

  const closeDropdowns = () => {
    setExchangeOpen(false)
    setMarketOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4">
        <div className="py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <Link
              href="/"
              className="text-2xl md:text-xl font-bold tracking-tight"
              onClick={closeDropdowns}
            >
              Creative Exchange
            </Link>

            <nav className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 text-sm">
              <div
                className="relative"
                onMouseEnter={() => setExchangeOpen(true)}
                onMouseLeave={() => setExchangeOpen(false)}
              >
                <div className="inline-flex w-full md:w-auto rounded-xl hover:bg-gray-100 transition overflow-hidden">
                  <Link
                    href="/exchange?tab=requests"
                    onClick={closeDropdowns}
                    className="px-3 py-2"
                  >
                    Exchange
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setExchangeOpen((prev) => !prev)
                      setMarketOpen(false)
                    }}
                    className="px-2 py-2 text-xs text-gray-500 hover:bg-gray-200 transition"
                    aria-label="Exchangeメニューを開く"
                  >
                    ▼
                  </button>
                </div>

                {exchangeOpen && (
                  <div className="md:absolute md:left-0 md:top-full md:pt-2 w-full md:w-56 z-50">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-2">
                      <Link
                        href="/exchange?tab=requests"
                        onClick={closeDropdowns}
                        className="block px-4 py-3 rounded-xl hover:bg-gray-100 transition"
                      >
                        依頼を探す
                      </Link>

                      <Link
                        href="/exchange?tab=creators"
                        onClick={closeDropdowns}
                        className="block px-4 py-3 rounded-xl hover:bg-gray-100 transition"
                      >
                        人を探す
                      </Link>

                      <Link
                        href="/listing"
                        onClick={closeDropdowns}
                        className="block px-4 py-3 rounded-xl hover:bg-gray-100 transition"
                      >
                        作品を探す
                      </Link>

                      <Link
                        href="/listing/new"
                        onClick={closeDropdowns}
                        className="block px-4 py-3 rounded-xl hover:bg-gray-100 transition"
                      >
                        出品する
                      </Link>

                      <div className="my-2 border-t border-gray-100" />

                      <Link
                        href="/request/new"
                        onClick={closeDropdowns}
                        className="block px-4 py-3 rounded-xl hover:bg-blue-50 text-blue-700 font-medium transition"
                      >
                        新しい依頼を作成
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="relative"
                onMouseEnter={() => setMarketOpen(true)}
                onMouseLeave={() => setMarketOpen(false)}
              >
                <div className="inline-flex w-full md:w-auto rounded-xl hover:bg-gray-100 transition overflow-hidden">
                  <Link
                    href="/market?tab=commission"
                    onClick={closeDropdowns}
                    className="px-3 py-2"
                  >
                    相場ボード
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setMarketOpen((prev) => !prev)
                      setExchangeOpen(false)
                    }}
                    className="px-2 py-2 text-xs text-gray-500 hover:bg-gray-200 transition"
                    aria-label="相場ボードメニューを開く"
                  >
                    ▼
                  </button>
                </div>

                {marketOpen && (
                  <div className="md:absolute md:left-0 md:top-full md:pt-2 w-full md:w-60 z-50">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-2">
                      <Link
                        href="/market?tab=commission"
                        onClick={closeDropdowns}
                        className="block px-4 py-3 rounded-xl hover:bg-gray-100 transition"
                      >
                        受託相場を確認する
                      </Link>

                      <Link
                        href="/market?tab=product"
                        onClick={closeDropdowns}
                        className="block px-4 py-3 rounded-xl hover:bg-gray-100 transition"
                      >
                        作品相場を確認する
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {isLoggedIn && (
                <Link
                  href="/mypage"
                  onClick={closeDropdowns}
                  className="px-3 py-2 rounded-xl hover:bg-gray-100 transition text-left md:text-center"
                >
                  マイページ
                </Link>
              )}

              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-xl hover:bg-gray-100 transition text-gray-700 text-left md:text-center"
                >
                  ログアウト
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={closeDropdowns}
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-left md:text-center"
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

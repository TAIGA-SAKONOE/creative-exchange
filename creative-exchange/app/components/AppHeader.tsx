'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react'

type NavLink = {
  href: string
  label: string
  description?: string
}

const exchangeLinks: NavLink[] = [
  {
    href: '/exchange?tab=requests',
    label: '依頼を探す',
    description: '公開中の依頼・工程を確認',
  },
  {
    href: '/exchange?tab=creators',
    label: 'クリエイターを探す',
    description: '受付中のクリエイターを検索',
  },
  {
    href: '/listing',
    label: '作品を探す',
    description: '既製品マーケットを見る',
  },
  {
    href: '/listing/new',
    label: '出品する',
    description: '完成済み作品を登録',
  },
]

const marketLinks: NavLink[] = [
  {
    href: '/market?tab=commission',
    label: '受託相場を見る',
    description: '依頼・受注の価格帯を確認',
  },
  {
    href: '/market?tab=product',
    label: '作品相場を見る',
    description: '既製品販売の価格帯を確認',
  },
]

function DropdownMenu({
  title,
  href,
  links,
  open,
  onOpenChange,
  onClose,
}: {
  title: string
  href: string
  links: NavLink[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
}) {
  return (
    <div
      className="relative"
      onMouseEnter={() => onOpenChange(true)}
      onMouseLeave={() => onOpenChange(false)}
    >
      <div className="inline-flex w-full md:w-auto rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition overflow-hidden">
        <Link
          href={href}
          onClick={onClose}
          className="flex-1 md:flex-none px-3 py-2.5 font-medium text-gray-800"
        >
          {title}
        </Link>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            onOpenChange(!open)
          }}
          className="px-3 py-2.5 text-xs text-gray-500 hover:bg-gray-100 transition"
          aria-label={`${title}メニューを開く`}
          aria-expanded={open}
        >
          {open ? '▲' : '▼'}
        </button>
      </div>

      {open && (
        <div className="md:absolute md:left-0 md:top-full md:pt-2 w-full md:w-72 z-50">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-2">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="block px-4 py-3 rounded-xl hover:bg-gray-50 transition"
              >
                <span className="block font-bold text-gray-900">
                  {item.label}
                </span>
                {item.description && (
                  <span className="block text-xs text-gray-500 mt-1 leading-relaxed">
                    {item.description}
                  </span>
                )}
              </Link>
            ))}

            <div className="my-2 border-t border-gray-100" />

            <Link
              href="/request/new"
              onClick={onClose}
              className="block px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition"
            >
              新しい依頼を作成
              <span className="block text-xs text-blue-600 mt-1 font-medium">
                依頼・募集を始める
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [exchangeOpen, setExchangeOpen] = useState(false)
  const [marketOpen, setMarketOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeDropdowns = () => {
    setExchangeOpen(false)
    setMarketOpen(false)
  }

  const closeAllMenus = () => {
    closeDropdowns()
    setMobileOpen(false)
  }

  const loadUnreadNotifications = async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    setIsLoggedIn(!!user)

    if (!user) {
      setUnreadCount(0)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (profileError || !profile) {
      setUnreadCount(0)
      return
    }

    const { count, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)

    if (countError) {
      console.error('unread notification count error:', countError)
      setUnreadCount(0)
      return
    }

    setUnreadCount(count || 0)
  }

  useEffect(() => {
    loadUnreadNotifications()

    const handleFocus = () => {
      loadUnreadNotifications()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  useEffect(() => {
    closeAllMenus()
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setUnreadCount(0)
    closeAllMenus()
    router.replace('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4">
        <div className="py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center shrink-0"
              onClick={closeAllMenus}
            >
              <img
                src="/logo-symbol.png"
                alt="Creative Exchange"
                className="h-10 w-auto"
              />
            </Link>

            <button
              type="button"
              onClick={() => {
                setMobileOpen((prev) => !prev)
                closeDropdowns()
              }}
              className="md:hidden inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
              aria-label="メニューを開閉する"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? '閉じる' : 'メニュー'}
            </button>

            <nav className="hidden md:flex md:items-center gap-2 text-sm">
              <DropdownMenu
                title="Exchange"
                href="/exchange?tab=requests"
                links={exchangeLinks}
                open={exchangeOpen}
                onOpenChange={(open) => {
                  setExchangeOpen(open)
                  if (open) setMarketOpen(false)
                }}
                onClose={closeAllMenus}
              />

              <DropdownMenu
                title="相場ボード"
                href="/market?tab=commission"
                links={marketLinks}
                open={marketOpen}
                onOpenChange={(open) => {
                  setMarketOpen(open)
                  if (open) setExchangeOpen(false)
                }}
                onClose={closeAllMenus}
              />

              {isLoggedIn && (
                <Link
                  href="/mypage"
                  onClick={closeAllMenus}
                  className="relative px-3 py-2.5 rounded-xl hover:bg-gray-50 transition inline-flex items-center gap-2 font-medium text-gray-800"
                >
                  <span>マイページ</span>

                  {unreadCount > 0 && (
                    <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-2.5 rounded-xl hover:bg-gray-50 transition text-gray-700 font-medium"
                >
                  ログアウト
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={closeAllMenus}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition font-bold shadow-sm"
                >
                  ログイン
                </Link>
              )}
            </nav>
          </div>

          {mobileOpen && (
            <nav className="md:hidden mt-4 pb-2 text-sm">
              <div className="grid gap-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-2">
                  <div className="px-3 py-2 text-xs font-bold text-gray-400">
                    Exchange
                  </div>
                  {exchangeLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeAllMenus}
                      className="block rounded-xl px-3 py-3 hover:bg-gray-50 transition"
                    >
                      <span className="block font-bold text-gray-900">
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="block text-xs text-gray-500 mt-1">
                          {item.description}
                        </span>
                      )}
                    </Link>
                  ))}
                  <Link
                    href="/request/new"
                    onClick={closeAllMenus}
                    className="mt-1 block rounded-xl px-3 py-3 bg-blue-50 text-blue-700 font-bold"
                  >
                    新しい依頼を作成
                  </Link>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-2">
                  <div className="px-3 py-2 text-xs font-bold text-gray-400">
                    相場ボード
                  </div>
                  {marketLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeAllMenus}
                      className="block rounded-xl px-3 py-3 hover:bg-gray-50 transition"
                    >
                      <span className="block font-bold text-gray-900">
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="block text-xs text-gray-500 mt-1">
                          {item.description}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>

                {isLoggedIn && (
                  <Link
                    href="/mypage"
                    onClick={closeAllMenus}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-4 font-bold text-gray-900 inline-flex items-center justify-between"
                  >
                    <span>マイページ</span>
                    {unreadCount > 0 && (
                      <span className="inline-flex min-w-6 h-6 px-2 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )}

                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-4 font-bold text-gray-700 text-left"
                  >
                    ログアウト
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={closeAllMenus}
                    className="rounded-2xl bg-blue-600 px-4 py-4 font-bold text-white text-center shadow-sm"
                  >
                    ログイン
                  </Link>
                )}
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}

'use client'

import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function MyPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) return <div>読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">マイページ</h1>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            ログアウト
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-8">
          <p className="text-2xl mb-2">ようこそ、{user?.user_metadata?.name || 'ユーザー'}さん</p>
          <p className="text-gray-600 mb-8">Xアカウントでログイン済み</p>

          {/* ここにプロフィール編集ボタンを追加 */}
          <Link
            href="/profile/edit"
            className="block w-full bg-black text-white text-center py-4 rounded-xl font-medium hover:bg-gray-800 transition"
          >
            プロフィール編集
          </Link>
        </div>

        <p className="text-center text-gray-500 mt-12 text-sm">
          ここに今後、依頼作成や取引履歴などが追加されます。
        </p>
      </div>
    </div>
  )
}

'use client'

import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function MyPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      // usersテーブルからプロフィールを取得
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      setProfile(data || { display_name: user.user_metadata?.name || 'ユーザー' })
      setLoading(false)
    }

    loadData()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>
  }

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

        <div className="bg-white rounded-2xl shadow p-8 mb-8">
          <p className="text-2xl mb-2">
            ようこそ、{profile?.display_name || 'ユーザー'}さん
          </p>
          <p className="text-gray-600 mb-6">Xアカウントでログイン済み</p>

          {profile?.bio && (
            <div className="mb-8">
              <p className="text-sm text-gray-500 mb-1">自己紹介</p>
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}

          <Link
            href="/profile/edit"
            className="block w-full bg-black text-white text-center py-4 rounded-xl font-medium hover:bg-gray-800 transition mb-4"
          >
            プロフィール編集
          </Link>
        </div>

        <p className="text-center text-gray-500 text-sm">
          ここに今後、依頼作成や取引履歴などが追加されます。
        </p>
      </div>
    </div>
  )
}

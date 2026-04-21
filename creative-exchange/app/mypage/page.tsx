'use client'

import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function MyPage() {
  const [profile, setProfile] = useState<any>(null)
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      setProfile(profileData || { display_name: user.user_metadata?.name || 'ユーザー' })

      const { data: requests } = await supabase
        .from('orders')
        .select(`
          id,
          title,
          description,
          status,
          agreed_price,
          created_at,
          categories (name)
        `)
        .eq('client_id', profileData?.id)
        .order('created_at', { ascending: false })

      setMyRequests(requests || [])
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
      <div className="max-w-3xl mx-auto px-4">
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

          <div className="grid grid-cols-1 gap-4 mb-10">
            <Link
              href="/profile/edit"
              className="block w-full bg-black text-white text-center py-4 rounded-xl font-medium hover:bg-gray-800 transition"
            >
              プロフィール編集
            </Link>

            <Link
              href="/request/new"
              className="block w-full bg-blue-600 text-white text-center py-4 rounded-xl font-medium hover:bg-blue-700 transition"
            >
              新しい依頼を作成
            </Link>
          </div>
        </div>

        {/* 依頼一覧 */}
        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-xl font-semibold mb-6">作成した依頼一覧</h2>

          {myRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">まだ依頼を作成していません</p>
          ) : (
            <div className="space-y-4">
              {myRequests.map((req) => (
                <Link 
                  key={req.id} 
                  href={`/request/${req.id}`}
                  className="block border rounded-xl p-5 hover:bg-gray-50 transition group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium group-hover:text-blue-600 transition">{req.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {req.categories?.name} ・ {new Date(req.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        req.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                      }`}>
                        {req.status === 'draft' ? '下書き' : '公開中'}
                      </span>
                    </div>
                  </div>
                  {req.agreed_price && (
                    <p className="text-sm mt-3 text-blue-600">希望予算: ¥{req.agreed_price.toLocaleString()}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

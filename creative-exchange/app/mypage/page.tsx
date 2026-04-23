'use client'

import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function MyPage() {
  const [user, setUser] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMyPage = async () => {
      const supabase = createClient()

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        window.location.href = '/login'
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single()

      if (profile) {
        setUser(profile)

        const { data: myRequests } = await supabase
          .from('orders')
          .select(`
            *,
            categories(name)
          `)
          .eq('client_id', profile.id)
          .order('created_at', { ascending: false })

        setRequests(myRequests || [])
      }

      setLoading(false)
    }

    loadMyPage()
  }, [])

  if (loading) return <div className="p-12 text-center">読み込み中...</div>
  if (!user) return <div>ログインしてください</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">マイページ</h1>
          <Link 
            href="/request/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-medium shadow-sm transition"
          >
            新しい依頼を作成
          </Link>
        </div>

        {/* プロフィール */}
        <div className="bg-white rounded-3xl shadow-xl p-10 mb-12">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center text-6xl text-white shadow-inner">
              👤
            </div>
            <div className="flex-1">
              <h2 className="text-4xl font-bold mb-1">{user.display_name}</h2>
              <p className="text-2xl text-gray-600">@{user.twitter_handle || '未設定'}</p>
              {user.bio && <p className="mt-6 text-lg text-gray-700 leading-relaxed">{user.bio}</p>}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href={`/creator/${user.id}`}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-5 rounded-2xl font-medium text-center hover:brightness-105 transition shadow-sm flex items-center justify-center gap-3"
            >
              📊 自分の価格表を見る
            </Link>

            <Link
              href="/market"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-2xl font-medium text-center hover:brightness-105 transition shadow-sm flex items-center justify-center gap-3"
            >
              📈 相場ボードを見る
            </Link>

            <Link
              href="/profile/edit"
              className="border-2 border-gray-300 hover:bg-gray-50 py-5 rounded-2xl font-medium text-center transition"
            >
              プロフィール編集
            </Link>
          </div>
        </div>

        {/* 依頼一覧 */}
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-2xl font-bold mb-8">あなたの依頼一覧</h2>

          {requests.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              まだ依頼がありません<br />
              「新しい依頼を作成」から初めてみましょう
            </div>
          ) : (
            <div className="grid gap-6">
              {requests.map((req) => (
                <Link 
                  key={req.id}
                  href={`/request/${req.id}`}
                  className="group border border-gray-200 hover:border-blue-300 hover:shadow-lg rounded-3xl p-8 transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                        {req.title}
                      </div>
                      <div className="text-gray-600">{req.categories?.name || '未分類'}</div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-block px-5 py-1.5 rounded-full text-sm font-medium
                        ${req.status === 'completed' ? 'bg-green-100 text-green-700' : 
                          req.status === 'matched' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {req.status === 'draft' && '下書き'}
                        {req.status === 'open' && '公開中'}
                        {req.status === 'matched' && '受注済み'}
                        {req.status === 'delivered' && '納品済み'}
                        {req.status === 'completed' && '完了'}
                      </div>
                      {req.agreed_price && (
                        <div className="mt-4 text-2xl font-semibold text-gray-900">
                          ¥{req.agreed_price.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

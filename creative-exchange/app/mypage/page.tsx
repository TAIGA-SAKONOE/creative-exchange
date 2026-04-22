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

      // 自分のプロフィール取得
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single()

      if (profile) {
        setUser(profile)

        // 自分の依頼一覧取得
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

  if (loading) {
    return <div className="p-12 text-center">読み込み中...</div>
  }

  if (!user) {
    return <div>ログインしてください</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">マイページ</h1>
          <Link 
            href="/request/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
          >
            新しい依頼を作成
          </Link>
        </div>

        {/* プロフィールカード */}
        <div className="bg-white rounded-3xl shadow p-8 mb-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-4xl text-white">
              👤
            </div>
            <div>
              <h2 className="text-3xl font-bold">{user.display_name}</h2>
              <p className="text-xl text-gray-600">@{user.twitter_handle || '未設定'}</p>
              {user.bio && <p className="mt-3 text-gray-700">{user.bio}</p>}
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Link
              href={`/creator/${user.id}`}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-2xl font-medium text-center hover:brightness-110 transition"
            >
              📊 自分の価格表を見る
            </Link>
            <Link
              href="/profile/edit"
              className="flex-1 border border-gray-300 hover:bg-gray-50 py-4 rounded-2xl font-medium text-center transition"
            >
              プロフィール編集
            </Link>
          </div>
        </div>

        {/* 依頼一覧 */}
        <div className="bg-white rounded-3xl shadow p-8">
          <h2 className="text-2xl font-bold mb-6">あなたの依頼一覧</h2>

          {requests.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              まだ依頼がありません<br />
              「新しい依頼を作成」から初めてみましょう
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <Link 
                  key={req.id}
                  href={`/request/${req.id}`}
                  className="block border border-gray-200 hover:border-blue-300 rounded-2xl p-6 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{req.title}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {req.categories?.name || '未分類'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium
                        ${req.status === 'completed' ? 'bg-green-100 text-green-700' : 
                          req.status === 'matched' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {req.status === 'draft' && '下書き'}
                        {req.status === 'open' && '公開中'}
                        {req.status === 'matched' && '受注済み'}
                        {req.status === 'delivered' && '納品済み'}
                        {req.status === 'completed' && '完了'}
                      </div>
                      {req.agreed_price && (
                        <div className="mt-2 font-medium">¥{req.agreed_price.toLocaleString()}</div>
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

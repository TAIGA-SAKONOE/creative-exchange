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

      // プロフィール取得
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      setProfile(userProfile || { display_name: user.user_metadata?.name || 'ユーザー' })

      // 自分の依頼一覧取得
      const { data: requests } = await supabase
        .from('orders')
        .select(`
          *,
          categories (name)
        `)
        .or(`client_id.eq.${userProfile?.id},creator_id.eq.${userProfile?.id}`)
        .order('created_at', { ascending: false })

      setMyRequests(requests || [])
      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) return <div className="p-12 text-center">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">マイページ</h1>
          <button 
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = '/'
            }}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            ログアウト
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-8 mb-8">
          <p className="text-xl mb-2">ようこそ、{profile?.display_name || 'ユーザー'}さん</p>
          <p className="text-gray-600 mb-6">Xアカウントでログイン済み</p>

          {profile?.bio && (
            <div className="mb-8">
              <p className="text-sm text-gray-500">自己紹介</p>
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/profile/edit">
              <button className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-xl font-medium">
                プロフィール編集
              </button>
            </Link>

            <Link href="/request/new">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-medium">
                新しい依頼を作成
              </button>
            </Link>
          </div>

          {/* ★ 相場ボードへの導線を追加 */}
          <Link href="/market" className="block mt-4">
            <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-3">
              📊 相場ボードを見る
            </button>
          </Link>
        </div>

        {/* 作成した依頼一覧 */}
        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-xl font-semibold mb-6">作成した依頼一覧</h2>
          
          {myRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">まだ依頼を作成していません</p>
          ) : (
            <div className="space-y-4">
              {myRequests.map((req) => (
                <Link key={req.id} href={`/request/${req.id}`}>
                  <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition flex justify-between items-center">
                    <div>
                      <p className="font-medium">{req.title}</p>
                      <p className="text-sm text-gray-500">
                        {req.categories?.name} ・ {new Date(req.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="text-right">
                      {req.agreed_price && (
                        <p className="font-semibold text-blue-600">¥{req.agreed_price.toLocaleString()}</p>
                      )}
                      <span className={`text-xs px-3 py-1 rounded-full ${req.status === 'completed' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                        {req.status === 'completed' ? '完了' : '進行中'}
                      </span>
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

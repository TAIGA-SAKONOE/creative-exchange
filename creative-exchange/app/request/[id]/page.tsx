'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RequestDetail({ params }: { params: { id: string } }) {
  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const loadRequest = async () => {
      const supabase = createClient()

      // まず認証状態を確認
      const { data: { user } } = await supabase.auth.getUser()
      let debugInfo = `Auth user: ${user ? user.id : 'NOT LOGGED IN'}\n`

      if (!user) {
        setError('ログインしていません')
        setDebug(debugInfo)
        setLoading(false)
        return
      }

      // usersテーブルからprofileを取得
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, auth_id')
        .eq('auth_id', user.id)
        .single()

      debugInfo += `Profile: ${profile ? JSON.stringify(profile) : 'NOT FOUND'}\n`
      debugInfo += `Profile error: ${profileError ? profileError.message : 'none'}\n`

      // ordersを取得（categoriesなしで単純に）
      const { data, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
        .single()

      debugInfo += `Order: ${data ? JSON.stringify(data) : 'NOT FOUND'}\n`
      debugInfo += `Order error: ${orderError ? orderError.message : 'none'}\n`

      setDebug(debugInfo)

      if (orderError) {
        setError('依頼の取得に失敗しました: ' + orderError.message)
      } else {
        setRequest(data)
      }

      setLoading(false)
    }

    loadRequest()
  }, [params.id])

  if (loading) return <div className="p-12 text-center">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => router.push('/mypage')}
          className="mb-6 text-gray-500 hover:text-gray-700"
        >
          ← マイページに戻る
        </button>

        {/* デバッグ情報 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6 text-xs font-mono whitespace-pre-wrap">
          {debug}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {request && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h1 className="text-3xl font-bold mb-4">{request.title}</h1>
            <p className="text-gray-700">{request.description}</p>
            <p className="text-sm text-gray-500 mt-4">
              client_id: {request.client_id}
            </p>
            <p className="text-sm text-gray-500">
              status: {request.status}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

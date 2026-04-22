'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function RequestDetail() {
  const params = useParams()
  const id = params.id as string
  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      const supabase = createClient()

      // 現在のユーザー取得 → auth_id → users.id 変換
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single()
        setProfile(userProfile)
      }

      // 依頼詳細取得
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          categories (name)
        `)
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Fetch error:', fetchError)
        setError('この依頼は存在しないか、閲覧権限がありません')
      } else {
        setRequest(data)
      }

      setLoading(false)
    }

    loadData()
  }, [id])

  // 受注処理
  const handleAccept = async () => {
    if (!profile || !request) return
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        creator_id: profile.id,
        status: 'matched',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      alert('受注失敗: ' + updateError.message)
    } else {
      alert('依頼を受注しました！')
      window.location.reload()
    }
  }

  // 納品処理（今後実装）
  const handleDeliver = async () => {
    alert('納品機能は現在実装中です。')
  }

  if (loading) return <div className="p-12 text-center">読み込み中...</div>
  if (error) return <div className="p-12 text-center text-red-600">{error}</div>
  if (!request) return <div className="p-12 text-center">依頼が見つかりません</div>

  const isClient = request.client_id === profile?.id
  const isCreator = request.creator_id === profile?.id
  const canAccept = request.status === 'draft' && !isClient
  const canDeliver = isCreator && request.status === 'matched'

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => router.push('/mypage')}
          className="mb-6 text-gray-500 hover:text-gray-700"
        >
          ← マイページに戻る
        </button>

        <div className="bg-white rounded-2xl shadow p-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold">{request.title}</h1>
            <span className={`px-4 py-1 rounded-full text-sm ${
              request.status === 'draft'
                ? 'bg-gray-100 text-gray-600'
                : request.status === 'matched'
                ? 'bg-green-100 text-green-700'
                : request.status === 'delivered'
                ? 'bg-blue-100 text-blue-700'
                : request.status === 'completed'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {request.status === 'draft' ? '公開中' :
               request.status === 'matched' ? '受注済み' :
               request.status === 'delivered' ? '納品済み' :
               request.status === 'completed' ? '完了' :
               request.status}
            </span>
          </div>

          <div className="mb-8">
            <p className="text-sm text-gray-500">品目</p>
            <p className="text-lg font-medium">{request.categories?.name || '未分類'}</p>
          </div>

          <div className="mb-8">
            <p className="text-sm text-gray-500">依頼内容</p>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{request.description}</p>
          </div>

          {request.agreed_price && (
            <div className="mb-8">
              <p className="text-sm text-gray-500">希望予算</p>
              <p className="text-2xl font-semibold text-blue-600">
                ¥{request.agreed_price.toLocaleString()}
              </p>
            </div>
          )}

          {/* アクションボタン */}
          {canAccept && (
            <button
              onClick={handleAccept}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-medium text-lg mb-4"
            >
              この依頼を受注する
            </button>
          )}

          {canDeliver && (
            <button
              onClick={handleDeliver}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-medium text-lg mb-4"
            >
              納品する（ファイルアップロード）
            </button>
          )}

          {isClient && request.status === 'draft' && (
            <p className="text-sm text-gray-400 text-center mb-4">
              これはあなたが作成した依頼です
            </p>
          )}

          <div className="text-sm text-gray-500 pt-4 border-t">
            作成日: {new Date(request.created_at).toLocaleDateString('ja-JP')}
          </div>
        </div>
      </div>
    </div>
  )
}

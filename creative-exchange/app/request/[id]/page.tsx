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
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          categories (name)
        `)
        .eq('id', id)
        .single()

      if (error) {
        setError('この依頼は存在しないか、閲覧権限がありません')
      } else {
        setRequest(data)
      }

      setLoading(false)
    }

    loadData()
  }, [id])

  const handleDeliver = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser || !request) {
      alert('ファイルが選択されていません')
      return
    }

    if (request.status !== 'matched') {
      alert('受注済みの依頼のみ納品できます')
      return
    }

    setUploading(true)

    const supabase = createClient()

    try {
      // ファイル名作成
      const fileExt = file.name.split('.').pop() || 'png'
      const filePath = `${id}/${Date.now()}-${file.name}`

      // Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from('deliverables')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // ステータスを 'delivered' に更新（一旦強制）
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) throw updateError

      alert('納品が完了しました！')
      window.location.reload()

    } catch (err: any) {
      console.error('納品エラー:', err)
      alert('納品に失敗しました: ' + (err.message || '不明なエラー'))
    } finally {
      setUploading(false)
      // ファイル入力のリセット
      e.target.value = ''
    }
  }

  if (loading) return <div className="p-12 text-center">読み込み中...</div>
  if (error) return <div className="p-12 text-center text-red-600">{error}</div>
  if (!request) return <div className="p-12 text-center">依頼が見つかりません</div>

  const isClient = request.client_id === currentUser?.id
  const isCreator = request.creator_id === currentUser?.id

  const canAccept = request.status === 'draft' && !isClient
  // テスト用に条件を緩めています（本番では isCreator && status === 'matched' に戻す）
  const canDeliver = isCreator || request.status === 'matched'

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <button 
          onClick={() => router.push('/mypage')}
          className="mb-6 text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          ← マイページに戻る
        </button>

        <div className="bg-white rounded-2xl shadow p-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold">{request.title}</h1>
            <span className={`px-4 py-1 rounded-full text-sm ${
              request.status === 'draft' ? 'bg-gray-100 text-gray-600' : 
              request.status === 'matched' ? 'bg-green-100 text-green-700' : 
              'bg-blue-100 text-blue-700'
            }`}>
              {request.status === 'draft' ? '募集中' : 
               request.status === 'matched' ? '受注済み' : '納品済み'}
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

          {canAccept && (
            <button 
              onClick={() => alert('受注は既に動作確認済みです')}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-medium mb-4"
            >
              この依頼を受注する
            </button>
          )}

          {canDeliver && (
            <label className="block w-full cursor-pointer">
              <input
                type="file"
                onChange={handleDeliver}
                disabled={uploading}
                className="hidden"
                accept="image/*,.pdf,.zip"
              />
              <div className={`w-full py-4 rounded-xl font-medium text-center text-white ${
                uploading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}>
                {uploading ? 'アップロード中...' : '納品する（ファイルアップロード）'}
              </div>
            </label>
          )}

          <div className="text-sm text-gray-500 mt-8 pt-4 border-t">
            作成日: {new Date(request.created_at).toLocaleDateString('ja-JP')}
          </div>
        </div>
      </div>
    </div>
  )
}

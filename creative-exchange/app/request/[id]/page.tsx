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
    if (!file || !currentUser || !request) return

    setUploading(true)
    const supabase = createClient()

    try {
      const fileExt = file.name.split('.').pop() || 'pdf'
      const safeFileName = `${Date.now()}.${fileExt}`
      const filePath = `${id}/${safeFileName}`

      const { error: uploadError } = await supabase.storage
        .from('deliverables')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'delivered', updated_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError

      alert('納品が完了しました！')
      window.location.reload()
    } catch (err: any) {
      alert('納品に失敗しました: ' + err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleComplete = async () => {
    const supabase = createClient()

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      alert('検収処理に失敗しました: ' + error.message)
    } else {
      alert('取引が完了しました！')
      window.location.reload()
    }
  }

  if (loading) return <div className="p-12 text-center">読み込み中...</div>
  if (error) return <div className="p-12 text-center text-red-600">{error}</div>
  if (!request) return <div className="p-12 text-center">依頼が見つかりません</div>

  const isClient = request.client_id === currentUser?.id
  const isCreator = request.creator_id === currentUser?.id

  const canAccept = request.status === 'draft' && !isClient
  const canDeliver = isCreator && request.status === 'matched'
  const canComplete = isClient   // ← テスト用に依頼者なら常に表示

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
              request.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
              'bg-purple-100 text-purple-700'
            }`}>
              {request.status === 'draft' ? '募集中' : 
               request.status === 'matched' ? '受注済み' : 
               request.status === 'delivered' ? '納品済み' : '完了'}
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
            <button onClick={() => alert('受注は既に動作確認済みです')} 
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-medium mb-4">
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
              <div className={`w-full py-4 rounded-xl font-medium text-center text-white ${uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {uploading ? 'アップロード中...' : '納品する（ファイルアップロード）'}
              </div>
            </label>
          )}

          {/* 検収ボタン（テスト用に依頼者なら常に表示） */}
          {canComplete && (
            <button
              onClick={handleComplete}
              className="w-full bg-purple-600 hover:bg-purple-700

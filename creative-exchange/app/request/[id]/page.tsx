'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function RequestDetail() {
  const params = useParams()
  const id = params.id as string
  const [request, setRequest] = useState<any>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      const supabase = createClient()

      // auth_id → users.id 変換
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
        .select(`*, categories (name)`)
        .eq('id', id)
        .single()

      if (fetchError) {
        setError('この依頼は存在しないか、閲覧権限がありません')
      } else {
        setRequest(data)
      }

      // 納品ファイル取得
      const { data: files } = await supabase
        .from('deliverables')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false })

      if (files) setDeliverables(files)

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

    if (updateError) alert('受注失敗: ' + updateError.message)
    else {
      alert('依頼を受注しました！')
      window.location.reload()
    }
  }

  // 納品処理
  const handleDeliver = async () => {
    if (!selectedFile || !profile) return
    setUploading(true)

    const supabase = createClient()
    const filePath = `${id}/${Date.now()}_${selectedFile.name}`

    // Supabase Storageにアップロード
    const { error: uploadError } = await supabase.storage
      .from('deliverables')
      .upload(filePath, selectedFile)

    if (uploadError) {
      alert('ファイルアップロードに失敗しました: ' + uploadError.message)
      setUploading(false)
      return
    }

    // deliverablesテーブルにレコード追加
    const { error: insertError } = await supabase
      .from('deliverables')
      .insert({
        order_id: id,
        file_path: filePath,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        mime_type: selectedFile.type
      })

    if (insertError) {
      alert('納品記録の保存に失敗しました: ' + insertError.message)
      setUploading(false)
      return
    }

    // ステータスを納品済みに変更
    await supabase
      .from('orders')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    alert('納品が完了しました！')
    setUploading(false)
    setSelectedFile(null)
    window.location.reload()
  }

  // 検収処理
  const handleComplete = async () => {
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) alert('検収処理に失敗しました: ' + updateError.message)
    else {
      alert('取引が完了しました！')
      window.location.reload()
    }
  }

  if (loading) return <div className="p-12 text-center">読み込み中...</div>
  if (error) return <div className="p-12 text-center text-red-600">{error}</div>
  if (!request) return <div className="p-12 text-center">依頼が見つかりません</div>

  const isClient = request.client_id === profile?.id
  const isCreator = request.creator_id === profile?.id
  const canAccept = request.status === 'draft' && !isClient
  const canDeliver = isCreator && request.status === 'matched'
  const canComplete = isClient && request.status === 'delivered'
  const canReview = (isClient || isCreator) && request.status === 'completed'

  // ステータス表示
  const statusLabel: Record<string, string> = {
    draft: '公開中',
    open: '公開中',
    matched: '受注済み',
    in_progress: '制作中',
    delivered: '納品済み',
    revision: '修正依頼中',
    completed: '取引完了',
    cancelled: 'キャンセル'
  }

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    open: 'bg-gray-100 text-gray-600',
    matched: 'bg-green-100 text-green-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    delivered: 'bg-blue-100 text-blue-700',
    revision: 'bg-orange-100 text-orange-700',
    completed: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-red-100 text-red-700'
  }

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
          {/* ヘッダー */}
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold">{request.title}</h1>
            <span className={`px-4 py-1 rounded-full text-sm ${statusColor[request.status] || 'bg-gray-100'}`}>
              {statusLabel[request.status] || request.status}
            </span>
          </div>

          {/* 品目 */}
          <div className="mb-8">
            <p className="text-sm text-gray-500">品目</p>
            <p className="text-lg font-medium">{request.categories?.name || '未分類'}</p>
          </div>

          {/* 依頼内容 */}
          <div className="mb-8">
            <p className="text-sm text-gray-500">依頼内容</p>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{request.description}</p>
          </div>

          {/* 希望予算 */}
          {request.agreed_price && (
            <div className="mb-8">
              <p className="text-sm text-gray-500">希望予算</p>
              <p className="text-2xl font-semibold text-blue-600">
                ¥{request.agreed_price.toLocaleString()}
              </p>
            </div>
          )}

          {/* 納品ファイル一覧 */}
          {deliverables.length > 0 && (
            <div className="mb-8">
              <p className="text-sm text-gray-500 mb-3">納品ファイル</p>
              <div className="space-y-2">
                {deliverables.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium">{file.file_name}</p>
                      <p className="text-xs text-gray-400">
                        {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ''} ・
                        {new Date(file.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 受注ボタン */}
          {canAccept && (
            <button
              onClick={handleAccept}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-medium text-lg mb-4"
            >
              この依頼を受注する
            </button>
          )}

          {/* 納品エリア */}
          {canDeliver && (
            <div className="mb-4">
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mb-3 w-full text-sm"
              />
              <button
                onClick={handleDeliver}
                disabled={!selectedFile || uploading}
                className={`w-full py-4 rounded-xl font-medium text-lg text-white ${
                  !selectedFile || uploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {uploading ? 'アップロード中...' : '納品する（ファイルアップロード）'}
              </button>
            </div>
          )}

          {/* 検収ボタン */}
          {canComplete && (
            <button
              onClick={handleComplete}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-medium text-lg mb-4"
            >
              検収OK（取引完了）
            </button>
          )}

          {/* 評価ボタン */}
          {canReview && (
            <button
              onClick={() => router.push(`/request/${id}/review`)}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-xl font-medium text-lg mb-4"
            >
              取引を評価する
            </button>
          )}

          {/* 自分の依頼表示 */}
          {isClient && request.status === 'draft' && (
            <p className="text-sm text-gray-400 text-center mb-4">
              これはあなたが作成した依頼です
            </p>
          )}

          {/* 作成日 */}
          <div className="text-sm text-gray-500 pt-4 border-t">
            作成日: {new Date(request.created_at).toLocaleDateString('ja-JP')}
          </div>
        </div>
      </div>
    </div>
  )
}

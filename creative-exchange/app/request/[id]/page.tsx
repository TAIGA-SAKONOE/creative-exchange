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
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('id, display_name')
          .eq('auth_id', user.id)
          .single()
        setProfile(userProfile)
      }

      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select(`*, categories (name)`)
        .eq('id', id)
        .single()

      if (fetchError) {
        setError('この依頼は存在しないか、閲覧権限がありません')
      } else {
        setRequest(orderData)
      }

      const { data: files } = await supabase
        .from('deliverables')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false })

      if (files) setDeliverables(files)

    } catch (err) {
      setError('データの読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!profile?.id || !request) return
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({
        creator_id: profile.id,
        status: 'matched',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (!error) {
      alert('依頼を受注しました！')
      loadData()
    }
  }

  const handleDeliver = async () => {
    if (!selectedFile || !profile?.id) return
    setUploading(true)
    const supabase = createClient()

    try {
      const filePath = `${id}/${Date.now()}_${selectedFile.name}`

      const { error: uploadError } = await supabase.storage
        .from('deliverables')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      const { error: insertError } = await supabase
        .from('deliverables')
        .insert({
          order_id: id,
          file_path: filePath,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type
        })

      if (insertError) throw insertError

      await supabase
        .from('orders')
        .update({ status: 'delivered', delivered_at: new Date().toISOString() })
        .eq('id', id)

      alert('納品が完了しました！')
      loadData()
    } catch (err: any) {
      alert('納品に失敗しました: ' + err.message)
    } finally {
      setUploading(false)
      setSelectedFile(null)
    }
  }

  const handleComplete = async () => {
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', id)

    if (!error) {
      alert('取引が完了しました！')
      loadData()
    }
  }

  if (loading) return <div className="p-12 text-center">読み込み中...</div>
  if (error) return <div className="p-12 text-center text-red-600">{error}</div>
  if (!request) return <div className="p-12 text-center">依頼が見つかりません</div>

  const isClient = profile?.id && String(request.client_id) === String(profile.id)
  const isCreator = profile?.id && String(request.creator_id) === String(profile.id)

  const canAccept = request.status === 'draft' && !isClient
  const canDeliver = isCreator && request.status === 'matched'
  const canComplete = isClient && request.status === 'delivered'
  const canReview = (isClient || isCreator) && request.status === 'completed'

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => router.push('/mypage')}
          className="mb-8 text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          ← マイページに戻る
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-10 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold mb-2">{request.title}</h1>
                <p className="text-xl opacity-90">{request.categories?.name}</p>
              </div>
              <div className={`px-6 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm`}>
                {request.status === 'draft' && '公開中'}
                {request.status === 'matched' && '受注済み'}
                {request.status === 'delivered' && '納品済み'}
                {request.status === 'completed' && '取引完了'}
              </div>
            </div>
          </div>

          <div className="p-10">
            <div className="mb-10">
              <p className="text-sm text-gray-500 mb-2">依頼内容</p>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                {request.description}
              </p>
            </div>

            {request.agreed_price && (
              <div className="mb-10 p-6 bg-gray-50 rounded-2xl">
                <p className="text-sm text-gray-500 mb-1">希望予算</p>
                <p className="text-4xl font-bold text-blue-600">
                  ¥{Number(request.agreed_price).toLocaleString()}
                </p>
              </div>
            )}

            {/* 納品ファイル */}
            {deliverables.length > 0 && (
              <div className="mb-10">
                <p className="text-sm text-gray-500 mb-4">納品ファイル</p>
                <div className="space-y-3">
                  {deliverables.map((file: any) => (
                    <a
                      key={file.id}
                      href={file.file_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-5 bg-gray-50 hover:bg-gray-100 rounded-2xl transition group"
                    >
                      <div className="text-3xl">📎</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(file.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* アクションボタン */}
            <div className="space-y-4 pt-6 border-t">
              {canAccept && (
                <button
                  onClick={handleAccept}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl font-medium text-lg shadow-sm"
                >
                  この依頼を受注する
                </button>
              )}

              {canDeliver && (
                <div className="space-y-4">
                  <p className="font-medium text-gray-700">納品ファイルをアップロード</p>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-sm"
                  />
                  <button
                    onClick={handleDeliver}
                    disabled={!selectedFile || uploading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-5 rounded-2xl font-medium text-lg shadow-sm"
                  >
                    {uploading ? 'アップロード中...' : '納品する'}
                  </button>
                </div>
              )}

              {canComplete && (
                <button
                  onClick={handleComplete}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5 rounded-2xl font-medium text-lg shadow-sm"
                >
                  検収OK（取引を完了する）
                </button>
              )}

              {canReview && (
                <button
                  onClick={() => router.push(`/request/${id}/review`)}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-5 rounded-2xl font-medium text-lg shadow-sm"
                >
                  取引を評価する
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

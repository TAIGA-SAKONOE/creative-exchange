'use client'

import LoadingState from '../../components/LoadingState'
import MessageState from '../../components/MessageState'
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
      setLoading(true)
      setError(null)

      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) {
        router.replace('/login')
        return
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, display_name')
        .eq('auth_id', user.id)
        .single()

      if (profileError || !userProfile) {
        setError('プロフィール情報の取得に失敗しました')
        return
      }

      setProfile(userProfile)

      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          categories (name)
        `)
        .eq('id', id)
        .single()

      if (fetchError || !orderData) {
        setError('この依頼は存在しないか、閲覧権限がありません')
        return
      }

      setRequest(orderData)

      const { data: files, error: filesError } = await supabase
        .from('deliverables')
        .select('*')
        .eq('order_id', id)
        .order('uploaded_at', { ascending: false })

      if (filesError) {
        console.error('deliverables取得エラー', filesError)
      } else {
        setDeliverables(files ?? [])
      }
    } catch (err: any) {
      setError(err.message || 'データの読み込み中にエラーが発生しました')
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      alert('受注に失敗しました: ' + error.message)
      return
    }

    alert('依頼を受注しました！')
    loadData()
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

      const {
        data: { publicUrl },
      } = supabase.storage.from('deliverables').getPublicUrl(filePath)

      const { error: insertError } = await supabase
        .from('deliverables')
        .insert({
          order_id: id,
          file_url: publicUrl,
          file_type: selectedFile.type || null,
          version: 1,
          note: selectedFile.name,
        })

      if (insertError) throw insertError

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError

      alert('納品が完了しました！')
      setSelectedFile(null)
      loadData()
    } catch (err: any) {
      alert('納品に失敗しました: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleComplete = async () => {
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      alert('検収に失敗しました: ' + error.message)
      return
    }

    alert('取引が完了しました！')
    loadData()
  }

  if (loading) {
  return <LoadingState message="依頼詳細を読み込み中..." />
}

if (error) {
  return (
    <MessageState
      title="依頼詳細を表示できません"
      message={error}
      tone="error"
    />
  )
}

if (!request) {
  return (
    <MessageState
      title="依頼が見つかりません"
      message="指定された依頼は存在しないか、現在は閲覧できません。"
    />
  )
}

  const isClient = profile?.id && String(request.client_id) === String(profile.id)
  const isCreator = profile?.id && String(request.creator_id) === String(profile.id)

  const canAccept = request.status === 'open' && !isClient && !request.creator_id
  const canDeliver =
    isCreator && ['matched', 'in_progress', 'revision'].includes(request.status)
  const canComplete = isClient && request.status === 'delivered'
  const canReview = (isClient || isCreator) && request.status === 'completed'

  const statusLabel =
    request.status === 'draft'
      ? '下書き'
      : request.status === 'open'
        ? '公開中'
        : request.status === 'matched'
          ? '受注済み'
          : request.status === 'in_progress'
            ? '制作中'
            : request.status === 'revision'
              ? '修正依頼中'
              : request.status === 'delivered'
                ? '納品済み'
                : request.status === 'completed'
                  ? '取引完了'
                  : request.status === 'cancelled'
                    ? 'キャンセル'
                    : request.status

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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-10 text-white">
            <div className="flex justify-between items-start gap-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">{request.title}</h1>
                <p className="text-xl opacity-90">{request.categories?.name}</p>
              </div>
              <div className="px-6 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm whitespace-nowrap">
                {statusLabel}
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

            <div className="mb-10">
              <p className="text-sm text-gray-500 mb-4">納品ファイル</p>

              {deliverables.length > 0 ? (
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
                        <p className="font-medium truncate">
                          {file.note || '納品ファイル'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.uploaded_at
                            ? new Date(file.uploaded_at).toLocaleDateString('ja-JP')
                            : ''}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-5 bg-gray-50 rounded-2xl text-gray-500 text-sm">
                  まだ納品ファイルはありません
                </div>
              )}
            </div>

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

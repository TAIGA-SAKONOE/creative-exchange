'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function RequestDetail() {
  const params = useParams()
  const id = params.id as string

  const [request, setRequest] = useState<any>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    loadRequestData()
  }, [id])

  const loadRequestData = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('id, display_name')
        .eq('auth_id', user.id)
        .single()
      setCurrentUser(profile)
    }

    // 依頼情報取得
    const { data: req } = await supabase
      .from('orders')
      .select(`
        *,
        categories(name),
        client:users!client_id(display_name),
        creator:users!creator_id(display_name)
      `)
      .eq('id', id)
      .single()

    setRequest(req)

    // 納品ファイル取得
    if (req) {
      const { data: files } = await supabase
        .from('deliverables')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false })

      setDeliverables(files || [])
    }

    setLoading(false)
  }

  const handleAccept = async () => {
    if (!currentUser || !request) return

    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'matched',
        creator_id: currentUser.id 
      })
      .eq('id', id)

    if (!error) {
      alert('受注しました！')
      loadRequestData()
    }
  }

  const handleDeliver = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser || !request) return

    setUploading(true)
    const supabase = createClient()

    try {
      // 安全なファイル名生成
      const fileExt = file.name.split('.').pop()
      const safeFileName = `${Date.now()}.${fileExt}`
      const filePath = `${id}/${safeFileName}`

      const { error: uploadError } = await supabase.storage
        .from('deliverables')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('deliverables')
        .getPublicUrl(filePath)

      // deliverablesテーブルに登録
      await supabase.from('deliverables').insert({
        order_id: id,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type
      })

      // ステータスを納品済みに更新
      await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', id)

      alert('納品が完了しました！')
      loadRequestData()
    } catch (err: any) {
      alert('納品に失敗しました: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleComplete = async () => {
    if (!request) return

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
      loadRequestData()
    }
  }

  if (loading) return <div className="p-12 text-center">読み込み中...</div>
  if (!request) return <div className="p-12 text-center">依頼が見つかりません</div>

  const isClient = currentUser?.id === request.client_id
  const isCreator = currentUser?.id === request.creator_id
  const canAccept = request.status === 'draft' && !isClient
  const canDeliver = isCreator && request.status === 'matched'
  const canComplete = isClient && request.status === 'delivered'

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <button onClick={() => router.back()} className="mb-6 text-gray-500 hover:text-gray-700">
          ← 戻る
        </button>

        <div className="bg-white rounded-3xl shadow p-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold">{request.title}</h1>
              <p className="text-gray-600 mt-2">{request.categories?.name}</p>
            </div>
            <div className={`px-5 py-2 rounded-full text-sm font-medium
              ${request.status === 'completed' ? 'bg-green-100 text-green-700' : 
                request.status === 'delivered' ? 'bg-purple-100 text-purple-700' :
                request.status === 'matched' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              {request.status === 'draft' && '下書き'}
              {request.status === 'open' && '公開中'}
              {request.status === 'matched' && '受注済み'}
              {request.status === 'delivered' && '納品済み'}
              {request.status === 'completed' && '取引完了'}
            </div>
          </div>

          <div className="prose max-w-none mb-10">
            <p>{request.description}</p>
          </div>

          {request.agreed_price && (
            <div className="mb-10 p-6 bg-gray-50 rounded-2xl">
              <p className="text-sm text-gray-500">合意金額</p>
              <p className="text-3xl font-bold">¥{request.agreed_price.toLocaleString()}</p>
            </div>
          )}

          {/* 納品ファイル表示エリア */}
          {deliverables.length > 0 && (
            <div className="mb-10">
              <h3 className="font-semibold mb-4">納品ファイル</h3>
              <div className="space-y-3">
                {deliverables.map((file, index) => (
                  <a
                    key={index}
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-3"
                  >
                    📎 {file.file_name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex flex-col gap-4">
            {canAccept && (
              <button onClick={handleAccept} className="w-full bg-green-600 text-white py-4 rounded-2xl font-medium">
                この依頼を受注する
              </button>
            )}

            {canDeliver && (
              <label className="w-full bg-purple-600 text-white py-4 rounded-2xl font-medium text-center cursor-pointer hover:bg-purple-700">
                納品する（ファイルアップロード）
                <input type="file" className="hidden" onChange={handleDeliver} disabled={uploading} />
              </label>
            )}

            {canComplete && (
              <button onClick={handleComplete} className="w-full bg-green-600 text-white py-4 rounded-2xl font-medium">
                検収OK → 取引完了にする
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

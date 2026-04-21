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
  const router = useRouter()

  useEffect(() => {
    if (!id) return

    const loadRequest = async () => {
      const supabase = createClient()

      const { data, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          categories (name)
        `)
        .eq('id', id)
        .single()

      if (orderError) {
        console.error('Fetch error:', orderError)
        setError('この依頼は存在しないか、閲覧権限がありません')
      } else {
        setRequest(data)
      }

      setLoading(false)
    }

    loadRequest()
  }, [id])

  if (loading) return <div className="p-12 text-center">読み込み中...</div>
  if (error) return <div className="p-12 text-center text-red-600">{error}</div>
  if (!request) return <div className="p-12 text-center">依頼が見つかりません</div>

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
              request.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
            }`}>
              {request.status === 'draft' ? '下書き' : '公開中'}
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

          <div className="text-sm text-gray-500 pt-4 border-t">
            作成日: {new Date(request.created_at).toLocaleDateString('ja-JP')}
          </div>
        </div>
      </div>
    </div>
  )
}

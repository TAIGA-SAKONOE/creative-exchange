'use client'

import { createClient } from '../../../../lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ReviewPage() {
  const params = useParams()
  const id = params.id as string

  const [request, setRequest] = useState<any>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadRequest = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          categories (name)
        `)
        .eq('id', id)
        .single()

      if (error) {
        alert('依頼情報の取得に失敗しました')
        router.push('/mypage')
      } else {
        setRequest(data)
      }

      setLoading(false)
    }

    loadRequest()
  }, [id, router])

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      alert('コメントを入力してください')
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインしてください')

      // Auth ID → users.id 変換（必須パターン）
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (!profile) throw new Error('ユーザー情報が見つかりません')

      // 評価対象者（相手）を特定
      const revieweeId = request.client_id === profile.id 
        ? request.creator_id 
        : request.client_id

      const { error } = await supabase
        .from('reviews')
        .insert({
          order_id: id,
          reviewer_id: profile.id,
          reviewee_id: revieweeId,
          rating,
          comment: comment.trim()
        })

      if (error) throw error

      alert('評価を送信しました！ありがとうございます！')
      router.push(`/request/${id}`)   // 依頼詳細ページに戻る

    } catch (err: any) {
      alert('評価の保存に失敗しました: ' + (err.message || '不明なエラー'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-12 text-center">読み込み中...</div>
  if (!request) return <div className="p-12 text-center">依頼が見つかりません</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <button 
          onClick={() => router.push(`/request/${id}`)}
          className="mb-6 text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          ← 依頼詳細に戻る
        </button>

        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-2xl font-bold mb-6">この取引を評価する</h1>

          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-2">取引内容</p>
            <p className="font-medium">{request.title}</p>
          </div>

          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-3">評価（星）</p>
            <div className="flex gap-2 text-4xl">
              {[1,2,3,4,5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-2">コメント</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="取引の感想や相手への感謝を教えてください"
              className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 resize-y"
            />
          </div>

          <button
            onClick={handleSubmitReview}
            disabled={submitting || !comment.trim()}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-medium text-lg"
          >
            {submitting ? '送信中...' : '評価を送信する'}
          </button>
        </div>
      </div>
    </div>
  )
}

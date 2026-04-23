'use client'

import { createClient } from '../../../../lib/supabase/client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import LoadingState from '../../../components/LoadingState'
import MessageState from '../../../components/MessageState'

export default function ReviewPage() {
  const params = useParams()
  const id = params.id as string

  const [request, setRequest] = useState<any>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    const loadRequest = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.replace('/login')
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single()

        if (profileError || !profile) {
          throw new Error('ユーザー情報の取得に失敗しました')
        }

        setProfileId(profile.id)

        const { data, error: requestError } = await supabase
          .from('orders')
          .select(`
            *,
            categories (name)
          `)
          .eq('id', id)
          .single()

        if (requestError || !data) {
          throw new Error('依頼情報の取得に失敗しました')
        }

        setRequest(data)
      } catch (err: any) {
        setError(err.message || 'ページの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (id) loadRequest()
  }, [id, router])

  const revieweeId = useMemo(() => {
    if (!request || !profileId) return null

    let target = request.creator_id
    if (profileId === request.creator_id) {
      target = request.client_id
    }

    return target ?? null
  }, [request, profileId])

  const isSelfReview = !!profileId && !!revieweeId && profileId === revieweeId

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      alert('コメントを入力してください')
      return
    }

    if (!profileId || !revieweeId) {
      alert('評価対象が特定できません')
      return
    }

    if (isSelfReview) {
      alert('この取引では自分自身を評価できません')
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          order_id: id,
          reviewer_id: profileId,
          reviewee_id: revieweeId,
          rating: rating,
          comment: comment.trim(),
        })

      if (error) throw error

      alert('評価を送信しました！ありがとうございます！')
      router.push(`/request/${id}`)
    } catch (err: any) {
      console.error(err)
      alert('評価の保存に失敗しました: ' + (err.message || '不明なエラー'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingState message="評価ページを読み込み中..." />
  }

  if (error) {
    return (
      <MessageState
        title="評価ページを表示できません"
        message={error}
        tone="error"
      />
    )
  }

  if (!request) {
    return (
      <MessageState
        title="依頼が見つかりません"
        message="指定された取引は存在しないか、現在は表示できません。"
      />
    )
  }

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

          {isSelfReview ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-800">
              この取引では、自分自身を評価することはできません。
              <br />
              別アカウント間の取引で評価機能を確認してください。
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-sm text-gray-500 mb-3">評価（星）</p>
                <div className="flex gap-2 text-4xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`transition-colors ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

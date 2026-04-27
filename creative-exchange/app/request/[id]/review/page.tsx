'use client'

import { createClient } from '../../../../lib/supabase/client'
import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

type OrderData = {
  id: string
  title: string
  client_id: string
  creator_id: string | null
  status: string
}

type StepData = {
  id: string
  order_id: string
  step_number: number
  title: string
  creator_id: string | null
  status: string
  users?:
    | {
        display_name: string | null
        twitter_handle: string | null
      }
    | {
        display_name: string | null
        twitter_handle: string | null
      }[]
    | null
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 p-12 text-center text-gray-500">
          読み込み中...
        </div>
      }
    >
      <ReviewPageContent />
    </Suspense>
  )
}

function ReviewPageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const orderId = params.id as string
  const stepId = searchParams.get('step_id')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [profile, setProfile] = useState<any>(null)
  const [order, setOrder] = useState<OrderData | null>(null)
  const [step, setStep] = useState<StepData | null>(null)

  const [revieweeId, setRevieweeId] = useState<string | null>(null)
  const [revieweeName, setRevieweeName] = useState<string>('評価相手')
  const [role, setRole] = useState<string>('')
  const [reviewType, setReviewType] = useState<'creator_review' | 'client_review'>('creator_review')

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  useEffect(() => {
    loadReviewTarget()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, stepId])

  const getStepCreatorName = (targetStep: StepData | null) => {
    if (!targetStep?.users) return '担当クリエイター'

    const user = Array.isArray(targetStep.users)
      ? targetStep.users[0]
      : targetStep.users

    return user?.display_name || user?.twitter_handle || '担当クリエイター'
  }

  const loadReviewTarget = async () => {
    setLoading(true)

    try {
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
        alert('プロフィール情報を取得できませんでした')
        router.push(`/request/${orderId}`)
        return
      }

      setProfile(userProfile)

      const { data: orderRow, error: orderError } = await supabase
        .from('orders')
        .select('id, title, client_id, creator_id, status')
        .eq('id', orderId)
        .single()

      if (orderError || !orderRow) {
        alert('依頼情報を取得できませんでした')
        router.push('/mypage')
        return
      }

      setOrder(orderRow as OrderData)

      if (stepId) {
        const { data: stepRow, error: stepError } = await supabase
          .from('order_steps')
          .select(`
            id,
            order_id,
            step_number,
            title,
            creator_id,
            status,
            users (
              display_name,
              twitter_handle
            )
          `)
          .eq('id', stepId)
          .eq('order_id', orderId)
          .single()

        if (stepError || !stepRow) {
          alert('工程情報を取得できませんでした')
          router.push(`/request/${orderId}`)
          return
        }

        const normalizedStep = stepRow as unknown as StepData
        setStep(normalizedStep)

        if (normalizedStep.status !== 'completed') {
          alert('完了済みの工程のみ評価できます')
          router.push(`/request/${orderId}`)
          return
        }

        if (!normalizedStep.creator_id) {
          alert('評価対象が特定できません')
          router.push(`/request/${orderId}`)
          return
        }

        if (String(orderRow.client_id) === String(userProfile.id)) {
          setRevieweeId(normalizedStep.creator_id)
          setRevieweeName(getStepCreatorName(normalizedStep))
          setRole('client_to_creator')
          setReviewType('creator_review')
          setLoading(false)
          return
        }

        if (String(normalizedStep.creator_id) === String(userProfile.id)) {
          setRevieweeId(orderRow.client_id)
          setRevieweeName('依頼者')
          setRole('creator_to_client')
          setReviewType('client_review')
          setLoading(false)
          return
        }

        alert('この工程を評価する権限がありません')
        router.push(`/request/${orderId}`)
        return
      }

      if (orderRow.status !== 'completed') {
        alert('完了済みの取引のみ評価できます')
        router.push(`/request/${orderId}`)
        return
      }

      if (!orderRow.creator_id) {
        alert('評価対象が特定できません')
        router.push(`/request/${orderId}`)
        return
      }

      if (String(orderRow.client_id) === String(userProfile.id)) {
        setRevieweeId(orderRow.creator_id)
        setRevieweeName('クリエイター')
        setRole('client_to_creator')
        setReviewType('creator_review')
        setLoading(false)
        return
      }

      if (String(orderRow.creator_id) === String(userProfile.id)) {
        setRevieweeId(orderRow.client_id)
        setRevieweeName('依頼者')
        setRole('creator_to_client')
        setReviewType('client_review')
        setLoading(false)
        return
      }

      alert('この取引を評価する権限がありません')
      router.push(`/request/${orderId}`)
    } catch (err: any) {
      alert('レビュー対象の取得に失敗しました: ' + err.message)
      router.push(`/request/${orderId}`)
    } finally {
      setLoading(false)
    }
  }

  const checkExistingReview = async () => {
    if (!profile?.id) return null

    const supabase = createClient()

    let query = supabase
      .from('reviews')
      .select('id')
      .eq('order_id', orderId)
      .eq('reviewer_id', profile.id)

    if (stepId) {
      query = query.eq('order_step_id', stepId)
    } else {
      query = query.is('order_step_id', null)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      throw error
    }

    return data
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile?.id || !order || !revieweeId) {
      alert('評価対象が特定できません')
      return
    }

    if (rating < 1 || rating > 5) {
      alert('評価は1〜5で選択してください')
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()

      const existingReview = await checkExistingReview()

      if (existingReview) {
        alert('この取引または工程はすでに評価済みです')
        router.push(`/request/${orderId}`)
        return
      }

      const reviewPayload = {
        order_id: orderId,
        order_step_id: stepId || null,
        reviewer_id: profile.id,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim() || null,
        role,
        review_type: reviewType,
      }

      const { data: insertedReview, error: insertError } = await supabase
        .from('reviews')
        .insert(reviewPayload)
        .select('id, order_id, order_step_id, reviewer_id, reviewee_id, rating, comment, role, review_type, created_at')
        .single()

      if (insertError) {
        throw new Error(`レビュー保存エラー: ${insertError.message}`)
      }

      if (!insertedReview) {
        throw new Error('レビュー保存後の確認データを取得できませんでした')
      }

      if (stepId && insertedReview.order_step_id !== stepId) {
        throw new Error('レビューは保存されましたが、工程IDが正しく保存されませんでした')
      }

      const { error: rpcError } = await supabase.rpc('recalculate_user_rating', {
        p_user_id: revieweeId,
      })

      if (rpcError) {
        throw new Error(`信用スコアの再計算に失敗しました: ${rpcError.message}`)
      }

      const { error: notificationError } = await supabase.from('notifications').insert({
        user_id: revieweeId,
        type: 'review_received',
        title: '新しい評価が届きました',
        body: step
          ? `工程「${step.title}」に評価が届きました。`
          : `「${order.title}」に評価が届きました。`,
        link_url: `/request/${orderId}`,
      })

      if (notificationError) {
        alert(
          '評価は保存されましたが、通知の作成に失敗しました: ' +
            notificationError.message
        )
        router.push(`/request/${orderId}`)
        return
      }

      alert('評価を送信しました')
      router.push(`/request/${orderId}`)
    } catch (err: any) {
      alert('評価の送信に失敗しました: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center text-gray-500">
            評価画面を読み込み中...
          </div>
        </div>
      </div>
    )
  }

  if (!order || !profile || !revieweeId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl p-10">
            <h1 className="text-2xl font-bold mb-4">評価できません</h1>
            <p className="text-gray-600 mb-6">評価対象が特定できませんでした。</p>
            <button
              onClick={() => router.push(`/request/${orderId}`)}
              className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-medium"
            >
              依頼詳細へ戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  const reviewTitle = step
    ? `工程「${step.title}」を評価する`
    : 'この取引を評価する'

  const reviewDescription = step
    ? `対象工程：工程${step.step_number} ${step.title}`
    : `対象取引：${order.title}`

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={() => router.push(`/request/${orderId}`)}
          className="mb-6 text-gray-500 hover:text-gray-700"
        >
          ← 依頼詳細へ戻る
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-6">{reviewTitle}</h1>

          <div className="bg-gray-50 rounded-2xl p-5 mb-8">
            <p className="text-sm text-gray-500 mb-2">評価対象</p>
            <p className="font-bold text-gray-900 mb-2">{reviewDescription}</p>
            <p className="text-sm text-gray-600">評価相手：{revieweeName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                評価
              </label>

              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-5xl transition ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    aria-label={`${star}点`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <p className="mt-3 text-sm text-gray-500">{rating} / 5</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                コメント
              </label>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={6}
                placeholder="取引・工程についてのコメントを入力してください"
                className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-yellow-200 resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white py-5 rounded-2xl font-medium text-lg shadow-sm"
            >
              {submitting ? '送信中...' : '評価を送信する'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

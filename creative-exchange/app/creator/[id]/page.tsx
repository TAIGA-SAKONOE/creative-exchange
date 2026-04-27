'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import LoadingState from '../../components/LoadingState'
import MessageState from '../../components/MessageState'
import EmptyState from '../../components/EmptyState'
import Link from 'next/link'

type ProductSalesSummary = {
  category_id: number | null
  category_name: string
  sales_count: number
  average_price: number
  median_price: number
  p25_price: number
  p75_price: number
  min_price: number
  max_price: number
}

type CreatorCategory = {
  category_id: number
  category_name: string
}

type CreatorReview = {
  id: string
  order_id: string
  order_step_id: string | null
  reviewer_id: string
  reviewee_id: string
  rating: number | null
  comment: string | null
  role: string | null
  review_type: 'creator_review' | 'client_review' | null
  created_at: string | null
  reviewer_name: string
  reviewer_handle: string | null
  step_title: string | null
  step_number: number | null
}

type PortfolioWork = {
  id: string
  title: string
  description: string | null
  category_id: number | null
  category_name: string | null
  image_urls: string[]
  external_url: string | null
  price_range_min: number | null
  price_range_max: number | null
  is_public: boolean
  sort_order: number
}

export default function CreatorProfile() {
  const params = useParams()
  const creatorId = params.id as string

  const [creator, setCreator] = useState<any>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  const [creatorCategories, setCreatorCategories] = useState<CreatorCategory[]>([])
  const [consultationCategoryId, setConsultationCategoryId] = useState<number | null>(null)
  const [personalPrices, setPersonalPrices] = useState<any[]>([])
  const [productSales, setProductSales] = useState<ProductSalesSummary[]>([])
  const [receivedReviews, setReceivedReviews] = useState<CreatorReview[]>([])
  const [portfolioWorks, setPortfolioWorks] = useState<PortfolioWork[]>([])
  const [selectedWork, setSelectedWork] = useState<PortfolioWork | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingConsultation, setCreatingConsultation] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const loadCreatorData = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()

        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (authUser) {
          const { data: myProfile } = await supabase
            .from('users')
            .select('id, display_name')
            .eq('auth_id', authUser.id)
            .single()
          if (myProfile) {
            setCurrentUserProfile(myProfile)
          }
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', creatorId)
          .single()

        if (profileError) throw profileError
        if (!profile) {
          setCreator(null)
          return
        }

        const nextViewCount = Number(profile.profile_view_count || 0) + 1
        await supabase
          .from('users')
          .update({ profile_view_count: nextViewCount })
          .eq('id', creatorId)

        setCreator({ ...profile, profile_view_count: nextViewCount })

        // カテゴリ
        const { data: categoryLinks } = await supabase
          .from('user_categories')
          .select(`category_id, categories(name)`)
          .eq('user_id', creatorId)

        const normalizedCategories: CreatorCategory[] = (categoryLinks || []).map((row: any) => {
          let categoryName = '未分類'
          if (Array.isArray(row.categories)) categoryName = row.categories[0]?.name || '未分類'
          else if (row.categories?.name) categoryName = row.categories.name
          return { category_id: row.category_id, category_name: categoryName }
        })
        setCreatorCategories(normalizedCategories)

        if (normalizedCategories.length > 0) {
          setConsultationCategoryId(normalizedCategories[0].category_id)
        } else {
          const { data: fallbackCategories } = await supabase
            .from('categories')
            .select('id')
            .order('name', { ascending: true })
            .limit(1)
          setConsultationCategoryId(fallbackCategories?.[0]?.id || null)
        }

        // ポートフォリオ作品
        const { data: workRows } = await supabase
          .from('portfolio_works')
          .select(`*, categories(name)`)
          .eq('user_id', creatorId)
          .eq('is_public', true)
          .order('sort_order', { ascending: true })

        if (workRows) {
          const works: PortfolioWork[] = workRows.map((row: any) => {
            let categoryName: string | null = null
            if (Array.isArray(row.categories)) categoryName = row.categories[0]?.name || null
            else if (row.categories?.name) categoryName = row.categories.name
            return {
              id: row.id,
              title: row.title,
              description: row.description,
              category_id: row.category_id,
              category_name: categoryName,
              image_urls: Array.isArray(row.image_urls) ? row.image_urls : [],
              external_url: row.external_url,
              price_range_min: row.price_range_min,
              price_range_max: row.price_range_max,
              is_public: row.is_public,
              sort_order: row.sort_order,
            }
          })
          setPortfolioWorks(works)
        }

        // レビュー
        const { data: reviews } = await supabase
          .from('reviews')
          .select(`id, order_id, order_step_id, reviewer_id, reviewee_id, rating, comment, role, review_type, created_at`)
          .eq('reviewee_id', creatorId)
          .order('created_at', { ascending: false })

        if (reviews) {
          const reviewerIds = Array.from(new Set((reviews).map((r: any) => r.reviewer_id).filter(Boolean)))
          const stepIds = Array.from(new Set((reviews).map((r: any) => r.order_step_id).filter(Boolean)))

          let reviewerMap = new Map<string, any>()
          let stepMap = new Map<string, any>()

          if (reviewerIds.length > 0) {
            const { data: reviewerRows } = await supabase
              .from('users')
              .select('id, display_name, twitter_handle')
              .in('id', reviewerIds)
            reviewerMap = new Map((reviewerRows || []).map((r: any) => [r.id, r]))
          }

          if (stepIds.length > 0) {
            const { data: stepRows } = await supabase
              .from('order_steps')
              .select('id, step_number, title')
              .in('id', stepIds)
            stepMap = new Map((stepRows || []).map((r: any) => [r.id, r]))
          }

          const normalizedReviews: CreatorReview[] = reviews.map((review: any) => {
            const reviewer = reviewerMap.get(review.reviewer_id)
            const step = review.order_step_id ? stepMap.get(review.order_step_id) : null
            return {
              id: review.id,
              order_id: review.order_id,
              order_step_id: review.order_step_id,
              reviewer_id: review.reviewer_id,
              reviewee_id: review.reviewee_id,
              rating: review.rating,
              comment: review.comment,
              role: review.role,
              review_type: review.review_type || 'creator_review',
              created_at: review.created_at,
              reviewer_name: reviewer?.display_name || reviewer?.twitter_handle || '匿名ユーザー',
              reviewer_handle: reviewer?.twitter_handle || null,
              step_title: step?.title || null,
              step_number: step?.step_number || null,
            }
          })
          setReceivedReviews(normalizedReviews)
        }

        // 受託価格
        const { data: prices } = await supabase.rpc('calculate_personal_prices', {
          p_creator_id: creatorId,
          p_days: 180,
        })
        setPersonalPrices(prices || [])

        // 作品販売実績
        const { data: purchaseRows } = await supabase
          .from('product_purchases')
          .select(`price, category_id, product_listings!inner(seller_user_id), categories(name)`)
          .eq('product_listings.seller_user_id', creatorId)

        const grouped = new Map<string, { category_id: number | null; category_name: string; prices: number[] }>()
        ;(purchaseRows || []).forEach((row: any) => {
          const categoryId = row.category_id ?? null
          let categoryName = '未分類'
          if (Array.isArray(row.categories)) categoryName = row.categories[0]?.name || '未分類'
          else if (row.categories?.name) categoryName = row.categories.name
          const key = `${categoryId ?? 'null'}:${categoryName}`
          if (!grouped.has(key)) grouped.set(key, { category_id: categoryId, category_name: categoryName, prices: [] })
          const price = Number(row.price || 0)
          if (Number.isFinite(price) && price > 0) grouped.get(key)!.prices.push(price)
        })

        const getMedian = (numbers: number[]) => {
          if (numbers.length === 0) return 0
          const sorted = [...numbers].sort((a, b) => a - b)
          const middle = Math.floor(sorted.length / 2)
          if (sorted.length % 2 === 0) return (sorted[middle - 1] + sorted[middle]) / 2
          return sorted[middle]
        }

        const getPercentile = (numbers: number[], percentile: number) => {
          if (numbers.length === 0) return 0
          const sorted = [...numbers].sort((a, b) => a - b)
          if (sorted.length === 1) return sorted[0]
          const index = (sorted.length - 1) * percentile
          const lower = Math.floor(index)
          const upper = Math.ceil(index)
          if (lower === upper) return sorted[lower]
          const weight = index - lower
          return sorted[lower] * (1 - weight) + sorted[upper] * weight
        }

        const salesSummary: ProductSalesSummary[] = Array.from(grouped.values())
          .filter((g) => g.prices.length > 0)
          .map((g) => ({
            category_id: g.category_id,
            category_name: g.category_name,
            sales_count: g.prices.length,
            average_price: g.prices.reduce((s, v) => s + v, 0) / g.prices.length,
            median_price: getMedian(g.prices),
            p25_price: getPercentile(g.prices, 0.25),
            p75_price: getPercentile(g.prices, 0.75),
            min_price: Math.min(...g.prices),
            max_price: Math.max(...g.prices),
          }))
          .sort((a, b) => b.sales_count - a.sales_count)

        setProductSales(salesSummary)
      } catch (err: any) {
        setError(err.message || '情報の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (creatorId) loadCreatorData()
  }, [creatorId])

  const visiblePrices = useMemo(() => {
    return personalPrices.filter((item: any) => (item.transaction_count ?? 0) >= 3)
  }, [personalPrices])

  const visibleProductSales = useMemo(() => {
    return productSales.filter((item) => item.sales_count >= 1)
  }, [productSales])

  const creatorReviews = useMemo(() => {
    return receivedReviews.filter(
      (review) => review.review_type === 'creator_review' || review.review_type === null
    )
  }, [receivedReviews])

  const clientReviews = useMemo(() => {
    return receivedReviews.filter((review) => review.review_type === 'client_review')
  }, [receivedReviews])

  const getAverageRating = (reviews: CreatorReview[]) => {
    const validRatings = reviews
      .map((r) => Number(r.rating || 0))
      .filter((r) => Number.isFinite(r) && r > 0)
    if (validRatings.length === 0) return 0
    return validRatings.reduce((s, r) => s + r, 0) / validRatings.length
  }

  const creatorAverageRating = getAverageRating(creatorReviews)
  const clientAverageRating = getAverageRating(clientReviews)
  const roundedCreatorAverageRating = creatorAverageRating > 0 ? creatorAverageRating.toFixed(1) : '-'
  const roundedClientAverageRating = clientAverageRating > 0 ? clientAverageRating.toFixed(1) : '-'
  const totalReviewCount = creatorReviews.length + clientReviews.length
  const isReferenceScore = totalReviewCount >= 3 && totalReviewCount < 10
  const shouldShowRatings = totalReviewCount >= 3
  const shouldShowTrustScore = totalReviewCount >= 5 && creator?.trust_score !== null && creator?.trust_score !== undefined
  const trustScore = Number(creator?.trust_score || 0)
  const trustGrade = trustScore >= 90 ? 'A' : trustScore >= 75 ? 'B' : trustScore >= 60 ? 'C' : 'D'

  const renderStars = (ratingValue: number) => {
    const rounded = Math.round(ratingValue)
    return (
      <span className="inline-flex gap-0.5 text-yellow-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>{star <= rounded ? '★' : '☆'}</span>
        ))}
      </span>
    )
  }

  const handleCreateConsultation = async () => {
    if (!creator) return
    if (!currentUserProfile?.id) {
      router.push('/login')
      return
    }
    if (String(currentUserProfile.id) === String(creatorId)) {
      alert('自分自身には相談できません')
      return
    }
    if (!consultationCategoryId) {
      alert('相談用の品目を設定できませんでした。')
      return
    }
    setCreatingConsultation(true)
    try {
      const supabase = createClient()
      const creatorName = creator.display_name || 'クリエイター'
      const { data: newOrder, error: insertError } = await supabase
        .from('orders')
        .insert({
          client_id: currentUserProfile.id,
          creator_id: creatorId,
          category_id: consultationCategoryId,
          title: `${creatorName}への事前相談`,
          description: '事前相談用の下書きです。依頼内容・予算・納期などをチャットで相談してください。',
          agreed_price: 0,
          deadline: null,
          specification: { type: 'creator_consultation', creator_id: creatorId },
          status: 'draft',
        })
        .select('id')
        .single()
      if (insertError) throw insertError
      if (!newOrder?.id) throw new Error('相談用依頼の作成に失敗しました')
      router.push(`/request/${newOrder.id}`)
    } catch (err: any) {
      alert('相談の開始に失敗しました: ' + err.message)
    } finally {
      setCreatingConsultation(false)
    }
  }

  if (loading) return <LoadingState message="クリエイター情報を読み込み中..." />
  if (error) return <MessageState title="情報を表示できません" message={error} tone="error" />
  if (!creator) return <MessageState title="クリエイターが見つかりません" message="指定されたプロフィールは存在しないか、現在は表示できません。" />

  const creatorName = creator.display_name || 'クリエイター'
  const isOwnProfile = currentUserProfile?.id && String(currentUserProfile.id) === String(creatorId)
  const isAcceptingOrders = creator?.is_accepting_orders !== false

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => router.back()}
          className="mb-6 text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          ← 戻る
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-10 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-white/20">
                  {creator.avatar_url ? (
                    <img
                      src={creator.avatar_url}
                      alt={creatorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">👤</span>
                  )}
                </div>
                <div>
                  <h1 className="text-4xl font-bold">{creatorName}</h1>
                  <p className="text-xl opacity-90">@{creator.twitter_handle || 'no handle'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {creator.rank === 'standard' && (
                      <span className="inline-flex px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                        スタンダード
                      </span>
                    )}
                    {creator.rank === 'prime' && (
                      <span className="inline-flex px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-bold">
                        プライム認定
                      </span>
                    )}
                    {isAcceptingOrders ? (
                      <span className="inline-flex px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                        依頼受付中
                      </span>
                    ) : (
                      <span className="inline-flex px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-bold">
                        受付停止中
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-right">
                <div className="bg-white/15 border border-white/20 rounded-2xl px-5 py-4 backdrop-blur-sm">
                  <p className="text-xs opacity-80 mb-1">プロフィール閲覧数</p>
                  <p className="text-2xl font-bold">{Number(creator.profile_view_count || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white/15 border border-white/20 rounded-2xl px-5 py-4 backdrop-blur-sm">
                  <p className="text-xs opacity-80 mb-1">平均評価</p>
                  <p className="text-2xl font-bold">{shouldShowRatings ? roundedCreatorAverageRating : '準備中'}</p>
                </div>
              </div>
            </div>

            {creator.bio && (
              <p className="mt-6 text-lg opacity-90 max-w-2xl">{creator.bio}</p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {creatorCategories.length > 0 ? (
                creatorCategories.map((category) => (
                  <span
                    key={category.category_id}
                    className="inline-flex px-3 py-1.5 rounded-full bg-white/20 text-white text-sm border border-white/20"
                  >
                    {category.category_name}
                  </span>
                ))
              ) : (
                <span className="inline-flex px-3 py-1.5 rounded-full bg-white/20 text-white text-sm border border-white/20">
                  品目未設定
                </span>
              )}
            </div>
          </div>

          <div className="p-10">

            {/* ポートフォリオ作品 */}
            {portfolioWorks.length > 0 && (
              <div className="mb-12">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">ポートフォリオ</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    {creatorName}さんの作品・制作実績です
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {portfolioWorks.map((work) => (
                    <button
                      key={work.id}
                      onClick={() => setSelectedWork(work)}
                      className="group text-left bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition"
                    >
                      {/* サムネイル */}
                      <div className="aspect-square bg-gray-100 overflow-hidden">
                        {work.image_urls.length > 0 ? (
                          <img
                            src={work.image_urls[0]}
                            alt={work.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                            🎨
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                          {work.title}
                        </p>
                        {work.category_name && (
                          <p className="text-xs text-gray-500">{work.category_name}</p>
                        )}
                        {(work.price_range_min || work.price_range_max) && (
                          <p className="text-xs text-blue-600 font-medium mt-1">
                            ¥{work.price_range_min?.toLocaleString() || '?'}
                            {work.price_range_max && ` 〜 ¥${work.price_range_max.toLocaleString()}`}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 受託価格表 */}
            <div className="mb-12">
              <div className="flex items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold">受託価格表</h2>
                  <p className="text-sm text-gray-500 mt-2">直近180日の受託取引から算出しています</p>
                </div>
              </div>

              {visiblePrices.length === 0 ? (
                <EmptyState
                  icon="📊"
                  title="まだ十分な受託取引実績がありません"
                  message="3件以上の取引が蓄積されると、カテゴリ別の価格帯が表示されます。初期βでは参考実績が増え次第、順次反映されます。"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {visiblePrices.map((item: any) => (
                    <div key={item.category_id} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                      <h3 className="font-semibold text-lg mb-4">{item.category_name}</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">中央値</span>
                          <span className="font-bold text-xl">¥{Math.round(item.median_price ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">価格帯（25〜75パーセンタイル）</span>
                          <span>¥{Math.round(item.p25_price ?? 0).toLocaleString()} 〜 ¥{Math.round(item.p75_price ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-500">取引件数: {item.transaction_count}件（直近180日）</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 既製品販売実績 */}
            <div className="border-t pt-12">
              <div className="mb-8">
                <h2 className="text-2xl font-bold">既製品販売実績</h2>
                <p className="text-sm text-gray-500 mt-2">作品マーケットで実際に販売された価格実績です</p>
              </div>

              {visibleProductSales.length === 0 ? (
                <EmptyState
                  icon="🛍️"
                  title="まだ既製品の販売実績がありません"
                  message="作品マーケットで販売が成立すると、販売価格の実績がここに表示されます。"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {visibleProductSales.map((item) => (
                    <div key={`${item.category_id ?? 'null'}-${item.category_name}`} className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                      <h3 className="font-semibold text-lg mb-4">{item.category_name}</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">中央値</span>
                          <span className="font-bold text-xl text-blue-600">¥{Math.round(item.median_price).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">価格帯（25〜75パーセンタイル）</span>
                          <span>¥{Math.round(item.p25_price).toLocaleString()} 〜 ¥{Math.round(item.p75_price).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-500">販売件数: {item.sales_count}件</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* レビュー */}
            <div className="border-t pt-12 mt-12">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold">評価・信用スコア</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    受注者としての評価と、依頼者としての評価を分けて表示します
                  </p>
                </div>

                {shouldShowTrustScore && (
                  <div className="bg-gray-900 text-white rounded-2xl px-6 py-4 text-right shadow-sm">
                    <p className="text-sm text-white/70 mb-1">総合信用スコア</p>
                    <div className="flex items-end justify-end gap-3">
                      <span className="text-4xl font-bold">{trustGrade}</span>
                      <span className="text-sm text-white/70 pb-1">{Math.round(trustScore)} / 100</span>
                    </div>
                  </div>
                )}
              </div>

              {!shouldShowRatings ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl">
                  評価準備中
                  <br />
                  3件以上のレビューが蓄積されると評価スコアを表示します
                </div>
              ) : (
                <div className="space-y-10">
                  {isReferenceScore && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-800">
                      現在の評価は参考値です。10件以上のレビューが蓄積されると通常表示になります。
                    </div>
                  )}

                  <section>
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
                      <div>
                        <h3 className="text-xl font-bold">受注者としてのレビュー</h3>
                        <p className="text-sm text-gray-500 mt-1">制作・納品を行った取引への評価です</p>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-100 rounded-2xl px-5 py-4 text-right">
                        <p className="text-sm text-gray-500 mb-1">受注者評価</p>
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-xl">{creatorAverageRating > 0 ? renderStars(creatorAverageRating) : '評価なし'}</span>
                          <span className="text-2xl font-bold text-gray-900">{roundedCreatorAverageRating}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {creatorReviews.length}件{isReferenceScore ? '・参考値' : ''}
                        </p>
                      </div>
                    </div>

                    {creatorReviews.length === 0 ? (
                      <EmptyState
                        icon="⭐"
                        title="まだ受注者としてのレビューはありません"
                        message="制作・納品を行った取引のレビューが蓄積されると、受注者としての評価が表示されます。"
                      />
                    ) : (
                      <div className="space-y-4">
                        {creatorReviews.map((review) => (
                          <div key={review.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-xl">{renderStars(Number(review.rating || 0))}</span>
                                  <span className="font-bold text-gray-900">{review.rating || '-'} / 5</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                  評価者：{review.reviewer_name}
                                  {review.reviewer_handle ? `（@${review.reviewer_handle}）` : ''}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500">
                                {review.created_at ? new Date(review.created_at).toLocaleString('ja-JP') : ''}
                              </p>
                            </div>
                            {review.step_title && (
                              <div className="mb-4 inline-flex px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm border border-blue-100">
                                工程{review.step_number || ''}：{review.step_title}
                              </div>
                            )}
                            {review.comment ? (
                              <p className="text-gray-700 leading-7 whitespace-pre-wrap">{review.comment}</p>
                            ) : (
                              <p className="text-gray-400 text-sm">コメントはありません</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
                      <div>
                        <h3 className="text-xl font-bold">依頼者としてのレビュー</h3>
                        <p className="text-sm text-gray-500 mt-1">発注・検収を行った取引への評価です</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-right">
                        <p className="text-sm text-gray-500 mb-1">依頼者評価</p>
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-xl">{clientAverageRating > 0 ? renderStars(clientAverageRating) : '評価なし'}</span>
                          <span className="text-2xl font-bold text-gray-900">{roundedClientAverageRating}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {clientReviews.length}件{isReferenceScore ? '・参考値' : ''}
                        </p>
                      </div>
                    </div>

                    {clientReviews.length === 0 ? (
                      <EmptyState
                        icon="🤝"
                        title="まだ依頼者としてのレビューはありません"
                        message="依頼・検収を行った取引のレビューが蓄積されると、依頼者としての評価が表示されます。"
                      />
                    ) : (
                      <div className="space-y-4">
                        {clientReviews.map((review) => (
                          <div key={review.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-xl">{renderStars(Number(review.rating || 0))}</span>
                                  <span className="font-bold text-gray-900">{review.rating || '-'} / 5</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                  評価者：{review.reviewer_name}
                                  {review.reviewer_handle ? `（@${review.reviewer_handle}）` : ''}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500">
                                {review.created_at ? new Date(review.created_at).toLocaleString('ja-JP') : ''}
                              </p>
                            </div>
                            {review.comment ? (
                              <p className="text-gray-700 leading-7 whitespace-pre-wrap">{review.comment}</p>
                            ) : (
                              <p className="text-gray-400 text-sm">コメントはありません</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>

            {/* アクション */}
            {!isOwnProfile && (
              <div className="border-t pt-10 mt-12">
                {isAcceptingOrders ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={handleCreateConsultation}
                      disabled={creatingConsultation}
                      className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white py-4 rounded-2xl font-bold transition"
                    >
                      {creatingConsultation ? '相談を作成中...' : 'このクリエイターに相談する'}
                    </button>
                    <Link
                      href={`/request/new?creator_id=${creatorId}&type=named`}
                      className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition"
                    >
                      このクリエイターに依頼する
                    </Link>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
                    <p className="font-bold text-gray-900 mb-2">現在、依頼受付を停止しています</p>
                    <p className="text-sm text-gray-500">
                      このクリエイターは一時的に新規依頼の受付を停止しています。
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 作品詳細モーダル */}
      {selectedWork && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedWork(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedWork.image_urls.length > 0 && (
              <div className="aspect-video bg-gray-100 rounded-t-3xl overflow-hidden">
                <img
                  src={selectedWork.image_urls[0]}
                  alt={selectedWork.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="p-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{selectedWork.title}</h3>
                <button
                  onClick={() => setSelectedWork(null)}
                  className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {selectedWork.category_name && (
                <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm border border-blue-100 mb-4">
                  {selectedWork.category_name}
                </span>
              )}

              {selectedWork.description && (
                <p className="text-gray-700 leading-7 whitespace-pre-wrap mb-6">{selectedWork.description}</p>
              )}

              {(selectedWork.price_range_min || selectedWork.price_range_max) && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <p className="text-sm text-gray-500 mb-1">価格帯の目安</p>
                  <p className="text-xl font-bold text-blue-600">
                    ¥{selectedWork.price_range_min?.toLocaleString() || '?'}
                    {selectedWork.price_range_max && ` 〜 ¥${selectedWork.price_range_max.toLocaleString()}`}
                  </p>
                </div>
              )}

              {selectedWork.image_urls.length > 1 && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {selectedWork.image_urls.slice(1).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`作品画像${i + 2}`}
                      className="w-full aspect-square object-cover rounded-xl border border-gray-200"
                    />
                  ))}
                </div>
              )}

              {selectedWork.external_url && (
                <a
                  href={selectedWork.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center border border-gray-200 hover:bg-gray-50 py-3 rounded-2xl text-sm font-medium transition"
                >
                  外部リンクを見る →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

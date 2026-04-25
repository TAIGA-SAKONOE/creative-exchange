'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import LoadingState from '../../components/LoadingState'
import MessageState from '../../components/MessageState'
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
  created_at: string | null
  reviewer_name: string
  reviewer_handle: string | null
  step_title: string | null
  step_number: number | null
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

        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

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

        const { error: viewCountError } = await supabase
          .from('users')
          .update({
            profile_view_count: nextViewCount,
          })
          .eq('id', creatorId)

        if (viewCountError) {
          console.error('プロフィール閲覧数更新エラー', viewCountError)
        }

        setCreator({
          ...profile,
          profile_view_count: nextViewCount,
        })

        const { data: categoryLinks, error: categoryLinksError } = await supabase
          .from('user_categories')
          .select(`
            category_id,
            categories(name)
          `)
          .eq('user_id', creatorId)

        if (categoryLinksError) {
          console.error('クリエイター品目取得エラー', categoryLinksError)
        }

        const normalizedCategories: CreatorCategory[] = (categoryLinks || []).map((row: any) => {
          let categoryName = '未分類'

          if (Array.isArray(row.categories)) {
            categoryName = row.categories[0]?.name || '未分類'
          } else if (row.categories?.name) {
            categoryName = row.categories.name
          }

          return {
            category_id: row.category_id,
            category_name: categoryName,
          }
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

        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            id,
            order_id,
            order_step_id,
            reviewer_id,
            reviewee_id,
            rating,
            comment,
            role,
            created_at
          `)
          .eq('reviewee_id', creatorId)
          .order('created_at', { ascending: false })

        if (reviewsError) {
          console.error('レビュー取得エラー', reviewsError)
          setReceivedReviews([])
        } else {
          const reviewerIds = Array.from(
            new Set(
              (reviews || [])
                .map((review: any) => review.reviewer_id)
                .filter(Boolean)
            )
          )

          const stepIds = Array.from(
            new Set(
              (reviews || [])
                .map((review: any) => review.order_step_id)
                .filter(Boolean)
            )
          )

          let reviewerMap = new Map<string, any>()
          let stepMap = new Map<string, any>()

          if (reviewerIds.length > 0) {
            const { data: reviewerRows, error: reviewerError } = await supabase
              .from('users')
              .select('id, display_name, twitter_handle')
              .in('id', reviewerIds)

            if (reviewerError) {
              console.error('レビュー投稿者取得エラー', reviewerError)
            } else {
              reviewerMap = new Map((reviewerRows || []).map((row: any) => [row.id, row]))
            }
          }

          if (stepIds.length > 0) {
            const { data: stepRows, error: stepError } = await supabase
              .from('order_steps')
              .select('id, step_number, title')
              .in('id', stepIds)

            if (stepError) {
              console.error('レビュー工程取得エラー', stepError)
            } else {
              stepMap = new Map((stepRows || []).map((row: any) => [row.id, row]))
            }
          }

          const normalizedReviews: CreatorReview[] = (reviews || []).map((review: any) => {
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
              created_at: review.created_at,
              reviewer_name:
                reviewer?.display_name || reviewer?.twitter_handle || '匿名ユーザー',
              reviewer_handle: reviewer?.twitter_handle || null,
              step_title: step?.title || null,
              step_number: step?.step_number || null,
            }
          })

          setReceivedReviews(normalizedReviews)
        }

        const { data: prices, error: pricesError } = await supabase.rpc(
          'calculate_personal_prices',
          {
            p_creator_id: creatorId,
            p_days: 180,
          }
        )

        if (pricesError) throw pricesError

        setPersonalPrices(prices || [])

        const { data: purchaseRows, error: purchaseError } = await supabase
          .from('product_purchases')
          .select(`
            price,
            category_id,
            product_listings!inner(
              seller_user_id
            ),
            categories(name)
          `)
          .eq('product_listings.seller_user_id', creatorId)

        if (purchaseError) throw purchaseError

        const grouped = new Map<
          string,
          {
            category_id: number | null
            category_name: string
            prices: number[]
          }
        >()

        ;(purchaseRows || []).forEach((row: any) => {
          const categoryId = row.category_id ?? null

          let categoryName = '未分類'
          if (Array.isArray(row.categories)) {
            categoryName = row.categories[0]?.name || '未分類'
          } else if (row.categories?.name) {
            categoryName = row.categories.name
          }

          const key = `${categoryId ?? 'null'}:${categoryName}`

          if (!grouped.has(key)) {
            grouped.set(key, {
              category_id: categoryId,
              category_name: categoryName,
              prices: [],
            })
          }

          const price = Number(row.price || 0)
          if (Number.isFinite(price) && price > 0) {
            grouped.get(key)!.prices.push(price)
          }
        })

        const getMedian = (numbers: number[]) => {
          if (numbers.length === 0) return 0
          const sorted = [...numbers].sort((a, b) => a - b)
          const middle = Math.floor(sorted.length / 2)

          if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2
          }

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
          .filter((group) => group.prices.length > 0)
          .map((group) => {
            const prices = group.prices
            const salesCount = prices.length
            const averagePrice =
              prices.reduce((sum, value) => sum + value, 0) / salesCount
            const medianPrice = getMedian(prices)
            const p25Price = getPercentile(prices, 0.25)
            const p75Price = getPercentile(prices, 0.75)
            const minPrice = Math.min(...prices)
            const maxPrice = Math.max(...prices)

            return {
              category_id: group.category_id,
              category_name: group.category_name,
              sales_count: salesCount,
              average_price: averagePrice,
              median_price: medianPrice,
              p25_price: p25Price,
              p75_price: p75Price,
              min_price: minPrice,
              max_price: maxPrice,
            }
          })
          .sort((a, b) => b.sales_count - a.sales_count)

        setProductSales(salesSummary)
      } catch (err: any) {
        setError(err.message || '個人価格表の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (creatorId) loadCreatorData()
  }, [creatorId])

  const visiblePrices = useMemo(() => {
    return personalPrices.filter(
      (item: any) => (item.transaction_count ?? 0) >= 3
    )
  }, [personalPrices])

  const visibleProductSales = useMemo(() => {
    return productSales.filter((item) => item.sales_count >= 1)
  }, [productSales])

  const averageRating = useMemo(() => {
    const validRatings = receivedReviews
      .map((review) => Number(review.rating || 0))
      .filter((rating) => Number.isFinite(rating) && rating > 0)

    if (validRatings.length === 0) return 0

    const total = validRatings.reduce((sum, rating) => sum + rating, 0)
    return total / validRatings.length
  }, [receivedReviews])

  const roundedAverageRating = averageRating > 0 ? averageRating.toFixed(1) : '-'

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
      alert('相談用の品目を設定できませんでした。クリエイターの品目設定を確認してください。')
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
          description:
            '事前相談用の下書きです。依頼内容・予算・納期などをチャットで相談してください。',
          agreed_price: 0,
          deadline: null,
          specification: {
            type: 'creator_consultation',
            creator_id: creatorId,
          },
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

  if (loading) {
    return <LoadingState message="クリエイター情報を読み込み中..." />
  }

  if (error) {
    return (
      <MessageState
        title="個人価格表を表示できません"
        message={error}
        tone="error"
      />
    )
  }

  if (!creator) {
    return (
      <MessageState
        title="クリエイターが見つかりません"
        message="指定されたプロフィールは存在しないか、現在は表示できません。"
      />
    )
  }

  const creatorName = creator.display_name || 'クリエイター'
  const isOwnProfile =
    currentUserProfile?.id && String(currentUserProfile.id) === String(creatorId)

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
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-10 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center text-5xl">
                  👤
                </div>
                <div>
                  <h1 className="text-4xl font-bold">{creatorName}</h1>
                  <p className="text-xl opacity-90">
                    @{creator.twitter_handle || 'no handle'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-right">
                <div className="bg-white/15 border border-white/20 rounded-2xl px-5 py-4 backdrop-blur-sm">
                  <p className="text-xs opacity-80 mb-1">プロフィール閲覧数</p>
                  <p className="text-2xl font-bold">
                    {Number(creator.profile_view_count || 0).toLocaleString()}
                  </p>
                </div>

                <div className="bg-white/15 border border-white/20 rounded-2xl px-5 py-4 backdrop-blur-sm">
                  <p className="text-xs opacity-80 mb-1">平均評価</p>
                  <p className="text-2xl font-bold">
                    {roundedAverageRating}
                  </p>
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
            <div className="mb-12">
              <div className="flex items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold">受託価格表</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    直近180日の受託取引から算出しています
                  </p>
                </div>
              </div>

              {visiblePrices.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl">
                  まだ十分な受託取引実績がありません
                  <br />
                  3件以上の取引が蓄積されるとここに価格帯が表示されます
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {visiblePrices.map((item: any) => (
                    <div
                      key={item.category_id}
                      className="bg-gray-50 border border-gray-200 rounded-2xl p-6"
                    >
                      <h3 className="font-semibold text-lg mb-4">{item.category_name}</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">中央値</span>
                          <span className="font-bold text-xl">
                            ¥{Math.round(item.median_price ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            価格帯（25〜75パーセンタイル）
                          </span>
                          <span>
                            ¥{Math.round(item.p25_price ?? 0).toLocaleString()} 〜
                            ¥{Math.round(item.p75_price ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          取引件数: {item.transaction_count}件（直近180日）
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-12">
              <div className="flex items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold">既製品販売実績</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    作品マーケットで実際に販売された価格実績です
                  </p>
                </div>
              </div>

              {visibleProductSales.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl">
                  まだ既製品の販売実績がありません
                  <br />
                  作品マーケットで販売が成立すると、ここに価格実績が表示されます
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {visibleProductSales.map((item) => (
                    <div
                      key={`${item.category_id ?? 'null'}-${item.category_name}`}
                      className="bg-blue-50 border border-blue-100 rounded-2xl p-6"
                    >
                      <h3 className="font-semibold text-lg mb-4">{item.category_name}</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">中央値</span>
                          <span className="font-bold text-xl text-blue-600">
                            ¥{Math.round(item.median_price).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            価格帯（25〜75パーセンタイル）
                          </span>
                          <span>
                            ¥{Math.round(item.p25_price).toLocaleString()} 〜
                            ¥{Math.round(item.p75_price).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">平均価格</span>
                          <span>¥{Math.round(item.average_price).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>最安〜最高</span>
                          <span>
                            ¥{Math.round(item.min_price).toLocaleString()} 〜
                            ¥{Math.round(item.max_price).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          販売件数: {item.sales_count}件
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-12 mt-12">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold">受け取ったレビュー</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    依頼者・取引相手から届いた評価です
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-100 rounded-2xl px-5 py-4 text-right">
                  <p className="text-sm text-gray-500 mb-1">平均評価</p>
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-xl">
                      {averageRating > 0 ? renderStars(averageRating) : '評価なし'}
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {roundedAverageRating}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {receivedReviews.length}件のレビュー
                  </p>
                </div>
              </div>

              {receivedReviews.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl">
                  まだレビューはありません
                  <br />
                  取引完了後にレビューが届くとここに表示されます
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedReviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">
                              {renderStars(Number(review.rating || 0))}
                            </span>
                            <span className="font-bold text-gray-900">
                              {review.rating || '-'} / 5
                            </span>
                          </div>

                          <p className="text-sm text-gray-500">
                            評価者：{review.reviewer_name}
                            {review.reviewer_handle ? `（@${review.reviewer_handle}）` : ''}
                          </p>
                        </div>

                        <p className="text-xs text-gray-500">
                          {review.created_at
                            ? new Date(review.created_at).toLocaleString('ja-JP')
                            : ''}
                        </p>
                      </div>

                      {review.step_title && (
                        <div className="mb-4 inline-flex px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm border border-blue-100">
                          工程{review.step_number || ''}：{review.step_title}
                        </div>
                      )}

                      {review.comment ? (
                        <p className="text-gray-700 leading-7 whitespace-pre-wrap">
                          {review.comment}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          コメントはありません
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isOwnProfile && (
              <div className="border-t pt-10 mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleCreateConsultation}
                  disabled={creatingConsultation}
                  className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white py-4 rounded-2xl font-bold transition"
                >
                  {creatingConsultation
                    ? '相談を作成中...'
                    : 'このクリエイターに相談する'}
                </button>

                <Link
                  href={`/request/new?creator_id=${creatorId}&type=named`}
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition"
                >
                  このクリエイターに依頼する
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

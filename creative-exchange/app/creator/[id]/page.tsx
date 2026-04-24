'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import LoadingState from '../../components/LoadingState'
import MessageState from '../../components/MessageState'

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

export default function CreatorProfile() {
  const params = useParams()
  const creatorId = params.id as string
  const [creator, setCreator] = useState<any>(null)
  const [personalPrices, setPersonalPrices] = useState<any[]>([])
  const [productSales, setProductSales] = useState<ProductSalesSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadCreatorData = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()

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

        setCreator(profile)

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
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center text-5xl">
                👤
              </div>
              <div>
                <h1 className="text-4xl font-bold">{creator.display_name}</h1>
                <p className="text-xl opacity-90">
                  @{creator.twitter_handle || 'no handle'}
                </p>
              </div>
            </div>
            {creator.bio && (
              <p className="mt-6 text-lg opacity-90 max-w-2xl">{creator.bio}</p>
            )}
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
          </div>
        </div>
      </div>
    </div>
  )
}

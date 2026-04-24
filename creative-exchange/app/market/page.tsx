'use client'

import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import LoadingState from '../components/LoadingState'
import MessageState from '../components/MessageState'

type MarketStatRow = {
  median_price: number | null
  avg_price: number | null
  p25_price: number | null
  p75_price: number | null
  transaction_count: number
  confidence_label: string
}

type ProductMarketStatRow = {
  median_price: number | null
  avg_price: number | null
  min_price: number | null
  max_price: number | null
  transaction_count: number
}

type CategoryRow = {
  id: number
  name: string
}

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'products'>('requests')
  const [requestMarketData, setRequestMarketData] = useState<any[]>([])
  const [productMarketData, setProductMarketData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()

        const { data: categories, error } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (error) throw error

        const categoryRows = (categories || []) as CategoryRow[]

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

        const since = new Date()
        since.setDate(since.getDate() - 90)

        const requestResults = await Promise.all(
          categoryRows.map(async (category) => {
            const { data, error: statsError } = await supabase.rpc(
              'calculate_market_stats',
              {
                p_category_id: category.id,
                p_days: 90,
              }
            )

            if (statsError) {
              console.error('market stats error', category.name, statsError)
            }

            const requestStats: MarketStatRow =
              Array.isArray(data) && data.length > 0
                ? data[0]
                : {
                    median_price: null,
                    avg_price: null,
                    p25_price: null,
                    p75_price: null,
                    transaction_count: 0,
                    confidence_label: '参考値',
                  }

            return {
              ...category,
              stats: requestStats,
            }
          })
        )

        const productResults = await Promise.all(
          categoryRows.map(async (category) => {
            const { data: productRows, error: productError } = await supabase
              .from('product_purchases')
              .select('price, created_at')
              .eq('category_id', category.id)
              .gte('created_at', since.toISOString())
              .order('created_at', { ascending: false })

            if (productError) {
              console.error('product market stats error', category.name, productError)
            }

            const prices = (productRows || [])
              .map((row: any) => Number(row.price || 0))
              .filter((price) => Number.isFinite(price) && price > 0)

            const productStats: ProductMarketStatRow =
              prices.length > 0
                ? {
                    median_price: getMedian(prices),
                    avg_price:
                      prices.reduce((sum, price) => sum + price, 0) / prices.length,
                    min_price: Math.min(...prices),
                    max_price: Math.max(...prices),
                    transaction_count: prices.length,
                  }
                : {
                    median_price: null,
                    avg_price: null,
                    min_price: null,
                    max_price: null,
                    transaction_count: 0,
                  }

            return {
              ...category,
              stats: productStats,
              p25_price: prices.length > 0 ? getPercentile(prices, 0.25) : null,
              p75_price: prices.length > 0 ? getPercentile(prices, 0.75) : null,
            }
          })
        )

        setRequestMarketData(requestResults)
        setProductMarketData(productResults)
      } catch (err: any) {
        setError(err.message || '相場データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchMarketData()
  }, [])

  if (loading) {
    return <LoadingState message="相場データを読み込み中..." />
  }

  if (error) {
    return (
      <MessageState
        title="相場ボードを表示できません"
        message={error}
        tone="error"
      />
    )
  }

  const currentData =
    activeTab === 'requests' ? requestMarketData : productMarketData

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">相場ボード</h1>
          <p className="text-gray-600">
            受託相場と作品相場の両方を確認できます
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-3 mb-8">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-5 py-3 rounded-2xl font-medium transition ${
                activeTab === 'requests'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              受託相場
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-5 py-3 rounded-2xl font-medium transition ${
                activeTab === 'products'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              作品相場
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentData.map((item) => {
            const stats = item.stats
            const hasData = stats.transaction_count >= 5

            return (
              <div
                key={`${activeTab}-${item.id}`}
                className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition"
              >
                <div className="font-medium text-lg mb-4">{item.name}</div>

                {hasData ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {activeTab === 'requests' ? '取引件数' : '販売件数'}
                      </p>
                      <p className="text-2xl font-semibold">
                        {stats.transaction_count}件
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">中央値</p>
                      <p className="text-3xl font-bold text-blue-600">
                        ¥{Math.round(stats.median_price ?? 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">下位25%</p>
                        <p>
                          ¥{Math.round(
                            activeTab === 'requests'
                              ? item.stats.p25_price ?? 0
                              : item.p25_price ?? 0
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">上位25%</p>
                        <p>
                          ¥{Math.round(
                            activeTab === 'requests'
                              ? item.stats.p75_price ?? 0
                              : item.p75_price ?? 0
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm">
                      <p className="text-gray-500">
                        {activeTab === 'requests' ? '平均価格' : '平均販売価格'}
                      </p>
                      <p>
                        ¥{Math.round(stats.avg_price ?? 0).toLocaleString()}
                      </p>
                    </div>

                    {activeTab === 'products' && (
                      <div className="text-xs text-gray-500">
                        最安〜最高：
                        ¥{Math.round(stats.min_price ?? 0).toLocaleString()} 〜
                        ¥{Math.round(stats.max_price ?? 0).toLocaleString()}
                      </div>
                    )}

                    {activeTab === 'requests' && (
                      <div className="text-xs text-gray-500">
                        信頼度: {stats.confidence_label}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    データ不足です
                    <br />
                    5件以上の{activeTab === 'requests' ? '取引' : '販売'}が蓄積されると表示されます
                  </div>
                )}

                {activeTab === 'requests' ? (
                  <Link href={`/request/new?category=${item.id}`}>
                    <button className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-medium">
                      この品目で依頼を作成
                    </button>
                  </Link>
                ) : (
                  <Link href="/listing/new">
                    <button className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-medium">
                      この品目で作品を出品する
                    </button>
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          ※ 相場は直近90日間の実際の{activeTab === 'requests' ? '取引' : '販売'}データに基づいています
        </div>
      </div>
    </div>
  )
}

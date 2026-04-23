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

export default function MarketPage() {
  const [marketData, setMarketData] = useState<any[]>([])
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

        const results = []

        for (const category of categories || []) {
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

          const stats: MarketStatRow =
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

          results.push({
            ...category,
            stats,
          })
        }

        setMarketData(results)
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">相場ボード</h1>
          <p className="text-gray-600">
            クリエイティブ制作の最新相場を確認できます
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketData.map((item) => {
            const stats = item.stats
            const hasData = stats.transaction_count >= 5

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition"
              >
                <div className="font-medium text-lg mb-4">{item.name}</div>

                {hasData ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">取引件数</p>
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
                          ¥{Math.round(stats.p25_price ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">上位25%</p>
                        <p>
                          ¥{Math.round(stats.p75_price ?? 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      信頼度: {stats.confidence_label}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    データ不足です
                    <br />
                    5件以上の取引が蓄積されると表示されます
                  </div>
                )}

                <Link href={`/request/new?category=${item.id}`}>
                  <button className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-medium">
                    この品目で依頼を作成
                  </button>
                </Link>
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          ※ 相場は直近90日間の実際の取引データに基づいています
        </div>
      </div>
    </div>
  )
}

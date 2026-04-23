'use client'

import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function MarketPage() {
  const [marketData, setMarketData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMarketData = async () => {
      const supabase = createClient()

      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('カテゴリ取得エラー:', error)
        setLoading(false)
        return
      }

      const results = []
      for (const category of categories || []) {
        const { data: stats } = await supabase
          .rpc('calculate_market_stats', {
            p_category_id: category.id,
            p_days: 90
          })

console.log('market stats', category.name, stats)
        
        results.push({
          ...category,
          stats: stats || { count: 0, median: 0, p25: 0, p75: 0 }
        })
      }

      setMarketData(results)
      setLoading(false)
    }

    fetchMarketData()
  }, [])

  if (loading) {
    return <div className="p-12 text-center">相場データを読み込み中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">相場ボード</h1>
          <p className="text-gray-600">クリエイティブ制作の最新相場を確認できます</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketData.map((item) => {
            const stats = item.stats
            const hasData = stats.count > 0

            return (
              <div key={item.id} className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition">
                <div className="font-medium text-lg mb-4">{item.name}</div>

                {hasData ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">取引件数</p>
                      <p className="text-2xl font-semibold">{stats.count}件</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">中央値</p>
                      <p className="text-3xl font-bold text-blue-600">
                        ¥{Math.round(stats.median).toLocaleString()}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">下位25%</p>
                        <p>¥{Math.round(stats.p25).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">上位25%</p>
                        <p>¥{Math.round(stats.p75).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    データ不足です<br />
                    取引が蓄積されると表示されます
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

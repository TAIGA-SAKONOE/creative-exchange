'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function CreatorProfile() {
  const params = useParams()
  const creatorId = params.id as string
  const [creator, setCreator] = useState<any>(null)
  const [personalPrices, setPersonalPrices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadCreatorData = async () => {
      const supabase = createClient()

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', creatorId)
        .single()

      if (profile) {
        setCreator(profile)

        const { data: prices, error: pricesError } = await supabase.rpc(
          'calculate_personal_prices',
          {
            p_creator_id: creatorId,
            p_days: 180,
          }
        )

        if (pricesError) {
          console.error('個人価格表取得エラー:', pricesError)
        }

        setPersonalPrices(prices || [])
      }

      setLoading(false)
    }

    if (creatorId) loadCreatorData()
  }, [creatorId])

  if (loading) return <div className="p-12 text-center">読み込み中...</div>
  if (!creator) return <div className="p-12 text-center">クリエイターが見つかりません</div>

  const visiblePrices = personalPrices.filter(
    (item: any) => (item.transaction_count ?? 0) >= 3
  )

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
                <p className="text-xl opacity-90">@{creator.twitter_handle || 'no handle'}</p>
              </div>
            </div>
            {creator.bio && (
              <p className="mt-6 text-lg opacity-90 max-w-2xl">{creator.bio}</p>
            )}
          </div>

          <div className="p-10">
            <h2 className="text-2xl font-bold mb-8">このクリエイターの価格表</h2>

            {visiblePrices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                まだ十分な取引実績がありません
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
                        <span className="text-gray-500">価格帯（25〜75パーセンタイル）</span>
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
        </div>
      </div>
    </div>
  )
}

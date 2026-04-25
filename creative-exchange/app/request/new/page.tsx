'use client'

import { createClient } from '../../../lib/supabase/client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type MarketStatRow = {
  median_price: number | null
  avg_price: number | null
  p25_price: number | null
  p75_price: number | null
  transaction_count: number
  confidence_label: string
}

type DirectedCreator = {
  id: string
  display_name: string | null
  twitter_handle: string | null
  bio: string | null
}

export default function NewRequest() {
  return (
    <Suspense fallback={<div className="p-12 text-center">読み込み中...</div>}>
      <NewRequestContent />
    </Suspense>
  )
}

function NewRequestContent() {
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [marketStats, setMarketStats] = useState<MarketStatRow | null>(null)
  const [directedCreator, setDirectedCreator] = useState<DirectedCreator | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const creatorIdParam = searchParams.get('creator_id')

  useEffect(() => {
    const initializePage = async () => {
      const supabase = createClient()

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.replace('/login')
        return
      }

      const { data: categoryRows, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoryError) {
        console.error('カテゴリ取得エラー:', categoryError)
      } else {
        setCategories(categoryRows || [])
      }

      if (creatorIdParam) {
        const { data: creatorRow, error: creatorError } = await supabase
          .from('users')
          .select('id, display_name, twitter_handle, bio')
          .eq('id', creatorIdParam)
          .single()

        if (creatorError) {
          console.error('指名クリエイター取得エラー:', creatorError)
          alert('指名クリエイターの取得に失敗しました')
        } else if (creatorRow) {
          setDirectedCreator(creatorRow as DirectedCreator)

          const creatorName = creatorRow.display_name || 'クリエイター'
          setTitle(`${creatorName}への依頼`)
        }
      }

      setLoading(false)
    }

    initializePage()
  }, [router, creatorIdParam])

  useEffect(() => {
    const fetchMarketStats = async () => {
      if (!selectedCategory) {
        setMarketStats(null)
        return
      }

      const supabase = createClient()

      const { data, error } = await supabase.rpc('calculate_market_stats', {
        p_category_id: parseInt(selectedCategory, 10),
        p_days: 90,
      })

      if (error) {
        console.error('相場取得エラー:', error)
        setMarketStats(null)
        return
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

      setMarketStats(stats)
    }

    fetchMarketStats()
  }, [selectedCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCategory || !title.trim() || !description.trim()) {
      alert('必須項目を入力してください')
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('ログインしてください')

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (!profile) throw new Error('ユーザー情報が見つかりません')

      if (directedCreator && String(directedCreator.id) === String(profile.id)) {
        throw new Error('自分自身には依頼できません')
      }

      const orderStatus = directedCreator ? 'matched' : 'open'

      const { data: createdOrder, error } = await supabase
        .from('orders')
        .insert({
          client_id: profile.id,
          creator_id: directedCreator?.id || null,
          category_id: parseInt(selectedCategory, 10),
          title: title.trim(),
          description: description.trim(),
          agreed_price: budget ? parseInt(budget, 10) : 0,
          deadline: deadline || null,
          specification: {
            note: directedCreator ? '指名依頼' : '基本依頼',
            directed_creator_id: directedCreator?.id || null,
          },
          status: orderStatus,
        })
        .select('id')
        .single()

      if (error) throw error

      if (directedCreator?.id && createdOrder?.id) {
        await supabase.from('notifications').insert({
          user_id: directedCreator.id,
          type: 'direct_request',
          title: '新しい指名依頼があります',
          body: `「${title.trim()}」が届きました。`,
          link_url: `/request/${createdOrder.id}`,
        })
      }

      alert(directedCreator ? '指名依頼を作成しました！' : '依頼を作成しました！')
      router.push(createdOrder?.id ? `/request/${createdOrder.id}` : '/mypage')
    } catch (err: any) {
      alert('依頼作成に失敗しました: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-12 text-center">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={() => router.push('/mypage')}
          className="mb-6 text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          ← マイページに戻る
        </button>

        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-3xl font-bold mb-4">新しい依頼を作成</h1>

          {directedCreator && (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <p className="text-sm text-blue-600 font-medium mb-2">
                指名依頼
              </p>
              <p className="text-xl font-bold text-gray-900">
                {directedCreator.display_name || '名称未設定'}
              </p>
              <p className="text-sm text-gray-600">
                @{directedCreator.twitter_handle || 'no handle'}
              </p>
              {directedCreator.bio && (
                <p className="mt-3 text-sm text-gray-700 leading-6">
                  {directedCreator.bio}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                品目
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">品目を選択してください</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory && marketStats && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <p className="text-sm text-blue-600 font-medium mb-3">
                  この品目の相場（直近90日間）
                </p>

                {marketStats.transaction_count >= 5 ? (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">取引件数</p>
                      <p className="text-lg font-semibold">
                        {marketStats.transaction_count}件
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">中央値</p>
                      <p className="text-xl font-bold text-blue-600">
                        ¥{Math.round(marketStats.median_price ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">価格帯</p>
                      <p className="text-sm">
                        ¥{Math.round(marketStats.p25_price ?? 0).toLocaleString()} 〜
                        ¥{Math.round(marketStats.p75_price ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    データ不足です
                    <br />
                    5件以上の取引が蓄積されると表示されます
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                依頼タイトル
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：MV用のイラストをお願いします"
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                依頼内容
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="詳細な要望、参考画像の有無、納期希望などを書いてください"
                className="w-full h-40 p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 resize-y"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                希望納期
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              />
              <p className="mt-2 text-sm text-gray-500">
                取引後に双方が確認できる納期です。未入力でも作成できます。
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                希望予算（任意）
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="例：15000"
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-medium text-lg"
            >
              {submitting
                ? '依頼を作成中...'
                : directedCreator
                  ? 'このクリエイターに依頼する'
                  : 'この内容で依頼を作成する'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

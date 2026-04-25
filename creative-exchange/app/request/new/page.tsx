'use client'

import { createClient } from '../../../lib/supabase/client'
import { Suspense, useEffect, useMemo, useState } from 'react'
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

type CategoryOption = {
  id: number
  name: string
}

type RequestStepInput = {
  title: string
  description: string
  category_id: string
  budget: string
  deadline: string
}

const createEmptyStep = (index: number): RequestStepInput => ({
  title: index === 0 ? '制作工程' : '',
  description: '',
  category_id: '',
  budget: '',
  deadline: '',
})

export default function NewRequest() {
  return (
    <Suspense fallback={<div className="p-12 text-center">読み込み中...</div>}>
      <NewRequestContent />
    </Suspense>
  )
}

function NewRequestContent() {
  const [categories, setCategories] = useState<CategoryOption[]>([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<RequestStepInput[]>([createEmptyStep(0)])

  const [marketStats, setMarketStats] = useState<MarketStatRow | null>(null)
  const [directedCreator, setDirectedCreator] = useState<DirectedCreator | null>(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const creatorIdParam = searchParams.get('creator_id')

  const primaryCategoryId = steps[0]?.category_id || ''

  const isMultiStep = steps.length >= 2

  const totalBudget = useMemo(() => {
    return steps.reduce((sum, step) => {
      const value = Number(step.budget || 0)
      if (!Number.isFinite(value) || value < 0) return sum
      return sum + value
    }, 0)
  }, [steps])

  const latestDeadline = useMemo(() => {
    const deadlines = steps
      .map((step) => step.deadline)
      .filter(Boolean)
      .sort()

    if (deadlines.length === 0) return null
    return deadlines[deadlines.length - 1]
  }, [steps])

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
        .select('id, name')
        .order('name')

      if (categoryError) {
        console.error('カテゴリ取得エラー:', categoryError)
      } else {
        setCategories((categoryRows || []) as CategoryOption[])
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
      if (!primaryCategoryId) {
        setMarketStats(null)
        return
      }

      const supabase = createClient()

      const { data, error } = await supabase.rpc('calculate_market_stats', {
        p_category_id: parseInt(primaryCategoryId, 10),
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
  }, [primaryCategoryId])

  const updateStep = (
    index: number,
    field: keyof RequestStepInput,
    value: string
  ) => {
    setSteps((prev) =>
      prev.map((step, stepIndex) =>
        stepIndex === index
          ? {
              ...step,
              [field]: value,
            }
          : step
      )
    )
  }

  const addStep = () => {
    setSteps((prev) => {
      if (prev.length >= 10) {
        alert('工程は最大10個までです')
        return prev
      }

      return [...prev, createEmptyStep(prev.length)]
    })
  }

  const removeStep = (index: number) => {
    setSteps((prev) => {
      if (prev.length <= 1) {
        alert('工程は最低1つ必要です')
        return prev
      }

      return prev
        .filter((_, stepIndex) => stepIndex !== index)
        .map((step, stepIndex) => ({
          ...step,
          title:
            step.title.trim() ||
            (stepIndex === 0 ? '制作工程' : `工程${stepIndex + 1}`),
        }))
    })
  }

  const validateSteps = () => {
    if (steps.length < 1) {
      alert('工程は最低1つ必要です')
      return false
    }

    if (steps.length > 10) {
      alert('工程は最大10個までです')
      return false
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const label = `工程${i + 1}`

      if (!step.title.trim()) {
        alert(`${label}の工程タイトルを入力してください`)
        return false
      }

      if (!step.category_id) {
        alert(`${label}の必要カテゴリを選択してください`)
        return false
      }

      if (step.budget.trim() !== '') {
        const budgetValue = Number(step.budget)
        if (!Number.isFinite(budgetValue) || budgetValue < 0) {
          alert(`${label}の予算は0以上の数値で入力してください`)
          return false
        }
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim()) {
      alert('依頼タイトルと依頼内容を入力してください')
      return
    }

    if (!validateSteps()) return

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

      const normalizedSteps = steps.map((step, index) => {
        const budgetValue = step.budget ? Number(step.budget) : 0

        return {
          step_number: index + 1,
          title: step.title.trim(),
          description: step.description.trim() || null,
          required_category_id: parseInt(step.category_id, 10),
          budget: Number.isFinite(budgetValue) ? budgetValue : 0,
          deadline: step.deadline || null,
        }
      })

      const firstStep = normalizedSteps[0]

      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: profile.id,

          // 指名依頼の場合は親ordersにもcreator_idを持たせておく。
          // ただし工程管理では実態は order_steps.creator_id / status で管理する。
          creator_id: directedCreator?.id || null,

          category_id: firstStep.required_category_id,
          title: title.trim(),
          description: description.trim(),

          // 既存UIとの互換用。工程予算の合計を親にも保持する。
          agreed_price: totalBudget,

          // 既存UIとの互換用。工程納期のうち最も遅いものを親にも保持する。
          deadline: latestDeadline,

          specification: {
            note: directedCreator ? '指名依頼' : '基本依頼',
            directed_creator_id: directedCreator?.id || null,
            phase: 'D',
            workflow: 'order_steps',
          },

          // Phase D方針：orders.statusは公開中 / 完了 / キャンセルのみ。
          status: 'open',

          is_multi_step: normalizedSteps.length >= 2,
          total_steps: normalizedSteps.length,
        })
        .select('id')
        .single()

      if (orderError) throw orderError
      if (!createdOrder?.id) throw new Error('依頼作成に失敗しました')

      const stepRows = normalizedSteps.map((step) => {
        const isDirectedSingleStep =
          directedCreator?.id && normalizedSteps.length === 1

        return {
          order_id: createdOrder.id,
          step_number: step.step_number,
          title: step.title,
          description: step.description,
          required_category_id: step.required_category_id,
          budget: step.budget,
          deadline: step.deadline,

          // 指名依頼かつ単一工程の場合は、その工程を指名先に割り当てる。
          // 複数工程の場合は、工程ごとに別クリエイターが入り得るため open にする。
          creator_id: isDirectedSingleStep ? directedCreator.id : null,
          status: isDirectedSingleStep ? 'matched' : 'open',
        }
      })

      const { error: stepsError } = await supabase
        .from('order_steps')
        .insert(stepRows)

      if (stepsError) throw stepsError

      if (directedCreator?.id && createdOrder?.id) {
        await supabase.from('notifications').insert({
          user_id: directedCreator.id,
          type: 'direct_request',
          title: '新しい指名依頼があります',
          body: `「${title.trim()}」が届きました。`,
          link_url: `/request/${createdOrder.id}`,
        })
      }

      alert(
        isMultiStep
          ? '工程付き依頼を作成しました！'
          : directedCreator
            ? '指名依頼を作成しました！'
            : '依頼を作成しました！'
      )

      router.push(`/request/${createdOrder.id}`)
    } catch (err: any) {
      alert('依頼作成に失敗しました: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-12 text-center">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => router.push('/mypage')}
          className="mb-6 text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          ← マイページに戻る
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-3">新しい依頼を作成</h1>
            <p className="text-gray-500">
              依頼を単一工程、または複数工程に分けて作成できます。
            </p>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  依頼タイトル
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例：MV制作を一式お願いしたいです"
                  className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  依頼全体の説明
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="依頼全体の目的、雰囲気、参考URL、完成イメージなどを書いてください"
                  className="w-full h-40 p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y"
                  required
                />
              </div>
            </div>

            <div className="border-t pt-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">工程</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    1工程なら通常依頼、2工程以上なら工程管理依頼になります。
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {steps.length} / 10 工程
                  </span>
                  <button
                    type="button"
                    onClick={addStep}
                    disabled={steps.length >= 10}
                    className="px-5 py-3 rounded-2xl bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-medium transition"
                  >
                    工程を追加する
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-3xl p-6 bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <div className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-2">
                          工程 {index + 1}
                        </div>
                        <h3 className="text-xl font-bold">
                          {step.title.trim() || `工程${index + 1}`}
                        </h3>
                      </div>

                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition"
                        >
                          削除
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          工程タイトル
                        </label>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) =>
                            updateStep(index, 'title', e.target.value)
                          }
                          placeholder="例：作詞 / イラスト制作 / 動画編集"
                          className="w-full p-4 border border-gray-300 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          工程説明
                        </label>
                        <textarea
                          value={step.description}
                          onChange={(e) =>
                            updateStep(index, 'description', e.target.value)
                          }
                          placeholder="この工程でお願いしたい内容を書いてください"
                          rows={4}
                          className="w-full p-4 border border-gray-300 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          必要カテゴリ
                        </label>
                        <select
                          value={step.category_id}
                          onChange={(e) =>
                            updateStep(index, 'category_id', e.target.value)
                          }
                          className="w-full p-4 border border-gray-300 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          工程予算
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={step.budget}
                          onChange={(e) =>
                            updateStep(index, 'budget', e.target.value)
                          }
                          placeholder="例：15000"
                          className="w-full p-4 border border-gray-300 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          工程納期
                        </label>
                        <input
                          type="date"
                          value={step.deadline}
                          onChange={(e) =>
                            updateStep(index, 'deadline', e.target.value)
                          }
                          className="w-full p-4 border border-gray-300 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>

                    {index === 0 && marketStats && step.category_id && (
                      <div className="mt-5 bg-blue-50 border border-blue-200 rounded-2xl p-5">
                        <p className="text-sm text-blue-600 font-medium mb-3">
                          工程1の品目相場（直近90日間）
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
                                ¥
                                {Math.round(
                                  marketStats.median_price ?? 0
                                ).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">価格帯</p>
                              <p className="text-sm">
                                ¥
                                {Math.round(
                                  marketStats.p25_price ?? 0
                                ).toLocaleString()}
                                〜 ¥
                                {Math.round(
                                  marketStats.p75_price ?? 0
                                ).toLocaleString()}
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
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-8">
              <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6">
                <h2 className="text-xl font-bold mb-4">作成内容の確認</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">依頼形式</p>
                    <p className="font-bold">
                      {isMultiStep ? '工程管理依頼' : '単一工程依頼'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-1">工程数</p>
                    <p className="font-bold">{steps.length}工程</p>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-1">合計予算</p>
                    <p className="font-bold text-blue-600">
                      ¥{totalBudget.toLocaleString()}
                    </p>
                  </div>
                </div>

                {latestDeadline && (
                  <div className="mt-4 text-sm">
                    <p className="text-gray-500 mb-1">最終納期</p>
                    <p className="font-bold">{latestDeadline}</p>
                  </div>
                )}

                {directedCreator && isMultiStep && (
                  <div className="mt-5 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-sm text-yellow-800 leading-7">
                    複数工程の指名依頼では、親依頼には指名先を記録しますが、
                    各工程は募集中として作成されます。工程ごとの担当者は次のフェーズで個別に受注できます。
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-5 rounded-2xl font-medium text-lg shadow-sm"
            >
              {submitting
                ? '依頼を作成中...'
                : isMultiStep
                  ? '工程付き依頼を作成する'
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

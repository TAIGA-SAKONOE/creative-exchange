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

type CreatorOption = {
  id: string
  display_name: string | null
  twitter_handle: string | null
  bio: string | null
}

type CategoryOption = {
  id: number
  name: string
  parent_category: string | null
  sort_order: number | null
}

type CategoryGroup = {
  parentCategory: string
  items: CategoryOption[]
}

type RequestType = 'public' | 'named'

type RequestStepInput = {
  title: string
  description: string
  category_id: string
  budget: string
  deadline: string
  parallel_group: string
  named_creator: CreatorOption | null
  creator_search: string
  creator_candidates: CreatorOption[]
  creator_searching: boolean
  creator_dropdown_open: boolean
}

const createEmptyStep = (index: number): RequestStepInput => ({
  title: index === 0 ? '制作工程' : '',
  description: '',
  category_id: '',
  budget: '',
  deadline: '',
  parallel_group: '',
  named_creator: null,
  creator_search: '',
  creator_candidates: [],
  creator_searching: false,
  creator_dropdown_open: false,
})

const groupCategoriesByParent = (categories: CategoryOption[]): CategoryGroup[] => {
  const grouped = new Map<string, CategoryOption[]>()

  categories.forEach((category) => {
    const parent = category.parent_category || 'その他'

    if (!grouped.has(parent)) {
      grouped.set(parent, [])
    }

    grouped.get(parent)!.push(category)
  })

  return Array.from(grouped.entries()).map(([parentCategory, items]) => ({
    parentCategory,
    items: items.sort((a, b) => a.name.localeCompare(b.name, 'ja')),
  }))
}

export default function NewRequest() {
  return (
    <Suspense fallback={<div className="p-12 text-center">読み込み中...</div>}>
      <NewRequestContent />
    </Suspense>
  )
}

function NewRequestContent() {
  const [categories, setCategories] = useState<CategoryOption[]>([])

  const [requestType, setRequestType] = useState<RequestType>('public')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<RequestStepInput[]>([createEmptyStep(0)])

  const [stepMarketStats, setStepMarketStats] = useState<
    Record<number, MarketStatRow | null>
  >({})

  const [initialNamedCreator, setInitialNamedCreator] =
    useState<CreatorOption | null>(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  const creatorIdParam = searchParams.get('creator_id')
  const typeParam = searchParams.get('type')

  const isNamedRequest = requestType === 'named'
  const isMultiStep = steps.length >= 2

  const today = useMemo(() => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }, [])

  const groupedCategories = useMemo(() => {
    return groupCategoriesByParent(categories)
  }, [categories])

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
        .select('id, name, parent_category, sort_order')
        .order('sort_order', { ascending: true })
        .order('parent_category', { ascending: true })
        .order('name', { ascending: true })

      if (categoryError) {
        console.error('カテゴリ取得エラー:', categoryError)
      } else {
        setCategories((categoryRows || []) as CategoryOption[])
      }

      if (typeParam === 'named') {
        setRequestType('named')
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
          const creator = creatorRow as CreatorOption
          setInitialNamedCreator(creator)
          setRequestType('named')

          const creatorName = creator.display_name || 'クリエイター'
          setTitle(`${creatorName}への依頼`)

          setSteps((prev) =>
            prev.map((step, index) =>
              index === 0
                ? {
                    ...step,
                    named_creator: creator,
                    creator_search:
                      creator.display_name ||
                      creator.twitter_handle ||
                      '名称未設定',
                  }
                : step
            )
          )
        }
      }

      setLoading(false)
    }

    initializePage()
  }, [router, creatorIdParam, typeParam])

  useEffect(() => {
    const fetchStepMarketStats = async () => {
      const supabase = createClient()
      const nextStats: Record<number, MarketStatRow | null> = {}

      await Promise.all(
        steps.map(async (step, index) => {
          if (!step.category_id) {
            nextStats[index] = null
            return
          }

          const { data, error } = await supabase.rpc('calculate_market_stats', {
            p_category_id: parseInt(step.category_id, 10),
            p_days: 90,
          })

          if (error) {
            console.error(`工程${index + 1}の相場取得エラー:`, error)
            nextStats[index] = null
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

          nextStats[index] = stats
        })
      )

      setStepMarketStats(nextStats)
    }

    fetchStepMarketStats()
  }, [steps])

  const updateStep = (
    index: number,
    field: keyof RequestStepInput,
    value: string | boolean | CreatorOption | CreatorOption[] | null
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

  const searchCreatorsForStep = async (index: number, keyword: string) => {
    updateStep(index, 'creator_search', keyword)
    updateStep(index, 'named_creator', null)
    updateStep(index, 'creator_dropdown_open', true)

    const trimmed = keyword.trim()

    if (!trimmed) {
      updateStep(index, 'creator_candidates', [])
      updateStep(index, 'creator_searching', false)
      return
    }

    updateStep(index, 'creator_searching', true)

    const supabase = createClient()

    const { data, error } = await supabase
      .from('users')
      .select('id, display_name, twitter_handle, bio')
      .or(`display_name.ilike.%${trimmed}%,twitter_handle.ilike.%${trimmed}%`)
      .limit(10)

    if (error) {
      console.error('クリエイター検索エラー:', error)
      updateStep(index, 'creator_candidates', [])
      updateStep(index, 'creator_searching', false)
      return
    }

    updateStep(index, 'creator_candidates', (data || []) as CreatorOption[])
    updateStep(index, 'creator_searching', false)
  }

  const selectCreatorForStep = (index: number, creator: CreatorOption) => {
    updateStep(index, 'named_creator', creator)
    updateStep(
      index,
      'creator_search',
      creator.display_name || creator.twitter_handle || '名称未設定'
    )
    updateStep(index, 'creator_candidates', [])
    updateStep(index, 'creator_dropdown_open', false)
  }

  const clearCreatorForStep = (index: number) => {
    updateStep(index, 'named_creator', null)
    updateStep(index, 'creator_search', '')
    updateStep(index, 'creator_candidates', [])
    updateStep(index, 'creator_dropdown_open', false)
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

      if (step.deadline && step.deadline < today) {
        alert(`${label}の納期には今日以降の日付を選択してください`)
        return false
      }

      if (step.parallel_group.trim() !== '') {
        const groupValue = Number(step.parallel_group)
        if (
          !Number.isInteger(groupValue) ||
          groupValue < 1 ||
          groupValue > 5
        ) {
          alert(`${label}の並行グループは1〜5の範囲で選択してください`)
          return false
        }
      }

      if (isNamedRequest && !step.named_creator?.id) {
        alert(`${label}の指名クリエイターを選択してください`)
        return false
      }
    }

    return true
  }

  const notifyNamedCreators = async ({
    orderId,
    orderTitle,
    selectedSteps,
  }: {
    orderId: string
    orderTitle: string
    selectedSteps: Array<{
      step_number: number
      title: string
      creator_id: string | null
    }>
  }) => {
    const supabase = createClient()

    const notifications = selectedSteps
      .filter((step) => step.creator_id)
      .map((step) => ({
        user_id: step.creator_id,
        type: 'direct_request',
        title: '新しい指名依頼があります',
        body: `「${orderTitle}」の工程「${step.title}」に指名されました。`,
        link_url: `/request/${orderId}`,
      }))

    if (notifications.length === 0) return

    const { error } = await supabase.from('notifications').insert(notifications)

    if (error) {
      console.error('指名依頼通知エラー:', error)
    }
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

      const selfAssignedStep = steps.find(
        (step) =>
          step.named_creator?.id &&
          String(step.named_creator.id) === String(profile.id)
      )

      if (selfAssignedStep) {
        throw new Error('自分自身には依頼できません')
      }

      const normalizedSteps = steps.map((step, index) => {
        const budgetValue = step.budget ? Number(step.budget) : 0
        const parallelGroupValue = step.parallel_group
          ? Number(step.parallel_group)
          : null

        return {
          step_number: index + 1,
          title: step.title.trim(),
          description: step.description.trim() || null,
          required_category_id: parseInt(step.category_id, 10),
          budget: Number.isFinite(budgetValue) ? budgetValue : 0,
          deadline: step.deadline || null,
          parallel_group:
            parallelGroupValue !== null && Number.isFinite(parallelGroupValue)
              ? parallelGroupValue
              : null,
          creator_id: isNamedRequest ? step.named_creator?.id || null : null,
          status: isNamedRequest ? 'matched' : 'open',
        }
      })

      const firstStep = normalizedSteps[0]
      const firstNamedCreatorId =
        isNamedRequest && normalizedSteps.length > 0
          ? normalizedSteps.find((step) => step.creator_id)?.creator_id || null
          : null

      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: profile.id,
          creator_id: firstNamedCreatorId,
          category_id: firstStep.required_category_id,
          title: title.trim(),
          description: description.trim(),
          agreed_price: totalBudget,
          deadline: latestDeadline,
          specification: {
            note: isNamedRequest ? '指名依頼' : '公開依頼',
            request_type: requestType,
            initial_named_creator_id: initialNamedCreator?.id || null,
            phase: 'G-2',
            workflow: 'order_steps',
          },
          status: 'open',
          is_named: isNamedRequest,
          is_multi_step: normalizedSteps.length >= 2,
          total_steps: normalizedSteps.length,
        })
        .select('id')
        .single()

      if (orderError) throw orderError
      if (!createdOrder?.id) throw new Error('依頼作成に失敗しました')

      const stepRows = normalizedSteps.map((step) => ({
        order_id: createdOrder.id,
        step_number: step.step_number,
        title: step.title,
        description: step.description,
        required_category_id: step.required_category_id,
        budget: step.budget,
        deadline: step.deadline,
        parallel_group: step.parallel_group,
        creator_id: step.creator_id,
        status: step.status,
      }))

      const { error: stepsError } = await supabase
        .from('order_steps')
        .insert(stepRows)

      if (stepsError) throw stepsError

      if (isNamedRequest) {
        await notifyNamedCreators({
          orderId: createdOrder.id,
          orderTitle: title.trim(),
          selectedSteps: normalizedSteps,
        })
      }

      alert(
        isNamedRequest
          ? '指名依頼を作成しました！'
          : isMultiStep
            ? '工程付き公開依頼を作成しました！'
            : '公開依頼を作成しました！'
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
              公開依頼、または工程ごとの指名依頼として作成できます。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  依頼タイプ
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRequestType('public')}
                    className={`text-left rounded-2xl border p-5 transition ${
                      requestType === 'public'
                        ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          requestType === 'public'
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {requestType === 'public' && (
                          <span className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </span>
                      <span className="font-bold">公開依頼</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-6">
                      Exchangeに公開し、受注希望者を募ります。
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestType('named')}
                    className={`text-left rounded-2xl border p-5 transition ${
                      requestType === 'named'
                        ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          requestType === 'named'
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {requestType === 'named' && (
                          <span className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </span>
                      <span className="font-bold">指名依頼</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-6">
                      工程ごとにクリエイターを指名し、即マッチングします。
                    </p>
                  </button>
                </div>

                {isNamedRequest && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800 leading-7">
                    指名依頼は、選択したクリエイターへ即時に工程が割り当てられます。
                    公開募集には表示されません。
                  </div>
                )}
              </div>

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
                          {groupedCategories.map((group) => (
                            <optgroup
                              key={group.parentCategory}
                              label={group.parentCategory}
                            >
                              {group.items.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </optgroup>
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
                          min={today}
                          onChange={(e) =>
                            updateStep(index, 'deadline', e.target.value)
                          }
                          className="w-full p-4 border border-gray-300 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          並行グループ
                        </label>
                        <select
                          value={step.parallel_group}
                          onChange={(e) =>
                            updateStep(index, 'parallel_group', e.target.value)
                          }
                          className="w-full p-4 border border-gray-300 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="">未設定（通常工程）</option>
                          <option value="1">グループ1</option>
                          <option value="2">グループ2</option>
                          <option value="3">グループ3</option>
                          <option value="4">グループ4</option>
                          <option value="5">グループ5</option>
                        </select>
                        <p className="mt-2 text-xs text-gray-500 leading-5">
                          同じ番号の工程は、同時並行で進められる工程として表示します。
                        </p>
                      </div>

                      {isNamedRequest && (
                        <div className="md:col-span-2 relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            指名するクリエイター
                          </label>

                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={step.creator_search}
                              onFocus={() =>
                                updateStep(index, 'creator_dropdown_open', true)
                              }
                              onChange={(e) =>
                                searchCreatorsForStep(index, e.target.value)
                              }
                              placeholder="表示名またはX IDで検索"
                              className="flex-1 p-4 border border-gray-300 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />

                            {step.named_creator && (
                              <button
                                type="button"
                                onClick={() => clearCreatorForStep(index)}
                                className="px-4 py-2 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium"
                              >
                                解除
                              </button>
                            )}
                          </div>

                          {step.named_creator && (
                            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                              <p className="text-sm text-blue-600 font-medium mb-1">
                                指名中
                              </p>
                              <p className="font-bold">
                                {step.named_creator.display_name || '名称未設定'}
                              </p>
                              <p className="text-sm text-gray-600">
                                @{step.named_creator.twitter_handle || 'no handle'}
                              </p>
                            </div>
                          )}

                          {step.creator_dropdown_open &&
                            !step.named_creator &&
                            step.creator_search.trim() && (
                              <div className="absolute left-0 right-0 top-full mt-2 z-20 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                                {step.creator_searching ? (
                                  <div className="p-4 text-sm text-gray-500">
                                    検索中...
                                  </div>
                                ) : step.creator_candidates.length > 0 ? (
                                  <div className="max-h-72 overflow-y-auto">
                                    {step.creator_candidates.map((creator) => (
                                      <button
                                        key={creator.id}
                                        type="button"
                                        onClick={() =>
                                          selectCreatorForStep(index, creator)
                                        }
                                        className="w-full text-left p-4 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                      >
                                        <p className="font-bold">
                                          {creator.display_name || '名称未設定'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          @{creator.twitter_handle || 'no handle'}
                                        </p>
                                        {creator.bio && (
                                          <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                                            {creator.bio}
                                          </p>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-4 text-sm text-gray-500">
                                    該当するクリエイターがいません
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      )}
                    </div>

                    {step.category_id &&
                      stepMarketStats[index] &&
                      (() => {
                        const stats = stepMarketStats[index]
                        if (!stats) return null

                        return (
                          <div className="mt-5 bg-blue-50 border border-blue-200 rounded-2xl p-5">
                            <p className="text-sm text-blue-600 font-medium mb-3">
                              工程{index + 1}の品目相場（直近90日間）
                            </p>

                            {stats.transaction_count >= 5 ? (
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <p className="text-xs text-gray-500">取引件数</p>
                                  <p className="text-lg font-semibold">
                                    {stats.transaction_count}件
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs text-gray-500">中央値</p>
                                  <p className="text-xl font-bold text-blue-600">
                                    ¥
                                    {Math.round(
                                      stats.median_price ?? 0
                                    ).toLocaleString()}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs text-gray-500">価格帯</p>
                                  <p className="text-sm">
                                    ¥
                                    {Math.round(
                                      stats.p25_price ?? 0
                                    ).toLocaleString()}
                                    〜 ¥
                                    {Math.round(
                                      stats.p75_price ?? 0
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
                        )
                      })()}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-8">
              <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6">
                <h2 className="text-xl font-bold mb-4">作成内容の確認</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">依頼タイプ</p>
                    <p className="font-bold">
                      {isNamedRequest ? '指名依頼' : '公開依頼'}
                    </p>
                  </div>

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

                {steps.some((step) => step.parallel_group) && (
                  <div className="mt-5 p-4 bg-purple-50 border border-purple-200 rounded-2xl text-sm text-purple-800 leading-7">
                    並行グループが設定されています。同じグループ番号の工程は、
                    依頼詳細画面で並行可能な工程としてまとめて表示されます。
                  </div>
                )}

                {isNamedRequest && (
                  <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-800 leading-7">
                    指名依頼として作成されます。各工程は選択したクリエイターに即時割り当てられ、
                    工程ステータスは「制作中」として保存されます。
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
                : isNamedRequest
                  ? '指名依頼を作成する'
                  : isMultiStep
                    ? '工程付き公開依頼を作成する'
                    : '公開依頼を作成する'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

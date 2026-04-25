'use client'

import { createClient } from '../../lib/supabase/client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import LoadingState from '../components/LoadingState'
import MessageState from '../components/MessageState'

type ConfidenceColor = 'gray' | 'yellow' | 'green'

type CategoryRow = {
  id: number
  name: string
  parent_category: string | null
  sort_order: number | null
}

type SupplyDemand = {
  open_steps: number
  creator_count: number
  ratio: number | null
  label: string
  color: 'gray' | 'red' | 'green' | 'blue'
}

type PriceStatsBase = {
  median_price: number
  avg_price: number
  min_price: number
  max_price: number
  p25_price: number
  p75_price: number
  transaction_count: number
  confidence_label: string
  confidence_color: ConfidenceColor
}

type SmallCategoryStats = PriceStatsBase & {
  card_type: 'individual'
  category_id: number
  category_name: string
  parent_category: string
  supply_demand: SupplyDemand
}

type ParentCategoryStats = PriceStatsBase & {
  card_type: 'parent_fallback'
  parent_category: string
  supply_demand: SupplyDemand
}

type EmptyParentCategoryCard = {
  card_type: 'empty_parent'
  parent_category: string
  sort_order: number
}

type RequestMarketCard =
  | SmallCategoryStats
  | ParentCategoryStats
  | EmptyParentCategoryCard

type ProductSmallCategoryStats = PriceStatsBase & {
  card_type: 'individual'
  category_id: number
  category_name: string
  parent_category: string
}

type ProductParentCategoryStats = PriceStatsBase & {
  card_type: 'parent_fallback'
  parent_category: string
}

type ProductEmptyParentCategoryCard = {
  card_type: 'empty_parent'
  parent_category: string
  sort_order: number
}

type ProductMarketCard =
  | ProductSmallCategoryStats
  | ProductParentCategoryStats
  | ProductEmptyParentCategoryCard

type PricePoint = {
  category_id: number
  price: number
}

const DAYS = 90

export default function MarketPage() {
  return (
    <Suspense fallback={<LoadingState message="相場データを読み込み中..." />}>
      <MarketPageContent />
    </Suspense>
  )
}

function MarketPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialTab =
    searchParams.get('tab') === 'product' ? 'products' : 'requests'

  const [activeTab, setActiveTab] = useState<'requests' | 'products'>(initialTab)
  const [requestMarketData, setRequestMarketData] = useState<RequestMarketCard[]>([])
  const [productMarketData, setProductMarketData] = useState<ProductMarketCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const tabParam = searchParams.get('tab')

    if (tabParam === 'product') {
      setActiveTab('products')
    } else {
      setActiveTab('requests')
    }
  }, [searchParams])

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()

        const since = new Date()
        since.setDate(since.getDate() - DAYS)

        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name, parent_category, sort_order')
          .order('sort_order', { ascending: true })
          .order('parent_category', { ascending: true })
          .order('name', { ascending: true })

        if (categoriesError) throw categoriesError

        const categories = ((categoriesData || []) as CategoryRow[]).map((category) => ({
          ...category,
          parent_category: category.parent_category || 'その他',
          sort_order: category.sort_order ?? 99,
        }))

        const categoryById = new Map<number, CategoryRow>()
        categories.forEach((category) => {
          categoryById.set(category.id, category)
        })

        const parentSortOrder = new Map<string, number>()

        categories.forEach((category) => {
          const parent = category.parent_category || 'その他'
          const sortOrder = category.sort_order ?? 99

          if (!parentSortOrder.has(parent)) {
            parentSortOrder.set(parent, sortOrder)
          } else {
            parentSortOrder.set(
              parent,
              Math.min(parentSortOrder.get(parent) ?? 99, sortOrder)
            )
          }
        })

        const parentCategories = Array.from(parentSortOrder.entries())
          .map(([parent_category, sort_order]) => ({
            parent_category,
            sort_order,
          }))
          .sort((a, b) => {
            if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
            return a.parent_category.localeCompare(b.parent_category, 'ja')
          })

        const [
          stepResult,
          orderResult,
          openStepsResult,
          creatorCategoriesResult,
          productPurchaseResult,
        ] = await Promise.all([
          supabase
            .from('order_steps')
            .select('required_category_id, budget, status, updated_at')
            .eq('status', 'completed')
            .gt('budget', 0)
            .gte('updated_at', since.toISOString()),

          supabase
            .from('orders')
            .select('id, category_id, agreed_price, status, is_multi_step, updated_at')
            .eq('status', 'completed')
            .eq('is_multi_step', false)
            .gt('agreed_price', 0)
            .gte('updated_at', since.toISOString()),

          supabase
            .from('order_steps')
            .select('required_category_id')
            .eq('status', 'open'),

          supabase
            .from('user_categories')
            .select('category_id'),

          // 注意：
          // product_purchases には created_at カラムが存在しないため、
          // 作品相場は現時点では全件ベースで集計する。
          // 日付カラムを追加・確認できたら、後で直近90日フィルターを復活させる。
          supabase
            .from('product_purchases')
            .select('category_id, price')
            .gt('price', 0),
        ])

        if (stepResult.error) throw stepResult.error
        if (orderResult.error) throw orderResult.error
        if (openStepsResult.error) throw openStepsResult.error
        if (creatorCategoriesResult.error) throw creatorCategoriesResult.error
        if (productPurchaseResult.error) throw productPurchaseResult.error

        const requestPricePoints: PricePoint[] = []

        ;(stepResult.data || []).forEach((row: any) => {
          const categoryId = Number(row.required_category_id)
          const price = Number(row.budget)

          if (
            Number.isFinite(categoryId) &&
            Number.isFinite(price) &&
            price > 0 &&
            categoryById.has(categoryId)
          ) {
            requestPricePoints.push({
              category_id: categoryId,
              price,
            })
          }
        })

        // 旧単一依頼の補完。
        // is_multi_step = false の completed orders のみを入れるため、
        // Phase D以降の工程付き依頼とは二重計上しない。
        ;(orderResult.data || []).forEach((row: any) => {
          const categoryId = Number(row.category_id)
          const price = Number(row.agreed_price)

          if (
            Number.isFinite(categoryId) &&
            Number.isFinite(price) &&
            price > 0 &&
            categoryById.has(categoryId)
          ) {
            requestPricePoints.push({
              category_id: categoryId,
              price,
            })
          }
        })

        const productPricePoints: PricePoint[] = []

        ;(productPurchaseResult.data || []).forEach((row: any) => {
          const categoryId = Number(row.category_id)
          const price = Number(row.price)

          if (
            Number.isFinite(categoryId) &&
            Number.isFinite(price) &&
            price > 0 &&
            categoryById.has(categoryId)
          ) {
            productPricePoints.push({
              category_id: categoryId,
              price,
            })
          }
        })

        const openStepCountByCategory = countByCategory(
          (openStepsResult.data || []).map((row: any) => Number(row.required_category_id))
        )

        const creatorCountByCategory = countByCategory(
          (creatorCategoriesResult.data || []).map((row: any) => Number(row.category_id))
        )

        const requestCards = buildRequestMarketCards({
          categories,
          parentCategories,
          pricePoints: requestPricePoints,
          openStepCountByCategory,
          creatorCountByCategory,
        })

        const productCards = buildProductMarketCards({
          categories,
          parentCategories,
          pricePoints: productPricePoints,
        })

        setRequestMarketData(requestCards)
        setProductMarketData(productCards)
      } catch (err: any) {
        console.error('market fetch error', err)
        setError(err.message || '相場データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchMarketData()
  }, [])

  const handleTabChange = (nextTab: 'requests' | 'products') => {
    setActiveTab(nextTab)

    if (nextTab === 'requests') {
      router.replace('/market?tab=commission')
    } else {
      router.replace('/market?tab=product')
    }
  }

  const currentData = useMemo(() => {
    return activeTab === 'requests' ? requestMarketData : productMarketData
  }, [activeTab, requestMarketData, productMarketData])

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
            受託相場と作品相場の両方を確認できます
          </p>
          <p className="text-sm text-gray-400 mt-2">
            受託相場は直近{DAYS}日間の完了工程・旧単一依頼をもとに算出しています。
            作品相場は現在、販売履歴全件をもとに算出しています。
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-3 mb-8">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleTabChange('requests')}
              className={`px-5 py-3 rounded-2xl font-medium transition ${
                activeTab === 'requests'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              受託相場
            </button>

            <button
              onClick={() => handleTabChange('products')}
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

        {currentData.length === 0 ? (
          <div className="bg-white rounded-3xl shadow p-12 text-center text-gray-500">
            表示できる相場データがありません。
          </div>
        ) : activeTab === 'requests' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(currentData as RequestMarketCard[]).map((item) => (
              <RequestMarketCardView key={getRequestCardKey(item)} item={item} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(currentData as ProductMarketCard[]).map((item) => (
              <ProductMarketCardView key={getProductCardKey(item)} item={item} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center text-sm text-gray-500">
          ※ 相場は実際の
          {activeTab === 'requests' ? '完了工程・旧単一依頼' : '販売'}
          データに基づいています。
        </div>
      </div>
    </div>
  )
}

function RequestMarketCardView({ item }: { item: RequestMarketCard }) {
  if (item.card_type === 'empty_parent') {
    return (
      <div className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition border border-gray-100">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">大品目</p>
            <h2 className="font-bold text-xl">{item.parent_category}</h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            データ待ち
          </span>
        </div>

        <div className="py-10 text-center text-gray-500 bg-gray-50 rounded-2xl">
          まだ取引データがありません
          <br />
          完了取引が蓄積されると相場が表示されます
        </div>

        <Link href="/request/new">
          <button className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-medium">
            この領域で依頼を作成
          </button>
        </Link>
      </div>
    )
  }

  const isIndividual = item.card_type === 'individual'

  return (
    <div className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition border border-gray-100">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-xs text-gray-400 mb-1">
            {isIndividual ? item.parent_category : '大品目参考相場'}
          </p>
          <h2 className="font-bold text-xl">
            {isIndividual ? item.category_name : item.parent_category}
          </h2>
          {!isIndividual && (
            <p className="text-sm text-gray-500 mt-1">データ蓄積中の参考値です</p>
          )}
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isIndividual
              ? 'bg-blue-50 text-blue-700 border border-blue-100'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}
        >
          {isIndividual ? '個別相場' : '参考相場'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <ConfidenceBadge
          label={item.confidence_label}
          color={item.confidence_color}
        />
        <SupplyDemandBadge supplyDemand={item.supply_demand} />
      </div>

      <PriceStatsBlock stats={item} countLabel="取引件数" />

      <div className="mt-5 rounded-2xl bg-gray-50 border border-gray-100 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">募集中工程</span>
          <span className="font-semibold">{item.supply_demand.open_steps}件</span>
        </div>
        <div className="flex justify-between gap-4 mt-2">
          <span className="text-gray-500">対応クリエイター</span>
          <span className="font-semibold">
            {item.supply_demand.creator_count}人
          </span>
        </div>
        <div className="flex justify-between gap-4 mt-2">
          <span className="text-gray-500">需給比率</span>
          <span className="font-semibold">
            {item.supply_demand.ratio === null
              ? '-'
              : item.supply_demand.ratio.toFixed(2)}
          </span>
        </div>
      </div>

      <Link
        href={
          isIndividual
            ? `/request/new?category=${item.category_id}`
            : '/request/new'
        }
      >
        <button className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-medium">
          {isIndividual ? 'この品目で依頼を作成' : 'この領域で依頼を作成'}
        </button>
      </Link>
    </div>
  )
}

function ProductMarketCardView({ item }: { item: ProductMarketCard }) {
  if (item.card_type === 'empty_parent') {
    return (
      <div className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition border border-gray-100">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">大品目</p>
            <h2 className="font-bold text-xl">{item.parent_category}</h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            データ待ち
          </span>
        </div>

        <div className="py-10 text-center text-gray-500 bg-gray-50 rounded-2xl">
          まだ販売データがありません
          <br />
          作品販売が蓄積されると相場が表示されます
        </div>

        <Link href="/listing/new">
          <button className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-medium">
            この領域で作品を出品する
          </button>
        </Link>
      </div>
    )
  }

  const isIndividual = item.card_type === 'individual'

  return (
    <div className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition border border-gray-100">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-xs text-gray-400 mb-1">
            {isIndividual ? item.parent_category : '大品目参考相場'}
          </p>
          <h2 className="font-bold text-xl">
            {isIndividual ? item.category_name : item.parent_category}
          </h2>
          {!isIndividual && (
            <p className="text-sm text-gray-500 mt-1">データ蓄積中の参考値です</p>
          )}
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isIndividual
              ? 'bg-blue-50 text-blue-700 border border-blue-100'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}
        >
          {isIndividual ? '個別相場' : '参考相場'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <ConfidenceBadge
          label={item.confidence_label}
          color={item.confidence_color}
        />
      </div>

      <PriceStatsBlock stats={item} countLabel="販売件数" />

      <Link href="/listing/new">
        <button className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-medium">
          この領域で作品を出品する
        </button>
      </Link>
    </div>
  )
}

function PriceStatsBlock({
  stats,
  countLabel,
}: {
  stats: PriceStatsBase
  countLabel: string
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-500">中央値</p>
        <p className="text-3xl font-bold text-blue-600">
          ¥{Math.round(stats.median_price).toLocaleString()}
        </p>
      </div>

      <div className="text-sm">
        <p className="text-gray-500">平均価格</p>
        <p className="font-semibold">
          ¥{Math.round(stats.avg_price).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 rounded-2xl p-3">
          <p className="text-gray-500">下位25%</p>
          <p className="font-semibold">
            ¥{Math.round(stats.p25_price).toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-3">
          <p className="text-gray-500">上位25%</p>
          <p className="font-semibold">
            ¥{Math.round(stats.p75_price).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">最安</p>
          <p>¥{Math.round(stats.min_price).toLocaleString()}</p>
        </div>

        <div>
          <p className="text-gray-500">最高</p>
          <p>¥{Math.round(stats.max_price).toLocaleString()}</p>
        </div>
      </div>

      <div className="text-sm">
        <p className="text-gray-500">{countLabel}</p>
        <p className="text-2xl font-semibold">{stats.transaction_count}件</p>
      </div>
    </div>
  )
}

function ConfidenceBadge({
  label,
  color,
}: {
  label: string
  color: ConfidenceColor
}) {
  const className =
    color === 'green'
      ? 'bg-green-50 text-green-700 border-green-100'
      : color === 'yellow'
        ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
        : 'bg-gray-100 text-gray-600 border-gray-200'

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  )
}

function SupplyDemandBadge({ supplyDemand }: { supplyDemand: SupplyDemand }) {
  const className =
    supplyDemand.color === 'red'
      ? 'bg-red-50 text-red-700 border-red-100'
      : supplyDemand.color === 'green'
        ? 'bg-green-50 text-green-700 border-green-100'
        : supplyDemand.color === 'blue'
          ? 'bg-blue-50 text-blue-700 border-blue-100'
          : 'bg-gray-100 text-gray-600 border-gray-200'

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${className}`}>
      {supplyDemand.label}
    </span>
  )
}

function countByCategory(categoryIds: number[]) {
  const map = new Map<number, number>()

  categoryIds.forEach((categoryId) => {
    if (!Number.isFinite(categoryId)) return
    map.set(categoryId, (map.get(categoryId) || 0) + 1)
  })

  return map
}

function buildRequestMarketCards({
  categories,
  parentCategories,
  pricePoints,
  openStepCountByCategory,
  creatorCountByCategory,
}: {
  categories: CategoryRow[]
  parentCategories: { parent_category: string; sort_order: number }[]
  pricePoints: PricePoint[]
  openStepCountByCategory: Map<number, number>
  creatorCountByCategory: Map<number, number>
}): RequestMarketCard[] {
  const categoryById = new Map<number, CategoryRow>()
  categories.forEach((category) => categoryById.set(category.id, category))

  const pricesByCategory = groupPricesByCategory(pricePoints)
  const pricesByParent = groupPricesByParent(pricePoints, categoryById)

  const individualCards: SmallCategoryStats[] = []
  const parentFallbackCards: ParentCategoryStats[] = []
  const emptyParentCards: EmptyParentCategoryCard[] = []

  const parentHasIndividual = new Set<string>()

  categories.forEach((category) => {
    const parent = category.parent_category || 'その他'
    const prices = pricesByCategory.get(category.id) || []

    if (prices.length >= 5) {
      parentHasIndividual.add(parent)

      individualCards.push({
        card_type: 'individual',
        category_id: category.id,
        category_name: category.name,
        parent_category: parent,
        ...calculatePriceStats(prices),
        supply_demand: calculateCategorySupplyDemand({
          categoryIds: [category.id],
          openStepCountByCategory,
          creatorCountByCategory,
        }),
      })
    }
  })

  parentCategories.forEach((parent) => {
    const prices = pricesByParent.get(parent.parent_category) || []

    if (prices.length >= 1) {
      const shouldShowParentFallback = categories.some((category) => {
        const categoryParent = category.parent_category || 'その他'
        if (categoryParent !== parent.parent_category) return false

        const categoryPrices = pricesByCategory.get(category.id) || []
        return categoryPrices.length < 5
      })

      if (shouldShowParentFallback || !parentHasIndividual.has(parent.parent_category)) {
        const categoryIds = categories
          .filter((category) => (category.parent_category || 'その他') === parent.parent_category)
          .map((category) => category.id)

        parentFallbackCards.push({
          card_type: 'parent_fallback',
          parent_category: parent.parent_category,
          ...calculatePriceStats(prices),
          supply_demand: calculateCategorySupplyDemand({
            categoryIds,
            openStepCountByCategory,
            creatorCountByCategory,
          }),
        })
      }
    } else {
      emptyParentCards.push({
        card_type: 'empty_parent',
        parent_category: parent.parent_category,
        sort_order: parent.sort_order,
      })
    }
  })

  individualCards.sort((a, b) => b.transaction_count - a.transaction_count)
  parentFallbackCards.sort((a, b) => b.transaction_count - a.transaction_count)
  emptyParentCards.sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return a.parent_category.localeCompare(b.parent_category, 'ja')
  })

  return [...individualCards, ...parentFallbackCards, ...emptyParentCards]
}

function buildProductMarketCards({
  categories,
  parentCategories,
  pricePoints,
}: {
  categories: CategoryRow[]
  parentCategories: { parent_category: string; sort_order: number }[]
  pricePoints: PricePoint[]
}): ProductMarketCard[] {
  const categoryById = new Map<number, CategoryRow>()
  categories.forEach((category) => categoryById.set(category.id, category))

  const pricesByCategory = groupPricesByCategory(pricePoints)
  const pricesByParent = groupPricesByParent(pricePoints, categoryById)

  const individualCards: ProductSmallCategoryStats[] = []
  const parentFallbackCards: ProductParentCategoryStats[] = []
  const emptyParentCards: ProductEmptyParentCategoryCard[] = []

  const parentHasIndividual = new Set<string>()

  categories.forEach((category) => {
    const parent = category.parent_category || 'その他'
    const prices = pricesByCategory.get(category.id) || []

    if (prices.length >= 5) {
      parentHasIndividual.add(parent)

      individualCards.push({
        card_type: 'individual',
        category_id: category.id,
        category_name: category.name,
        parent_category: parent,
        ...calculatePriceStats(prices),
      })
    }
  })

  parentCategories.forEach((parent) => {
    const prices = pricesByParent.get(parent.parent_category) || []

    if (prices.length >= 1) {
      const shouldShowParentFallback = categories.some((category) => {
        const categoryParent = category.parent_category || 'その他'
        if (categoryParent !== parent.parent_category) return false

        const categoryPrices = pricesByCategory.get(category.id) || []
        return categoryPrices.length < 5
      })

      if (shouldShowParentFallback || !parentHasIndividual.has(parent.parent_category)) {
        parentFallbackCards.push({
          card_type: 'parent_fallback',
          parent_category: parent.parent_category,
          ...calculatePriceStats(prices),
        })
      }
    } else {
      emptyParentCards.push({
        card_type: 'empty_parent',
        parent_category: parent.parent_category,
        sort_order: parent.sort_order,
      })
    }
  })

  individualCards.sort((a, b) => b.transaction_count - a.transaction_count)
  parentFallbackCards.sort((a, b) => b.transaction_count - a.transaction_count)
  emptyParentCards.sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return a.parent_category.localeCompare(b.parent_category, 'ja')
  })

  return [...individualCards, ...parentFallbackCards, ...emptyParentCards]
}

function groupPricesByCategory(pricePoints: PricePoint[]) {
  const map = new Map<number, number[]>()

  pricePoints.forEach((point) => {
    if (!map.has(point.category_id)) {
      map.set(point.category_id, [])
    }

    map.get(point.category_id)!.push(point.price)
  })

  return map
}

function groupPricesByParent(
  pricePoints: PricePoint[],
  categoryById: Map<number, CategoryRow>
) {
  const map = new Map<string, number[]>()

  pricePoints.forEach((point) => {
    const category = categoryById.get(point.category_id)
    if (!category) return

    const parent = category.parent_category || 'その他'

    if (!map.has(parent)) {
      map.set(parent, [])
    }

    map.get(parent)!.push(point.price)
  })

  return map
}

function calculatePriceStats(prices: number[]): PriceStatsBase {
  const cleanPrices = prices
    .map((price) => Number(price))
    .filter((price) => Number.isFinite(price) && price > 0)

  if (cleanPrices.length === 0) {
    return {
      median_price: 0,
      avg_price: 0,
      min_price: 0,
      max_price: 0,
      p25_price: 0,
      p75_price: 0,
      transaction_count: 0,
      confidence_label: '参考値',
      confidence_color: 'gray',
    }
  }

  const transactionCount = cleanPrices.length

  return {
    median_price: getMedian(cleanPrices),
    avg_price:
      cleanPrices.reduce((sum, price) => sum + price, 0) / transactionCount,
    min_price: Math.min(...cleanPrices),
    max_price: Math.max(...cleanPrices),
    p25_price: getPercentile(cleanPrices, 0.25),
    p75_price: getPercentile(cleanPrices, 0.75),
    transaction_count: transactionCount,
    ...getConfidence(transactionCount),
  }
}

function getMedian(numbers: number[]) {
  if (numbers.length === 0) return 0

  const sorted = [...numbers].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

function getPercentile(numbers: number[], percentile: number) {
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

function getConfidence(transactionCount: number): {
  confidence_label: string
  confidence_color: ConfidenceColor
} {
  if (transactionCount >= 20) {
    return {
      confidence_label: '信頼度：高',
      confidence_color: 'green',
    }
  }

  if (transactionCount >= 5) {
    return {
      confidence_label: '信頼度：中',
      confidence_color: 'yellow',
    }
  }

  return {
    confidence_label: '参考値',
    confidence_color: 'gray',
  }
}

function calculateCategorySupplyDemand({
  categoryIds,
  openStepCountByCategory,
  creatorCountByCategory,
}: {
  categoryIds: number[]
  openStepCountByCategory: Map<number, number>
  creatorCountByCategory: Map<number, number>
}): SupplyDemand {
  const openSteps = categoryIds.reduce(
    (sum, categoryId) => sum + (openStepCountByCategory.get(categoryId) || 0),
    0
  )

  const creatorCount = categoryIds.reduce(
    (sum, categoryId) => sum + (creatorCountByCategory.get(categoryId) || 0),
    0
  )

  if (creatorCount <= 0) {
    return {
      open_steps: openSteps,
      creator_count: creatorCount,
      ratio: null,
      label: '対応クリエイター未登録',
      color: 'gray',
    }
  }

  const ratio = openSteps / creatorCount

  if (ratio >= 1.0) {
    return {
      open_steps: openSteps,
      creator_count: creatorCount,
      ratio,
      label: 'クリエイター不足',
      color: 'red',
    }
  }

  if (ratio >= 0.5) {
    return {
      open_steps: openSteps,
      creator_count: creatorCount,
      ratio,
      label: '需給均衡',
      color: 'green',
    }
  }

  return {
    open_steps: openSteps,
    creator_count: creatorCount,
    ratio,
    label: 'クリエイター余剰',
    color: 'blue',
  }
}

function getRequestCardKey(item: RequestMarketCard) {
  if (item.card_type === 'individual') {
    return `request-individual-${item.category_id}`
  }

  if (item.card_type === 'parent_fallback') {
    return `request-parent-${item.parent_category}`
  }

  return `request-empty-${item.parent_category}`
}

function getProductCardKey(item: ProductMarketCard) {
  if (item.card_type === 'individual') {
    return `product-individual-${item.category_id}`
  }

  if (item.card_type === 'parent_fallback') {
    return `product-parent-${item.parent_category}`
  }

  return `product-empty-${item.parent_category}`
}

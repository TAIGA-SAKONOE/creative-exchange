'use client'

import { createClient } from '../../lib/supabase/client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProductMarketStatsCard from '../components/ProductMarketStatsCard'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'

type Category = {
  id: number
  name: string
  parent_category: string | null
  sort_order: number | null
}

type CategoryGroup = {
  parentCategory: string
  items: Category[]
}

type ProductMarketStats = {
  count: number
  average: number
  median: number
  min: number
  max: number
} | null

const groupCategoriesByParent = (categories: Category[]): CategoryGroup[] => {
  const grouped = new Map<string, Category[]>()

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

export default function ListingPage() {
  const [listings, setListings] = useState<any[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [categoryId, setCategoryId] = useState('')
  const [titleKeyword, setTitleKeyword] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [marketStats, setMarketStats] = useState<ProductMarketStats>(null)
  const [marketStatsLoading, setMarketStatsLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single()

        setProfile(userProfile)
      }

      const { data: cats, error: catsError } = await supabase
        .from('categories')
        .select('id, name, parent_category, sort_order')
        .order('sort_order', { ascending: true })
        .order('parent_category', { ascending: true })
        .order('name', { ascending: true })

      if (catsError) {
        console.error('categories fetch error:', catsError)
      }

      setCategories((cats || []) as Category[])

      const { data, error } = await supabase
        .from('product_listings')
        .select(`
          *,
          categories (name, parent_category),
          users:seller_user_id (display_name, twitter_handle)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('listings fetch error:', error)
      } else {
        setListings(data || [])
      }

      setLoading(false)
    }

    init()
  }, [])

  const groupedCategories = useMemo(() => {
    return groupCategoriesByParent(categories)
  }, [categories])

  const selectedCategory = useMemo(() => {
    if (!categoryId) return null
    return categories.find((cat) => cat.id === Number(categoryId)) || null
  }, [categoryId, categories])

  const getMedian = (numbers: number[]) => {
    if (numbers.length === 0) return 0

    const sorted = [...numbers].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2
    }

    return sorted[middle]
  }

  const loadMarketStats = async (selectedCategoryId: string) => {
    if (!selectedCategoryId) {
      setMarketStats(null)
      return
    }

    setMarketStatsLoading(true)

    try {
      const supabase = createClient()

      // product_purchases には created_at がないため、
      // 現時点では作品相場は全件ベースで集計する。
      const { data, error } = await supabase
        .from('product_purchases')
        .select('price')
        .eq('category_id', Number(selectedCategoryId))
        .gt('price', 0)

      if (error) {
        console.error('market stats fetch error:', error)
        setMarketStats(null)
        return
      }

      const prices = (data || [])
        .map((row: any) => Number(row.price || 0))
        .filter((price) => Number.isFinite(price) && price > 0)

      if (prices.length === 0) {
        setMarketStats(null)
        return
      }

      const count = prices.length
      const average = prices.reduce((sum, price) => sum + price, 0) / count
      const median = getMedian(prices)
      const min = Math.min(...prices)
      const max = Math.max(...prices)

      setMarketStats({
        count,
        average,
        median,
        min,
        max,
      })
    } finally {
      setMarketStatsLoading(false)
    }
  }

  useEffect(() => {
    loadMarketStats(categoryId)
  }, [categoryId])

  const getCategoryName = (item: any) => {
    if (!item.categories) return '未分類'
    if (Array.isArray(item.categories)) return item.categories[0]?.name || '未分類'
    return item.categories.name || '未分類'
  }

  const filteredListings = useMemo(() => {
    const parsedMin = minPrice.trim() === '' ? null : Number(minPrice)
    const parsedMax = maxPrice.trim() === '' ? null : Number(maxPrice)

    return listings.filter((item) => {
      const title = item.title || ''
      const price = item.price

      const matchCategory =
        categoryId.trim() === '' || Number(item.category_id) === Number(categoryId)

      const matchTitle =
        titleKeyword.trim() === '' ||
        title.toLowerCase().includes(titleKeyword.toLowerCase())

      const matchMin =
        parsedMin === null || (price !== null && Number(price) >= parsedMin)

      const matchMax =
        parsedMax === null || (price !== null && Number(price) <= parsedMax)

      return matchCategory && matchTitle && matchMin && matchMax
    })
  }, [listings, categoryId, titleKeyword, minPrice, maxPrice])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">作品マーケット</h1>
            <p className="text-gray-600">クリエイターの既製品を購入できます</p>
          </div>

          {profile && (
            <button
              onClick={() => router.push('/listing/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
            >
              作品を出品する
            </button>
          )}
        </div>

        <ProductMarketStatsCard
          selectedCategoryName={selectedCategory?.name || ''}
          stats={marketStats}
          loading={marketStatsLoading}
        />

        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-lg font-bold mb-4">作品を検索</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                カテゴリ
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              >
                <option value="">すべての品目</option>

                {groupedCategories.map((group) => (
                  <optgroup key={group.parentCategory} label={group.parentCategory}>
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
              <label className="block text-sm font-medium text-gray-600 mb-2">
                タイトル
              </label>
              <input
                type="text"
                value={titleKeyword}
                onChange={(e) => setTitleKeyword(e.target.value)}
                placeholder="例: オリジナル曲"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                最低価格
              </label>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="例: 1000"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                最高価格
              </label>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="例: 50000"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-3">
            {filteredListings.length} 件の作品が見つかりました
          </p>
        </div>

        {loading ? (
          <LoadingState message="作品マーケットを読み込み中..." />
        ) : filteredListings.length === 0 ? (
          <EmptyState
            icon="🎨"
            title="条件に合う作品がありません"
            message="検索条件をゆるめるか、カテゴリを変更すると見つかる場合があります。出品できる作品があれば、最初の作品を登録して市場を作りましょう。"
            actionLabel={profile ? '最初の作品を出品する' : undefined}
            actionHref={profile ? '/listing/new' : undefined}
            secondaryLabel="条件を変えて探す"
            secondaryHref="/listing"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((item) => {
              const images = Array.isArray(item.image_urls) ? item.image_urls : []
              const sellerName = item.users?.display_name || '不明'
              const catName = getCategoryName(item)

              return (
                <Link key={item.id} href={`/listing/${item.id}`}>
                  <div className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden cursor-pointer">
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      {images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400">
                          <div className="text-4xl mb-2">🎨</div>
                          <div className="text-xs font-bold">No Image</div>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <p className="text-xs text-gray-500 mb-1">{catName}</p>
                      <h3 className="font-bold text-lg mb-2 truncate">{item.title}</h3>
                      <p className="text-2xl font-bold text-blue-600 mb-3">
                        ¥{Number(item.price).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">出品者: {sellerName}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

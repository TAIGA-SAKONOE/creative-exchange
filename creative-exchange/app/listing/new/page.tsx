'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProductMarketStatsCard from '../../components/ProductMarketStatsCard'

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

export default function NewListing() {
  const [categories, setCategories] = useState<Category[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const [marketStats, setMarketStats] = useState<ProductMarketStats>(null)
  const [marketStatsLoading, setMarketStatsLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: userProfile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      setProfile(userProfile)

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
      setLoading(false)
    }

    init()
  }, [router])

  const groupedCategories = useMemo(() => {
    return groupCategoriesByParent(categories)
  }, [categories])

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
        .filter((value) => Number.isFinite(value) && value > 0)

      if (prices.length === 0) {
        setMarketStats(null)
        return
      }

      const count = prices.length
      const average = prices.reduce((sum, value) => sum + value, 0) / count
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

  const handleSubmit = async () => {
    if (!profile || !title.trim() || !price || !categoryId) {
      alert('タイトル・品目・価格は必須です')
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    try {
      let imageUrls: string[] = []

      if (imageFile) {
        const filePath = `listings/${profile.id}/${Date.now()}_${imageFile.name}`

        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(filePath, imageFile)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('listing-images').getPublicUrl(filePath)

        imageUrls = [publicUrl]
      }

      const { error: insertError } = await supabase
        .from('product_listings')
        .insert({
          seller_user_id: profile.id,
          title: title.trim(),
          description: description.trim(),
          price: parseInt(price, 10),
          category_id: Number(categoryId),
          image_urls: imageUrls,
          status: 'active',
        })

      if (insertError) throw insertError

      alert('作品を出品しました！')
      router.push('/listing')
    } catch (err: any) {
      alert('出品に失敗しました: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCategoryName =
    categories.find((cat) => cat.id === Number(categoryId))?.name || ''

  if (loading) return <div className="p-12 text-center">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={() => router.push('/listing')}
          className="mb-6 text-gray-500 hover:text-gray-700"
        >
          ← 作品一覧に戻る
        </button>

        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-3xl font-bold mb-8">作品を出品する</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイトル *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="作品のタイトル"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                品目 *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                required
              >
                <option value="">品目を選択してください</option>

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
              <p className="mt-2 text-sm text-gray-500">
                依頼機能や相場ボードと同じ品目体系で管理されます。
              </p>
            </div>

            {selectedCategoryName && (
              <ProductMarketStatsCard
                selectedCategoryName={selectedCategoryName}
                stats={marketStats}
                loading={marketStatsLoading}
              />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                価格（円） *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="5000"
                min="100"
              />
              <p className="mt-2 text-sm text-gray-500">
                実売相場を見ながら、販売価格を決められます。
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y"
                placeholder="作品の説明、仕様など"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                サムネイル画像
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full text-sm"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full py-4 rounded-xl font-medium text-lg text-white ${
                submitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? '出品中...' : '出品する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

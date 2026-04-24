'use client'

import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ListingPage() {
  const [listings, setListings] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single()
        setProfile(userProfile)
      }

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')
      setCategories(cats || [])

      await loadListings()
    }
    init()
  }, [])

  const loadListings = async (catId?: string) => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('product_listings')
      .select(`
        *,
        categories (name),
        users:seller_user_id (display_name, twitter_handle)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (catId) {
      query = query.eq('category_id', parseInt(catId))
    }

    const { data, error } = await query
    if (error) {
      console.error('listings fetch error:', error)
    } else {
      setListings(data || [])
    }
    setLoading(false)
  }

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId)
    loadListings(catId || undefined)
  }

  const childCategories = categories.filter(c => c.parent_id)

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

        {/* カテゴリフィルター */}
        <div className="mb-8">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">すべての品目</option>
            {childCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* 作品一覧 */}
        {loading ? (
          <div className="text-center py-12">読み込み中...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">まだ出品されている作品がありません</p>
            {profile && (
              <button
                onClick={() => router.push('/listing/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
              >
                最初の作品を出品する
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => {
              const images = Array.isArray(item.image_urls) ? item.image_urls : []
              const sellerName = item.users?.display_name || '不明'
              const catName = Array.isArray(item.categories)
                ? item.categories[0]?.name
                : item.categories?.name || '未分類'

              return (
                <Link key={item.id} href={`/listing/${item.id}`}>
                  <div className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden cursor-pointer">
                    {/* サムネイル */}
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      {images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 text-4xl">🎨</div>
                      )}
                    </div>

                    {/* 情報 */}
                    <div className="p-5">
                      <p className="text-xs text-gray-500 mb-1">{catName}</p>
                      <h3 className="font-bold text-lg mb-2 truncate">{item.title}</h3>
                      <p className="text-2xl font-bold text-blue-600 mb-3">
                        ¥{Number(item.price).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        出品者: {sellerName}
                      </p>
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

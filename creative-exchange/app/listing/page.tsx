'use client'

import { createClient } from '../../lib/supabase/client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ListingPage() {
  const [listings, setListings] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [categoryKeyword, setCategoryKeyword] = useState('')
  const [titleKeyword, setTitleKeyword] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
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

      const { data, error } = await supabase
        .from('product_listings')
        .select(`
          *,
          categories (name),
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

  const getCategoryName = (item: any) => {
    if (!item.categories) return '未分類'
    if (Array.isArray(item.categories)) return item.categories[0]?.name || '未分類'
    return item.categories.name || '未分類'
  }

  const filteredListings = useMemo(() => {
    const parsedMin = minPrice.trim() === '' ? null : Number(minPrice)
    const parsedMax = maxPrice.trim() === '' ? null : Number(maxPrice)

    return listings.filter((item) => {
      const catName = getCategoryName(item)
      const title = item.title || ''
      const price = item.price

      const matchCategory = categoryKeyword.trim() === '' ||
        catName === categoryKeyword

      const matchTitle = titleKeyword.trim() === '' ||
        title.toLowerCase().includes(titleKeyword.toLowerCase())

      const matchMin = parsedMin === null || (price !== null && Number(price) >= parsedMin)
      const matchMax = parsedMax === null || (price !== null && Number(price) <= parsedMax)

      return matchCategory && matchTitle && matchMin && matchMax
    })
  }, [listings, categoryKeyword, titleKeyword, minPrice, maxPrice])

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

        {/* 検索フィルター */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-lg font-bold mb-4">作品を検索</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">カテゴリ</label>
              <select
                value={categoryKeyword}
                onChange={(e) => setCategoryKeyword(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">すべての品目</option>
                {Array.from(new Set(listings.map(item => getCategoryName(item)))).sort().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">タイトル</label>
              <input
                type="text"
                value={titleKeyword}
                onChange={(e) => setTitleKeyword(e.target.value)}
                placeholder="例: オリジナル曲"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">最低価格</label>
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
              <label className="block text-sm font-medium text-gray-600 mb-2">最高価格</label>
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

        {/* 作品一覧 */}
        {loading ? (
          <div className="text-center py-12">読み込み中...</div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">条件に合う作品がありません</p>
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
                        <div className="text-gray-400 text-4xl">🎨</div>
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

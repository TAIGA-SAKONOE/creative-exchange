'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ListingDetail() {
  const params = useParams()
  const id = params.id as string
  const [listing, setListing] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
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

      const { data, error: fetchError } = await supabase
        .from('product_listings')
        .select(`
          *,
          categories (name),
          users:seller_user_id (id, display_name, twitter_handle, bio)
        `)
        .eq('id', id)
        .single()

      if (fetchError) {
        setError('この作品は存在しないか、閲覧権限がありません')
      } else {
        setListing(data)
      }

      setLoading(false)
    }

    loadData()
  }, [id])

  const handlePurchase = async () => {
    if (!profile || !listing) return
    if (profile.id === listing.seller_user_id) {
      alert('自分の作品は購入できません')
      return
    }

    const confirmed = window.confirm(
      `「${listing.title}」を ¥${Number(listing.price).toLocaleString()} で購入しますか？\n\n※ 現在はテストモードのため、実際の決済は行われません。`
    )
    if (!confirmed) return

    setPurchasing(true)
    const supabase = createClient()

    try {
      // 購入レコード作成
      const { error: purchaseError } = await supabase
        .from('product_purchases')
        .insert({
          listing_id: listing.id,
          buyer_user_id: profile.id,
          price: listing.price,
          category_id: listing.category_id,
          status: 'completed',
          completed_at: new Date().toISOString()
        })

      if (purchaseError) throw purchaseError

      // 出品ステータスを sold に変更
      const { error: updateError } = await supabase
        .from('product_listings')
        .update({
          status: 'sold',
          updated_at: new Date().toISOString()
        })
        .eq('id', listing.id)

      if (updateError) throw updateError

      // 出品者に通知
      await supabase.from('notifications').insert({
        user_id: listing.seller_user_id,
        type: 'product_sold',
        title: '作品が購入されました',
        body: `「${listing.title}」が ¥${Number(listing.price).toLocaleString()} で購入されました。`,
        link_url: `/listing/${listing.id}`
      })

      alert('購入が完了しました！')
      window.location.reload()
    } catch (err: any) {
      alert('購入に失敗しました: ' + err.message)
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) return <div className="p-12 text-center">読み込み中...</div>
  if (error) return <div className="p-12 text-center text-red-600">{error}</div>
  if (!listing) return <div className="p-12 text-center">作品が見つかりません</div>

  const images = Array.isArray(listing.image_urls) ? listing.image_urls : []
  const seller = listing.users || {}
  const catName = Array.isArray(listing.categories)
    ? listing.categories[0]?.name
    : listing.categories?.name || '未分類'
  const isSeller = profile?.id === listing.seller_user_id
  const isSold = listing.status === 'sold'
  const canPurchase = profile && !isSeller && !isSold

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => router.push('/listing')}
          className="mb-6 text-gray-500 hover:text-gray-700"
        >
          ← 作品一覧に戻る
        </button>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {/* サムネイル */}
          <div className="h-80 bg-gray-100 flex items-center justify-center">
            {images.length > 0 ? (
              <img
                src={images[0]}
                alt={listing.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-gray-400 text-6xl">🎨</div>
            )}
          </div>

          <div className="p-8">
            {/* ステータスバッジ */}
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm text-gray-500">{catName}</p>
              {isSold && (
                <span className="px-4 py-1 rounded-full text-sm bg-red-100 text-red-700">
                  売約済み
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-4">{listing.title}</h1>

            <p className="text-4xl font-bold text-blue-600 mb-6">
              ¥{Number(listing.price).toLocaleString()}
            </p>

            {listing.description && (
              <div className="mb-8">
                <p className="text-sm text-gray-500 mb-2">作品説明</p>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            {/* 出品者情報 */}
            <div className="mb-8 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-2">出品者</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-lg">{seller.display_name || '不明'}</p>
                  {seller.twitter_handle && (
                    <p className="text-sm text-gray-500">@{seller.twitter_handle}</p>
                  )}
                </div>
                {seller.id && (
                  <button
                    onClick={() => router.push(`/creator/${seller.id}`)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    プロフィールを見る →
                  </button>
                )}
              </div>
            </div>

            {/* 購入ボタン */}
            {canPurchase && (
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className={`w-full py-4 rounded-xl font-medium text-lg text-white ${
                  purchasing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {purchasing ? '購入処理中...' : `¥${Number(listing.price).toLocaleString()} で購入する`}
              </button>
            )}

            {isSeller && (
              <p className="text-sm text-gray-400 text-center mt-4">
                これはあなたが出品した作品です
              </p>
            )}

            {isSold && !isSeller && (
              <p className="text-sm text-red-500 text-center mt-4">
                この作品は売約済みです
              </p>
            )}

            <div className="text-sm text-gray-500 pt-6 mt-6 border-t">
              出品日: {new Date(listing.created_at).toLocaleDateString('ja-JP')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

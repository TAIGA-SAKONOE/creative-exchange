'use client'

import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function MyPage() {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [receivedOrders, setReceivedOrders] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [productListings, setProductListings] = useState<any[]>([])
  const [productPurchases, setProductPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userCategoryNames, setUserCategoryNames] = useState<string[]>([])

  useEffect(() => {
    const loadMyPage = async () => {
      const supabase = createClient()

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single()

      if (profile) {
        setUser(profile)

        const { data: myRequests } = await supabase
          .from('orders')
          .select(`
            *,
            categories(name)
          `)
          .eq('client_id', profile.id)
          .order('created_at', { ascending: false })

        setRequests(myRequests || [])

        const { data: myReceivedOrders } = await supabase
          .from('orders')
          .select(`
            *,
            categories(name)
          `)
          .eq('creator_id', profile.id)
          .order('created_at', { ascending: false })

        setReceivedOrders(myReceivedOrders || [])

        const { data: categoryLinks } = await supabase
          .from('user_categories')
          .select(`
            category_id,
            categories(name)
          `)
          .eq('user_id', profile.id)

        const names =
          (categoryLinks || [])
            .map((row: any) => {
              if (Array.isArray(row.categories)) {
                return row.categories[0]?.name || null
              }
              return row.categories?.name || null
            })
            .filter(Boolean) || []

        setUserCategoryNames(names)

        const { data: notificationRows } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(20)

        setNotifications(notificationRows || [])

        const { data: myListings } = await supabase
          .from('product_listings')
          .select(`
            *,
            categories(name)
          `)
          .eq('seller_user_id', profile.id)
          .order('created_at', { ascending: false })

        setProductListings(myListings || [])

        const { data: myPurchases } = await supabase
          .from('product_purchases')
          .select(`
            *,
            product_listings(
              id,
              title,
              image_urls,
              seller_user_id
            ),
            categories(name)
          `)
          .eq('buyer_user_id', profile.id)
          .order('created_at', { ascending: false })

        setProductPurchases(myPurchases || [])
      }

      setLoading(false)
    }

    loadMyPage()
  }, [router])

  const handleNotificationClick = async (notification: any) => {
    if (!notification?.id) return

    const targetUrl = notification.link_url || '/mypage'

    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        )
      )

      const supabase = createClient()

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id)

      if (error) {
        console.error('notification read update error:', error)
      }
    }

    router.push(targetUrl)
  }

  const getStatusLabel = (status: string) => {
    if (status === 'draft') return '下書き'
    if (status === 'open') return '公開中'
    if (status === 'matched') return '受注済み'
    if (status === 'in_progress') return '制作中'
    if (status === 'revision') return '修正依頼中'
    if (status === 'delivered') return '納品済み'
    if (status === 'completed') return '完了'
    if (status === 'cancelled') return 'キャンセル'
    if (status === 'active') return '販売中'
    if (status === 'sold') return '売約済み'
    return status
  }

  const getStatusClassName = (status: string) => {
    if (status === 'completed') return 'bg-green-100 text-green-700'
    if (status === 'matched') return 'bg-purple-100 text-purple-700'
    if (status === 'delivered') return 'bg-blue-100 text-blue-700'
    if (status === 'open') return 'bg-yellow-100 text-yellow-700'
    if (status === 'in_progress') return 'bg-indigo-100 text-indigo-700'
    if (status === 'revision') return 'bg-red-100 text-red-700'
    if (status === 'active') return 'bg-blue-100 text-blue-700'
    if (status === 'sold') return 'bg-gray-200 text-gray-700'
    return 'bg-gray-100 text-gray-600'
  }

  const getSkillText = (skills: any) => {
    if (!skills) return '未設定'
    if (Array.isArray(skills)) {
      return skills.filter(Boolean).join(' / ') || '未設定'
    }
    return String(skills)
  }

  const getFirstImage = (imageUrls: any) => {
    if (!imageUrls) return null
    if (Array.isArray(imageUrls)) return imageUrls[0] || null
    return null
  }

  if (loading) return <div className="p-12 text-center">読み込み中...</div>
  if (!user) return <div>ログインしてください</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight">マイページ</h1>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/listing/new"
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 px-6 py-3.5 rounded-2xl font-medium shadow-sm transition text-center"
            >
              作品を出品する
            </Link>

            <Link
              href="/request/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-medium shadow-sm transition text-center"
            >
              新しい依頼を作成
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10 mb-12">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center text-6xl text-white shadow-inner">
              👤
            </div>

            <div className="flex-1">
              <h2 className="text-4xl font-bold mb-1">{user.display_name}</h2>
              <p className="text-2xl text-gray-600">
                @{user.twitter_handle || '未設定'}
              </p>

              {user.bio && (
                <p className="mt-6 text-lg text-gray-700 leading-relaxed">
                  {user.bio}
                </p>
              )}

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-500 mb-2">
                  納品できる品目
                </p>
                <div className="flex flex-wrap gap-2">
                  {userCategoryNames.length > 0 ? (
                    userCategoryNames.map((name) => (
                      <span
                        key={name}
                        className="inline-flex px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100"
                      >
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">未設定</span>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-500 mb-2">
                  補足スキル・得意領域
                </p>
                <p className="text-gray-700 leading-relaxed">
                  {getSkillText(user.skills)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              href={`/creator/${user.id}`}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-5 rounded-2xl font-medium text-center hover:brightness-105 transition shadow-sm flex items-center justify-center gap-3"
            >
              📊 自分の価格表を見る
            </Link>

            <Link
              href="/exchange"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-5 rounded-2xl font-medium text-center hover:brightness-105 transition shadow-sm flex items-center justify-center gap-3"
            >
              🤝 Exchangeを見る
            </Link>

            <Link
              href="/listing"
              className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-5 rounded-2xl font-medium text-center hover:brightness-105 transition shadow-sm flex items-center justify-center gap-3"
            >
              🛍 作品マーケットを見る
            </Link>

            <Link
              href="/profile/edit"
              className="border-2 border-gray-300 hover:bg-gray-50 py-5 rounded-2xl font-medium text-center transition"
            >
              プロフィール編集
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">通知ボード</h2>
            <span className="text-sm text-gray-500">{notifications.length}件</span>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              まだ通知はありません
            </div>
          ) : (
            <div className="grid gap-4 max-h-[420px] overflow-y-auto pr-2">
              {notifications.map((notification) => {
                const isUnread = !notification.is_read

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`group w-full text-left border rounded-2xl p-5 transition-all duration-300 ${
                      isUnread
                        ? 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                        : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isUnread && (
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                          )}

                          <div
                            className={`text-lg font-semibold transition-colors ${
                              isUnread
                                ? 'text-gray-900 group-hover:text-blue-600'
                                : 'text-gray-500'
                            }`}
                          >
                            {notification.title}
                          </div>
                        </div>

                        {notification.body && (
                          <div
                            className={`whitespace-pre-wrap leading-relaxed ${
                              isUnread ? 'text-gray-600' : 'text-gray-500'
                            }`}
                          >
                            {notification.body}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0 text-xs text-gray-500">
                        {notification.created_at
                          ? new Date(notification.created_at).toLocaleString('ja-JP')
                          : ''}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">あなたの依頼一覧</h2>
            <span className="text-sm text-gray-500">{requests.length}件</span>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              まだ依頼がありません
              <br />
              「新しい依頼を作成」から初めてみましょう
            </div>
          ) : (
            <div className="grid gap-6 max-h-[520px] overflow-y-auto pr-2">
              {requests.map((req) => (
                <Link
                  key={req.id}
                  href={`/request/${req.id}`}
                  className="group border border-gray-200 hover:border-blue-300 hover:shadow-lg rounded-3xl p-8 transition-all duration-300"
                >
                  <div className="flex justify-between items-start gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                        {req.title}
                      </div>
                      <div className="text-gray-600">
                        {req.categories?.name || '未分類'}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`inline-block px-5 py-1.5 rounded-full text-sm font-medium ${getStatusClassName(req.status)}`}
                      >
                        {getStatusLabel(req.status)}
                      </div>

                      {req.agreed_price && (
                        <div className="mt-4 text-2xl font-semibold text-gray-900">
                          ¥{req.agreed_price.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">あなたの受注一覧</h2>
            <span className="text-sm text-gray-500">{receivedOrders.length}件</span>
          </div>

          {receivedOrders.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              まだ受注した依頼がありません
              <br />
              Exchange から公開依頼を探してみましょう
            </div>
          ) : (
            <div className="grid gap-6 max-h-[520px] overflow-y-auto pr-2">
              {receivedOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/request/${order.id}`}
                  className="group border border-gray-200 hover:border-blue-300 hover:shadow-lg rounded-3xl p-8 transition-all duration-300"
                >
                  <div className="flex justify-between items-start gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                        {order.title}
                      </div>
                      <div className="text-gray-600">
                        {order.categories?.name || '未分類'}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`inline-block px-5 py-1.5 rounded-full text-sm font-medium ${getStatusClassName(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </div>

                      {order.agreed_price && (
                        <div className="mt-4 text-2xl font-semibold text-gray-900">
                          ¥{order.agreed_price.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10 mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">あなたの出品一覧</h2>
              <p className="text-sm text-gray-500 mt-2">
                作品マーケットに出品した既製品です
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {productListings.length}件
              </span>
              <Link
                href="/listing/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-medium transition"
              >
                作品を出品する
              </Link>
            </div>
          </div>

          {productListings.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              まだ出品した作品がありません
              <br />
              「作品を出品する」から既製品を登録できます
            </div>
          ) : (
            <div className="grid gap-6 max-h-[620px] overflow-y-auto pr-2">
              {productListings.map((listing) => {
                const imageUrl = getFirstImage(listing.image_urls)

                return (
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="group border border-gray-200 hover:border-blue-300 hover:shadow-lg rounded-3xl overflow-hidden transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-56 h-56 bg-gray-100 overflow-hidden shrink-0">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            画像なし
                          </div>
                        )}
                      </div>

                      <div className="flex-1 p-8 flex justify-between gap-6">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-gray-500 mb-2">
                            {listing.categories?.name || '未分類'}
                          </div>
                          <div className="text-2xl font-semibold mb-3 group-hover:text-blue-600 transition-colors">
                            {listing.title}
                          </div>
                          <div className="text-gray-600 line-clamp-3">
                            {listing.description || '説明はありません'}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`inline-block px-5 py-1.5 rounded-full text-sm font-medium ${getStatusClassName(listing.status)}`}
                          >
                            {getStatusLabel(listing.status)}
                          </div>
                          <div className="mt-4 text-3xl font-bold text-blue-600">
                            ¥{Number(listing.price || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">あなたの購入履歴</h2>
              <p className="text-sm text-gray-500 mt-2">
                作品マーケットで購入した既製品です
              </p>
            </div>
            <span className="text-sm text-gray-500">
              {productPurchases.length}件
            </span>
          </div>

          {productPurchases.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              まだ購入した作品がありません
              <br />
              作品マーケットから既製品を探してみましょう
            </div>
          ) : (
            <div className="grid gap-6 max-h-[620px] overflow-y-auto pr-2">
              {productPurchases.map((purchase) => {
                const listing = Array.isArray(purchase.product_listings)
                  ? purchase.product_listings[0]
                  : purchase.product_listings

                const imageUrl = getFirstImage(listing?.image_urls)

                return (
                  <Link
                    key={purchase.id}
                    href={listing ? `/listing/${listing.id}` : '/listing'}
                    className="group border border-gray-200 hover:border-blue-300 hover:shadow-lg rounded-3xl overflow-hidden transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-56 h-56 bg-gray-100 overflow-hidden shrink-0">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={listing?.title || '購入作品'}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            画像なし
                          </div>
                        )}
                      </div>

                      <div className="flex-1 p-8 flex justify-between gap-6">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-gray-500 mb-2">
                            {purchase.categories?.name || '未分類'}
                          </div>
                          <div className="text-2xl font-semibold mb-3 group-hover:text-blue-600 transition-colors">
                            {listing?.title || '作品タイトル不明'}
                          </div>
                          <div className="text-sm text-gray-500">
                            購入日：
                            {purchase.created_at
                              ? new Date(purchase.created_at).toLocaleString('ja-JP')
                              : '不明'}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`inline-block px-5 py-1.5 rounded-full text-sm font-medium ${getStatusClassName(purchase.status || 'completed')}`}
                          >
                            {getStatusLabel(purchase.status || 'completed')}
                          </div>
                          <div className="mt-4 text-3xl font-bold text-blue-600">
                            ¥{Number(purchase.price || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 text-center">
          <Link
            href="/mypage/delete"
            className="text-sm text-red-500 hover:text-red-700"
          >
            退会する
          </Link>
        </div>
      </div>
    </div>
  )
}

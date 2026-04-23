'use client'

import { createClient } from '../../lib/supabase/client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type UserProfile = {
  id: string
  auth_id: string
  display_name: string | null
}

type CategoryValue = { name: string }[] | { name: string } | null

type OrderItem = {
  id: string
  client_id: string
  creator_id: string | null
  title: string
  description: string | null
  agreed_price: number | null
  status: string
  created_at: string
  categories?: CategoryValue
}

type CreatorItem = {
  id: string
  display_name: string | null
  bio: string | null
  twitter_handle: string | null
  skills: string[] | string | null
  portfolio_urls: string[] | string | null
}

export default function ExchangePage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [creators, setCreators] = useState<CreatorItem[]>([])
  const [activeTab, setActiveTab] = useState<'requests' | 'creators'>('requests')
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null)

  const [categoryKeyword, setCategoryKeyword] = useState('')
  const [titleKeyword, setTitleKeyword] = useState('')
  const [descriptionKeyword, setDescriptionKeyword] = useState('')

  const [creatorNameKeyword, setCreatorNameKeyword] = useState('')
  const [creatorBioKeyword, setCreatorBioKeyword] = useState('')
  const [creatorSkillKeyword, setCreatorSkillKeyword] = useState('')

  useEffect(() => {
    const loadExchangePage = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          setError(authError.message)
          setLoading(false)
          return
        }

        if (!authUser) {
          window.location.href = '/login'
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, auth_id, display_name')
          .eq('auth_id', authUser.id)
          .single()

        if (profileError || !profile) {
          setError('ユーザー情報の取得に失敗しました')
          setLoading(false)
          return
        }

        setCurrentUser(profile as UserProfile)

        const { data: openOrders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            client_id,
            creator_id,
            title,
            description,
            agreed_price,
            status,
            created_at,
            categories(name)
          `)
          .eq('status', 'open')
          .order('created_at', { ascending: false })

        if (ordersError) {
          setError(ordersError.message || '依頼一覧の取得に失敗しました')
          setLoading(false)
          return
        }

        setOrders((openOrders ?? []) as unknown as OrderItem[])

        const { data: creatorRows, error: creatorsError } = await supabase
          .from('users')
          .select('id, display_name, bio, twitter_handle, skills, portfolio_urls')
          .order('created_at', { ascending: false })

        if (creatorsError) {
          setError(creatorsError.message || 'クリエイター一覧の取得に失敗しました')
          setLoading(false)
          return
        }

        const filteredCreatorRows = ((creatorRows ?? []) as CreatorItem[]).filter(
          (creator) => creator.id !== profile.id
        )

        setCreators(filteredCreatorRows)
      } catch (err: any) {
        setError(err?.message || '読み込み中にエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    loadExchangePage()
  }, [])

  const getCategoryName = (order: OrderItem) => {
    if (!order.categories) return '未分類'

    if (Array.isArray(order.categories)) {
      return order.categories[0]?.name || '未分類'
    }

    return order.categories.name || '未分類'
  }

  const getSkillText = (creator: CreatorItem) => {
    if (!creator.skills) return '未設定'
    if (Array.isArray(creator.skills)) {
      return creator.skills.filter(Boolean).join(' / ') || '未設定'
    }
    return String(creator.skills)
  }

  const getFirstPortfolioUrl = (creator: CreatorItem) => {
    if (!creator.portfolio_urls) return null
    if (Array.isArray(creator.portfolio_urls)) {
      return creator.portfolio_urls[0] || null
    }
    return String(creator.portfolio_urls)
  }

  const getOrderDescription = (description: string | null) => {
    if (!description) return '説明はありません'
    if (description.length <= 120) return description
    return `${description.slice(0, 120)}...`
  }

  const getOrderStatusChip = (order: OrderItem) => {
    if (order.creator_id) {
      return {
        label: '受注済み',
        className: 'bg-purple-50 text-purple-700 border border-purple-100',
      }
    }

    return {
      label: '公開中',
      className: 'bg-green-50 text-green-700 border border-green-100',
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const categoryName = getCategoryName(order)
      const title = order.title || ''
      const description = order.description || ''

      const matchCategory =
        categoryKeyword.trim() === '' ||
        categoryName.toLowerCase().includes(categoryKeyword.toLowerCase())

      const matchTitle =
        titleKeyword.trim() === '' ||
        title.toLowerCase().includes(titleKeyword.toLowerCase())

      const matchDescription =
        descriptionKeyword.trim() === '' ||
        description.toLowerCase().includes(descriptionKeyword.toLowerCase())

      return matchCategory && matchTitle && matchDescription
    })
  }, [orders, categoryKeyword, titleKeyword, descriptionKeyword])

  const filteredCreators = useMemo(() => {
    return creators.filter((creator) => {
      const displayName = creator.display_name || ''
      const bio = creator.bio || ''
      const skillsText = getSkillText(creator)

      const matchName =
        creatorNameKeyword.trim() === '' ||
        displayName.toLowerCase().includes(creatorNameKeyword.toLowerCase())

      const matchBio =
        creatorBioKeyword.trim() === '' ||
        bio.toLowerCase().includes(creatorBioKeyword.toLowerCase())

      const matchSkill =
        creatorSkillKeyword.trim() === '' ||
        skillsText.toLowerCase().includes(creatorSkillKeyword.toLowerCase())

      return matchName && matchBio && matchSkill
    })
  }, [creators, creatorNameKeyword, creatorBioKeyword, creatorSkillKeyword])

  const handleAccept = async (orderId: string) => {
    if (!currentUser?.id) {
      window.location.href = '/login'
      return
    }

    const targetOrder = orders.find((order) => order.id === orderId)
    if (!targetOrder) {
      alert('対象の依頼が見つかりませんでした')
      return
    }

    if (targetOrder.client_id === currentUser.id) {
      alert('自分自身の依頼は受注できません')
      return
    }

    if (targetOrder.status !== 'open' || targetOrder.creator_id) {
      alert('この依頼はすでに受注済み、または公開終了です')
      return
    }

    setAcceptingOrderId(orderId)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          creator_id: currentUser.id,
          status: 'matched',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('status', 'open')
        .is('creator_id', null)

      if (updateError) {
        alert('受注に失敗しました: ' + updateError.message)
        return
      }

      alert('依頼を受注しました')
      router.push(`/request/${orderId}`)
      router.refresh()
    } catch (err: any) {
      alert(err?.message || '受注処理中にエラーが発生しました')
    } finally {
      setAcceptingOrderId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center text-gray-600">
            Exchangeを読み込み中...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl p-10">
            <h1 className="text-2xl font-bold text-red-600 mb-4">表示できません</h1>
            <p className="text-gray-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4">
              <span>Exchange</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">案件を探す</h1>
            <p className="mt-3 text-gray-600 text-lg">
              公開依頼から受注先を探し、価格表やプロフィールも確認できます
            </p>
          </div>

          <Link
            href="/mypage"
            className="inline-flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 px-6 py-3 rounded-2xl font-medium shadow-sm transition"
          >
            マイページへ戻る
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-3 mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-5 py-3 rounded-2xl font-medium transition ${
                activeTab === 'requests'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              依頼一覧
            </button>

            <button
              onClick={() => setActiveTab('creators')}
              className={`px-5 py-3 rounded-2xl font-medium transition ${
                activeTab === 'creators'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              クリエイター一覧
            </button>
          </div>
        </div>

        {activeTab === 'requests' ? (
          <>
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">依頼を検索</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    カテゴリ・タイトル・説明文から公開依頼を絞り込めます
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  公開中 {filteredOrders.length} 件
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    カテゴリ
                  </label>
                  <input
                    type="text"
                    value={categoryKeyword}
                    onChange={(e) => setCategoryKeyword(e.target.value)}
                    placeholder="例: イラスト"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={titleKeyword}
                    onChange={(e) => setTitleKeyword(e.target.value)}
                    placeholder="例: MV用イラスト"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    説明文
                  </label>
                  <input
                    type="text"
                    value={descriptionKeyword}
                    onChange={(e) => setDescriptionKeyword(e.target.value)}
                    placeholder="説明文で検索"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-xl p-14 text-center">
                <div className="text-5xl mb-4">🔎</div>
                <h3 className="text-xl font-bold mb-2">公開依頼が見つかりません</h3>
                <p className="text-gray-500">
                  検索条件をゆるめると、表示される場合があります
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredOrders.map((order) => {
                  const isOwnOrder = currentUser?.id === order.client_id
                  const canAccept =
                    order.status === 'open' &&
                    !order.creator_id &&
                    !isOwnOrder
                  const statusChip = getOrderStatusChip(order)

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow"
                    >
                      <div className="flex flex-col xl:flex-row xl:items-stretch gap-8">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-5">
                            <span className="inline-flex px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                              {getCategoryName(order)}
                            </span>

                            <span className={`inline-flex px-4 py-1.5 rounded-full text-sm font-medium ${statusChip.className}`}>
                              {statusChip.label}
                            </span>
                          </div>

                          <Link href={`/request/${order.id}`} className="block">
                            <h3 className="text-3xl font-bold mb-3 hover:text-blue-600 transition">
                              {order.title}
                            </h3>
                          </Link>

                          <p className="text-gray-700 leading-8 text-base">
                            {getOrderDescription(order.description)}
                          </p>

                          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-gray-500">
                            <div>
                              投稿日：
                              {order.created_at
                                ? new Date(order.created_at).toLocaleDateString('ja-JP')
                                : '不明'}
                            </div>
                          </div>
                        </div>

                        <div className="w-full xl:w-80 shrink-0 flex flex-col">
                          <div className="bg-gray-50 rounded-3xl p-6 mb-4 border border-gray-100">
                            <p className="text-sm text-gray-500 mb-2">希望予算</p>
                            <p className="text-4xl font-bold text-blue-600 tracking-tight">
                              {order.agreed_price
                                ? `¥${Number(order.agreed_price).toLocaleString()}`
                                : '未設定'}
                            </p>
                          </div>

                          <div className="space-y-3 mt-auto">
                            <button
                              onClick={() => handleAccept(order.id)}
                              disabled={!canAccept || acceptingOrderId === order.id}
                              className={`w-full py-4 rounded-2xl font-medium text-white shadow-sm transition ${
                                !canAccept || acceptingOrderId === order.id
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              {isOwnOrder
                                ? '自分の依頼です'
                                : acceptingOrderId === order.id
                                  ? '受注中...'
                                  : 'この依頼を受注する'}
                            </button>

                            <Link
                              href={`/request/${order.id}`}
                              className="block w-full text-center border border-gray-200 hover:bg-gray-50 py-4 rounded-2xl font-medium transition"
                            >
                              詳細を見る
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">クリエイターを検索</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    表示名・自己紹介・スキルから探せます
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  表示中 {filteredCreators.length} 人
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    表示名
                  </label>
                  <input
                    type="text"
                    value={creatorNameKeyword}
                    onChange={(e) => setCreatorNameKeyword(e.target.value)}
                    placeholder="例: 山田太郎"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    自己紹介
                  </label>
                  <input
                    type="text"
                    value={creatorBioKeyword}
                    onChange={(e) => setCreatorBioKeyword(e.target.value)}
                    placeholder="例: イラスト / 書家"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    スキル
                  </label>
                  <input
                    type="text"
                    value={creatorSkillKeyword}
                    onChange={(e) => setCreatorSkillKeyword(e.target.value)}
                    placeholder="例: MV / ロゴ / 作詞"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>

            {filteredCreators.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-xl p-14 text-center">
                <div className="text-5xl mb-4">🎨</div>
                <h3 className="text-xl font-bold mb-2">条件に合うクリエイターがいません</h3>
                <p className="text-gray-500">
                  検索条件を変えると、表示される場合があります
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredCreators.map((creator) => {
                  const portfolioUrl = getFirstPortfolioUrl(creator)

                  return (
                    <div
                      key={creator.id}
                      className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow"
                    >
                      <div className="flex flex-col xl:flex-row xl:items-stretch gap-8">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl shadow-inner">
                              👤
                            </div>

                            <div>
                              <h3 className="text-2xl font-bold">
                                {creator.display_name || '名称未設定'}
                              </h3>
                              <p className="text-gray-500">
                                @{creator.twitter_handle || '未設定'}
                              </p>
                            </div>
                          </div>

                          <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-2">自己紹介</p>
                            <p className="text-gray-700 leading-8 whitespace-pre-wrap">
                              {creator.bio || '自己紹介は未設定です'}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500 mb-2">スキル</p>
                            <p className="text-gray-700">{getSkillText(creator)}</p>
                          </div>
                        </div>

                        <div className="w-full xl:w-80 shrink-0 flex flex-col">
                          <div className="bg-gray-50 rounded-3xl p-6 mb-4 border border-gray-100">
                            <p className="text-sm text-gray-500 mb-2">プロフィール導線</p>
                            <p className="text-lg font-semibold text-gray-900">
                              価格表や外部ポートフォリオを確認できます
                            </p>
                          </div>

                          <div className="space-y-3 mt-auto">
                            <Link
                              href={`/creator/${creator.id}`}
                              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-medium transition shadow-sm"
                            >
                              価格表を見る
                            </Link>

                            {portfolioUrl ? (
                              <a
                                href={portfolioUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center border border-gray-200 hover:bg-gray-50 py-4 rounded-2xl font-medium transition"
                              >
                                ポートフォリオを見る
                              </a>
                            ) : (
                              <div className="block w-full text-center border border-gray-200 text-gray-400 py-4 rounded-2xl font-medium">
                                ポートフォリオ未設定
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

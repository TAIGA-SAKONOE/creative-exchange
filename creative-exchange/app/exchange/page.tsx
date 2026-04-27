'use client'

import { createClient } from '../../lib/supabase/client'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ProductMarketStatsCard from '../components/ProductMarketStatsCard'
import EmptyState from '../components/EmptyState'

type UserProfile = {
  id: string
  auth_id: string
  display_name: string | null
  bio?: string | null
  twitter_handle?: string | null
  skills?: string[] | string | null
  portfolio_urls?: string[] | string | null
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
  is_multi_step?: boolean | null
  total_steps?: number | null
  order_type?: 'simple' | 'standard' | 'multi_step' | 'competition' | null
  categories?: CategoryValue
}

type OrderStepListingItem = {
  id: string
  order_id: string
  step_number: number
  title: string
  description: string | null
  required_category_id: number | null
  budget: number | null
  deadline: string | null
  creator_id: string | null
  status: string
  created_at: string | null
  updated_at: string | null
  categories?: CategoryValue
  orders?: {
    id: string
    title: string
    description: string | null
    client_id: string
    status: string
    is_multi_step: boolean | null
    total_steps: number | null
    order_type?: 'simple' | 'standard' | 'multi_step' | 'competition' | null
    categories?: CategoryValue
  } | null
}

type CreatorItem = {
  id: string
  display_name: string | null
  bio: string | null
  twitter_handle: string | null
  skills: string[] | string | null
  portfolio_urls: string[] | string | null
  is_accepting_orders?: boolean | null
  rank?: 'growth' | 'standard' | 'prime' | null
}

type ListingItem = {
  id: string
  seller_user_id: string
  title: string
  description: string | null
  price: number
  image_urls: string[] | null
  status: string
  created_at: string
  categories?: CategoryValue
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

type SkillTag = {
  id: string
  name: string
  parent_category: string | null
}

type CreatorCategoryMap = Record<
  string,
  {
    ids: number[]
    names: string[]
  }
>

type CreatorSkillTagMap = Record<
  string,
  {
    ids: string[]
    names: string[]
    parentCategories: string[]
    tags: SkillTag[]
  }
>

type SellerMap = Record<
  string,
  {
    display_name: string | null
    twitter_handle: string | null
  }
>

const PARENT_CATEGORIES = ['音楽', 'イラスト', '動画', '文章', 'その他']

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

export default function ExchangePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-10 text-center text-gray-600">
              Exchangeを読み込み中...
            </div>
          </div>
        </div>
      }
    >
      <ExchangePageContent />
    </Suspense>
  )
}

function ExchangePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialTab =
    searchParams.get('tab') === 'creators'
      ? 'creators'
      : searchParams.get('tab') === 'listings'
        ? 'listings'
        : 'requests'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [openOrderSteps, setOpenOrderSteps] = useState<OrderStepListingItem[]>([])
  const [creators, setCreators] = useState<CreatorItem[]>([])
  const [listings, setListings] = useState<ListingItem[]>([])
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [allSkillTags, setAllSkillTags] = useState<SkillTag[]>([])
  const [creatorCategoryMap, setCreatorCategoryMap] = useState<CreatorCategoryMap>({})
  const [creatorSkillTagMap, setCreatorSkillTagMap] = useState<CreatorSkillTagMap>({})
  const [sellerMap, setSellerMap] = useState<SellerMap>({})

  const [activeTab, setActiveTab] = useState<'requests' | 'creators' | 'listings'>(initialTab)
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null)
  const [acceptingStepId, setAcceptingStepId] = useState<string | null>(null)
  const [applyingStepId, setApplyingStepId] = useState<string | null>(null)
  const [stepApplicationMessages, setStepApplicationMessages] = useState<Record<string, string>>({})
  const [appliedStepIds, setAppliedStepIds] = useState<string[]>([])
  const [buyingListingId, setBuyingListingId] = useState<string | null>(null)
  const [creatingConsultationCreatorId, setCreatingConsultationCreatorId] = useState<string | null>(null)

  const [requestCategoryId, setRequestCategoryId] = useState('')
  const [titleKeyword, setTitleKeyword] = useState('')
  const [descriptionKeyword, setDescriptionKeyword] = useState('')
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')

  const [creatorCategoryId, setCreatorCategoryId] = useState('')
  const [creatorParentCategory, setCreatorParentCategory] = useState('')
  const [creatorSkillTagKeyword, setCreatorSkillTagKeyword] = useState('')
  const [creatorSkillTagDropdownOpen, setCreatorSkillTagDropdownOpen] = useState(false)
  const creatorSkillTagSearchRef = useRef<HTMLDivElement | null>(null)

  const [creatorNameKeyword, setCreatorNameKeyword] = useState('')
  const [creatorBioKeyword, setCreatorBioKeyword] = useState('')
  const [creatorSkillKeyword, setCreatorSkillKeyword] = useState('')
  const [creatorAcceptingOnly, setCreatorAcceptingOnly] = useState(false)
  const [creatorPrimeOnly, setCreatorPrimeOnly] = useState(false)

  const [listingCategoryId, setListingCategoryId] = useState('')
  const [listingTitleKeyword, setListingTitleKeyword] = useState('')
  const [listingMinPrice, setListingMinPrice] = useState('')
  const [listingMaxPrice, setListingMaxPrice] = useState('')

  const [listingMarketStats, setListingMarketStats] = useState<{
    count: number
    average: number
    median: number
    min: number
    max: number
  } | null>(null)
  const [listingMarketStatsLoading, setListingMarketStatsLoading] = useState(false)

  useEffect(() => {
    const tabParam = searchParams.get('tab')

    if (tabParam === 'creators') {
      setActiveTab('creators')
    } else if (tabParam === 'listings') {
      setActiveTab('listings')
    } else {
      setActiveTab('requests')
    }
  }, [searchParams])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        creatorSkillTagSearchRef.current &&
        !creatorSkillTagSearchRef.current.contains(event.target as Node)
      ) {
        setCreatorSkillTagDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    loadExchangePage()
  }, [])

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
        const currentPath = `${window.location.pathname}${window.location.search}`
        window.location.href = `/login?redirect_to=${encodeURIComponent(currentPath)}`
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, auth_id, display_name, bio, twitter_handle, skills, portfolio_urls')
        .eq('auth_id', authUser.id)
        .single()

      if (profileError || !profile) {
        setError('ユーザー情報の取得に失敗しました')
        setLoading(false)
        return
      }

      setCurrentUser(profile as UserProfile)

      const { data: categoryRows, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, parent_category, sort_order')
        .order('sort_order', { ascending: true })
        .order('parent_category', { ascending: true })
        .order('name', { ascending: true })

      if (categoriesError) {
        setError(categoriesError.message || '品目一覧の取得に失敗しました')
        setLoading(false)
        return
      }

      setCategoryOptions((categoryRows || []) as CategoryOption[])

      const { data: skillTagRows, error: skillTagError } = await supabase
        .from('skill_tags')
        .select('id, name, parent_category')
        .order('name', { ascending: true })

      if (skillTagError) {
        console.error('スキルサブカテゴリ一覧の取得に失敗しました', skillTagError)
        setAllSkillTags([])
      } else {
        setAllSkillTags((skillTagRows || []) as SkillTag[])
      }

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
          is_multi_step,
          total_steps,
          order_type,
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

      const { data: openStepRows, error: openStepsError } = await supabase
        .from('order_steps')
        .select(`
          id,
          order_id,
          step_number,
          title,
          description,
          required_category_id,
          budget,
          deadline,
          creator_id,
          status,
          created_at,
          updated_at,
          categories(name),
          orders!inner(
            id,
            title,
            description,
            client_id,
            status,
            is_multi_step,
            total_steps,
            order_type,
            categories(name)
          )
        `)
        .eq('status', 'open')
        .eq('orders.status', 'open')
        .is('creator_id', null)
        .order('created_at', { ascending: false })

      if (openStepsError) {
        console.error('募集中工程の取得に失敗しました', openStepsError)
        setOpenOrderSteps([])
      } else {
        setOpenOrderSteps((openStepRows ?? []) as unknown as OrderStepListingItem[])
      }

      const { data: creatorRows, error: creatorsError } = await supabase
        .from('users')
        .select('id, display_name, bio, twitter_handle, skills, portfolio_urls, is_accepting_orders, rank')
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

      const creatorIds = filteredCreatorRows.map((creator) => creator.id)

      if (creatorIds.length === 0) {
        setCreatorCategoryMap({})
        setCreatorSkillTagMap({})
      } else {
        const { data: categoryLinks, error: categoryLinksError } = await supabase
          .from('user_categories')
          .select(`
            user_id,
            category_id,
            categories(name)
          `)
          .in('user_id', creatorIds)

        if (categoryLinksError) {
          console.error('クリエイター品目の取得に失敗しました', categoryLinksError)
          setCreatorCategoryMap({})
        } else {
          const nextMap: CreatorCategoryMap = {}

          ;(categoryLinks || []).forEach((row: any) => {
            const userId = row.user_id
            const categoryId = row.category_id

            let categoryName: string | null = null

            if (Array.isArray(row.categories)) {
              categoryName = row.categories[0]?.name || null
            } else {
              categoryName = row.categories?.name || null
            }

            if (!nextMap[userId]) {
              nextMap[userId] = { ids: [], names: [] }
            }

            if (!nextMap[userId].ids.includes(categoryId)) {
              nextMap[userId].ids.push(categoryId)
            }

            if (categoryName && !nextMap[userId].names.includes(categoryName)) {
              nextMap[userId].names.push(categoryName)
            }
          })

          setCreatorCategoryMap(nextMap)
        }

        const { data: skillLinks, error: skillLinksError } = await supabase
          .from('user_skill_tags')
          .select(`
            user_id,
            skill_tag_id,
            skill_tags (
              id,
              name,
              parent_category
            )
          `)
          .in('user_id', creatorIds)

        if (skillLinksError) {
          console.error('クリエイタースキルサブカテゴリの取得に失敗しました', skillLinksError)
          setCreatorSkillTagMap({})
        } else {
          const nextSkillMap: CreatorSkillTagMap = {}

          ;(skillLinks || []).forEach((row: any) => {
            const userId = row.user_id

            const tag = Array.isArray(row.skill_tags)
              ? row.skill_tags[0]
              : row.skill_tags

            if (!tag) return

            const tagId = tag.id || row.skill_tag_id
            const tagName = tag.name || ''
            const parentCategory = tag.parent_category || 'その他'

            if (!tagName) return

            if (!nextSkillMap[userId]) {
              nextSkillMap[userId] = {
                ids: [],
                names: [],
                parentCategories: [],
                tags: [],
              }
            }

            if (!nextSkillMap[userId].ids.includes(tagId)) {
              nextSkillMap[userId].ids.push(tagId)
            }

            if (!nextSkillMap[userId].names.includes(tagName)) {
              nextSkillMap[userId].names.push(tagName)
            }

            if (!nextSkillMap[userId].parentCategories.includes(parentCategory)) {
              nextSkillMap[userId].parentCategories.push(parentCategory)
            }

            const alreadyExists = nextSkillMap[userId].tags.some(
              (existingTag) => existingTag.id === tagId
            )

            if (!alreadyExists) {
              nextSkillMap[userId].tags.push({
                id: tagId,
                name: tagName,
                parent_category: parentCategory,
              })
            }
          })

          setCreatorSkillTagMap(nextSkillMap)
        }
      }

      const { data: listingRows, error: listingsError } = await supabase
        .from('product_listings')
        .select(`
          id,
          seller_user_id,
          title,
          description,
          price,
          image_urls,
          status,
          created_at,
          categories(name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (listingsError) {
        setError(listingsError.message || '作品一覧の取得に失敗しました')
        setLoading(false)
        return
      }

      const activeListings = (listingRows ?? []) as unknown as ListingItem[]
      setListings(activeListings)

      const sellerIds = [
        ...new Set(activeListings.map((listing) => listing.seller_user_id).filter(Boolean)),
      ]

      if (sellerIds.length > 0) {
        const { data: sellerRows, error: sellersError } = await supabase
          .from('users')
          .select('id, display_name, twitter_handle')
          .in('id', sellerIds)

        if (sellersError) {
          setError(sellersError.message || '出品者情報の取得に失敗しました')
          setLoading(false)
          return
        }

        const nextSellerMap: SellerMap = {}

        ;(sellerRows || []).forEach((seller: any) => {
          nextSellerMap[seller.id] = {
            display_name: seller.display_name || null,
            twitter_handle: seller.twitter_handle || null,
          }
        })

        setSellerMap(nextSellerMap)
      }
    } catch (err: any) {
      setError(err?.message || '読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = (target: { categories?: CategoryValue }) => {
    if (!target.categories) return '未分類'
    if (Array.isArray(target.categories)) {
      return target.categories[0]?.name || '未分類'
    }
    return target.categories.name || '未分類'
  }

  const getSkillText = (
    target: { skills?: string[] | string | null } | CreatorItem | UserProfile
  ) => {
    if (!target.skills) return '未設定'
    if (Array.isArray(target.skills)) {
      return target.skills.filter(Boolean).join(' / ') || '未設定'
    }
    return String(target.skills)
  }

  const getFirstPortfolioUrl = (
    target: { portfolio_urls?: string[] | string | null } | CreatorItem | UserProfile
  ) => {
    if (!target.portfolio_urls) return null
    if (Array.isArray(target.portfolio_urls)) {
      return target.portfolio_urls[0] || null
    }
    return String(target.portfolio_urls)
  }

  const getOrderDescription = (description: string | null) => {
    if (!description) return '説明はありません'
    if (description.length <= 120) return description
    return `${description.slice(0, 120)}...`
  }

  const getListingDescription = (description: string | null) => {
    if (!description) return '説明はありません'
    if (description.length <= 100) return description
    return `${description.slice(0, 100)}...`
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

  const getOrderTypeChip = (
    orderType?: 'simple' | 'standard' | 'multi_step' | 'competition' | null,
    isMultiStep?: boolean | null
  ) => {
    const normalizedType = orderType || (isMultiStep ? 'multi_step' : 'standard')

    if (normalizedType === 'simple') {
      return {
        label: 'かんたん依頼',
        className: 'bg-blue-50 text-blue-700 border border-blue-100',
      }
    }

    if (normalizedType === 'multi_step') {
      return {
        label: '工程管理依頼',
        className: 'bg-purple-50 text-purple-700 border border-purple-100',
      }
    }

    if (normalizedType === 'competition') {
      return {
        label: 'コンペ依頼',
        className: 'bg-pink-50 text-pink-700 border border-pink-100',
      }
    }

    return {
      label: '通常依頼',
      className: 'bg-gray-100 text-gray-700 border border-gray-200',
    }
  }

  const getCreatorRankChip = (rank?: 'growth' | 'standard' | 'prime' | null) => {
    if (rank === 'prime') {
      return {
        label: 'プライム',
        className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      }
    }

    if (rank === 'standard') {
      return {
        label: 'スタンダード',
        className: 'bg-blue-100 text-blue-700 border border-blue-200',
      }
    }

    return {
      label: 'グロース',
      className: 'bg-gray-100 text-gray-600 border border-gray-200',
    }
  }

  const getCreatorCategoryNames = (userId: string) => {
    return creatorCategoryMap[userId]?.names || []
  }

  const getCreatorCategoryIds = (userId: string) => {
    return creatorCategoryMap[userId]?.ids || []
  }

  const getCreatorSkillTags = (userId: string) => {
    return creatorSkillTagMap[userId]?.tags || []
  }

  const getCreatorSkillTagNames = (userId: string) => {
    return creatorSkillTagMap[userId]?.names || []
  }

  const getCreatorSkillParentCategories = (userId: string) => {
    return creatorSkillTagMap[userId]?.parentCategories || []
  }

  const getListingImage = (imageUrls: string[] | null) => {
    if (!imageUrls || imageUrls.length === 0) return null
    return imageUrls[0]
  }

  const getMedian = (numbers: number[]) => {
    if (numbers.length === 0) return 0

    const sorted = [...numbers].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2
    }

    return sorted[middle]
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未設定'

    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return dateString

    return date.toLocaleDateString('ja-JP')
  }

  const loadListingMarketStats = async (categoryId: string) => {
    if (!categoryId) {
      setListingMarketStats(null)
      return
    }

    setListingMarketStatsLoading(true)

    try {
      const supabase = createClient()

      const since = new Date()
      since.setDate(since.getDate() - 90)

      const { data, error } = await supabase
        .from('product_purchases')
        .select('price, created_at')
        .eq('category_id', Number(categoryId))
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('作品相場取得エラー', error)
        setListingMarketStats(null)
        return
      }

      const prices = (data || [])
        .map((row: any) => Number(row.price || 0))
        .filter((price) => Number.isFinite(price) && price > 0)

      if (prices.length === 0) {
        setListingMarketStats(null)
        return
      }

      const count = prices.length
      const average = prices.reduce((sum, price) => sum + price, 0) / count
      const median = getMedian(prices)
      const min = Math.min(...prices)
      const max = Math.max(...prices)

      setListingMarketStats({
        count,
        average,
        median,
        min,
        max,
      })
    } finally {
      setListingMarketStatsLoading(false)
    }
  }

  useEffect(() => {
    loadListingMarketStats(listingCategoryId)
  }, [listingCategoryId])

  const filteredSkillTagSuggestions = useMemo(() => {
    const keyword = creatorSkillTagKeyword.trim().toLowerCase()

    const parentFiltered = creatorParentCategory
      ? allSkillTags.filter(
          (tag) => (tag.parent_category || 'その他') === creatorParentCategory
        )
      : allSkillTags

    if (!keyword) {
      return parentFiltered.slice(0, 20)
    }

    return parentFiltered
      .filter((tag) => tag.name.toLowerCase().includes(keyword))
      .slice(0, 20)
  }, [allSkillTags, creatorParentCategory, creatorSkillTagKeyword])

  const groupedCategoryOptions = useMemo(() => {
    return groupCategoriesByParent(categoryOptions)
  }, [categoryOptions])

  const orderIdsWithOpenSteps = useMemo(() => {
    return new Set(openOrderSteps.map((step) => step.order_id))
  }, [openOrderSteps])

  const filteredOpenOrderSteps = useMemo(() => {
    const parsedMinBudget = minBudget.trim() === '' ? null : Number(minBudget)
    const parsedMaxBudget = maxBudget.trim() === '' ? null : Number(maxBudget)

    return openOrderSteps.filter((step) => {
      const categoryName = getCategoryName(step)
      const parentOrder = step.orders
      const orderTitle = parentOrder?.title || ''
      const orderDescription = parentOrder?.description || ''
      const stepTitle = step.title || ''
      const stepDescription = step.description || ''
      const budget = step.budget

      const matchCategory =
        requestCategoryId === '' ||
        categoryOptions.find((cat) => cat.id === Number(requestCategoryId))?.name === categoryName

      const matchTitle =
        titleKeyword.trim() === '' ||
        orderTitle.toLowerCase().includes(titleKeyword.toLowerCase()) ||
        stepTitle.toLowerCase().includes(titleKeyword.toLowerCase())

      const matchDescription =
        descriptionKeyword.trim() === '' ||
        orderDescription.toLowerCase().includes(descriptionKeyword.toLowerCase()) ||
        stepDescription.toLowerCase().includes(descriptionKeyword.toLowerCase())

      const matchMinBudget =
        parsedMinBudget === null ||
        (typeof parsedMinBudget === 'number' &&
          !Number.isNaN(parsedMinBudget) &&
          budget !== null &&
          Number(budget) >= parsedMinBudget)

      const matchMaxBudget =
        parsedMaxBudget === null ||
        (typeof parsedMaxBudget === 'number' &&
          !Number.isNaN(parsedMaxBudget) &&
          budget !== null &&
          Number(budget) <= parsedMaxBudget)

      return (
        matchCategory &&
        matchTitle &&
        matchDescription &&
        matchMinBudget &&
        matchMaxBudget
      )
    })
  }, [
    openOrderSteps,
    requestCategoryId,
    titleKeyword,
    descriptionKeyword,
    minBudget,
    maxBudget,
    categoryOptions,
  ])

  const filteredOrders = useMemo(() => {
    const parsedMinBudget = minBudget.trim() === '' ? null : Number(minBudget)
    const parsedMaxBudget = maxBudget.trim() === '' ? null : Number(maxBudget)

    return orders
      .filter((order) => !orderIdsWithOpenSteps.has(order.id))
      .filter((order) => {
        const categoryName = getCategoryName(order)
        const title = order.title || ''
        const description = order.description || ''
        const price = order.agreed_price

        const matchCategory =
          requestCategoryId === '' ||
          categoryOptions.find((cat) => cat.id === Number(requestCategoryId))?.name === categoryName

        const matchTitle =
          titleKeyword.trim() === '' ||
          title.toLowerCase().includes(titleKeyword.toLowerCase())

        const matchDescription =
          descriptionKeyword.trim() === '' ||
          description.toLowerCase().includes(descriptionKeyword.toLowerCase())

        const matchMinBudget =
          parsedMinBudget === null ||
          (typeof parsedMinBudget === 'number' &&
            !Number.isNaN(parsedMinBudget) &&
            price !== null &&
            Number(price) >= parsedMinBudget)

        const matchMaxBudget =
          parsedMaxBudget === null ||
          (typeof parsedMaxBudget === 'number' &&
            !Number.isNaN(parsedMaxBudget) &&
            price !== null &&
            Number(price) <= parsedMaxBudget)

        return (
          matchCategory &&
          matchTitle &&
          matchDescription &&
          matchMinBudget &&
          matchMaxBudget
        )
      })
  }, [
    orders,
    orderIdsWithOpenSteps,
    requestCategoryId,
    titleKeyword,
    descriptionKeyword,
    minBudget,
    maxBudget,
    categoryOptions,
  ])

  const totalRequestListings = filteredOpenOrderSteps.length + filteredOrders.length

  const filteredCreators = useMemo(() => {
    return creators.filter((creator) => {
      const displayName = creator.display_name || ''
      const bio = creator.bio || ''
      const skillsText = getSkillText(creator)
      const creatorCategoryIds = getCreatorCategoryIds(creator.id)
      const creatorSkillTags = getCreatorSkillTags(creator.id)
      const creatorSkillTagNames = getCreatorSkillTagNames(creator.id)
      const creatorParentCategories = getCreatorSkillParentCategories(creator.id)

      const normalizedSkillTagKeyword = creatorSkillTagKeyword.trim().toLowerCase()

      const matchCategory =
        creatorCategoryId === '' ||
        creatorCategoryIds.includes(Number(creatorCategoryId))

      const matchParentCategory =
        creatorParentCategory === '' ||
        creatorParentCategories.includes(creatorParentCategory)

      const matchSkillTag =
        normalizedSkillTagKeyword === '' ||
        creatorSkillTagNames.some((name) =>
          name.toLowerCase().includes(normalizedSkillTagKeyword)
        ) ||
        creatorSkillTags.some((tag) =>
          `${tag.parent_category || 'その他'} ${tag.name}`
            .toLowerCase()
            .includes(normalizedSkillTagKeyword)
        )

      const matchName =
        creatorNameKeyword.trim() === '' ||
        displayName.toLowerCase().includes(creatorNameKeyword.toLowerCase())

      const matchBio =
        creatorBioKeyword.trim() === '' ||
        bio.toLowerCase().includes(creatorBioKeyword.toLowerCase())

      const matchSkill =
        creatorSkillKeyword.trim() === '' ||
        skillsText.toLowerCase().includes(creatorSkillKeyword.toLowerCase())

      const matchAccepting =
        !creatorAcceptingOnly || creator.is_accepting_orders !== false

      const matchPrime =
        !creatorPrimeOnly || creator.rank === 'prime'

      return (
        matchCategory &&
        matchParentCategory &&
        matchSkillTag &&
        matchName &&
        matchBio &&
        matchSkill &&
        matchAccepting &&
        matchPrime
      )
    })
  }, [
    creators,
    creatorCategoryId,
    creatorParentCategory,
    creatorSkillTagKeyword,
    creatorNameKeyword,
    creatorBioKeyword,
    creatorSkillKeyword,
    creatorAcceptingOnly,
    creatorPrimeOnly,
    creatorCategoryMap,
    creatorSkillTagMap,
  ])

  const filteredListings = useMemo(() => {
    const parsedMinPrice = listingMinPrice.trim() === '' ? null : Number(listingMinPrice)
    const parsedMaxPrice = listingMaxPrice.trim() === '' ? null : Number(listingMaxPrice)

    return listings.filter((listing) => {
      const categoryName = getCategoryName(listing)
      const title = listing.title || ''
      const price = Number(listing.price || 0)

      const categoryMatch =
        listingCategoryId === '' ||
        categoryOptions.find((cat) => cat.id === Number(listingCategoryId))?.name === categoryName

      const titleMatch =
        listingTitleKeyword.trim() === '' ||
        title.toLowerCase().includes(listingTitleKeyword.toLowerCase())

      const minPriceMatch =
        parsedMinPrice === null ||
        (!Number.isNaN(parsedMinPrice) && price >= parsedMinPrice)

      const maxPriceMatch =
        parsedMaxPrice === null ||
        (!Number.isNaN(parsedMaxPrice) && price <= parsedMaxPrice)

      return categoryMatch && titleMatch && minPriceMatch && maxPriceMatch
    })
  }, [
    listings,
    listingCategoryId,
    listingTitleKeyword,
    listingMinPrice,
    listingMaxPrice,
    categoryOptions,
  ])

  const selectedListingCategoryName =
    categoryOptions.find((cat) => cat.id === Number(listingCategoryId))?.name || ''

  const handleAccept = async (orderId: string) => {
    if (!currentUser?.id) {
      const currentPath = `${window.location.pathname}${window.location.search}`
      window.location.href = `/login?redirect_to=${encodeURIComponent(currentPath)}`
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

      await supabase.from('notifications').insert({
        user_id: targetOrder.client_id,
        type: 'order_matched',
        title: '依頼が受注されました',
        body: `「${targetOrder.title}」が受注されました。`,
        link_url: `/request/${orderId}`,
      })

      alert('依頼を受注しました')
      router.push(`/request/${orderId}`)
      router.refresh()
    } catch (err: any) {
      alert(err?.message || '受注処理中にエラーが発生しました')
    } finally {
      setAcceptingOrderId(null)
    }
  }

  const handleApplyStep = async (stepId: string) => {
    if (!currentUser?.id) {
      const currentPath = `${window.location.pathname}${window.location.search}`
      window.location.href = `/login?redirect_to=${encodeURIComponent(currentPath)}`
      return
    }

    const targetStep = openOrderSteps.find((step) => step.id === stepId)
    if (!targetStep) {
      alert('対象の工程が見つかりませんでした')
      return
    }

    const parentOrder = targetStep.orders

    if (!parentOrder) {
      alert('親依頼の情報が見つかりませんでした')
      return
    }

    if (String(parentOrder.client_id) === String(currentUser.id)) {
      alert('自分自身の依頼工程には応募できません')
      return
    }

    if (targetStep.status !== 'open' || targetStep.creator_id) {
      alert('この工程はすでに受注済み、または公開終了です')
      return
    }

    if (appliedStepIds.includes(stepId)) {
      alert('この工程にはすでに応募済みです')
      return
    }

    const applicationMessage = stepApplicationMessages[stepId]?.trim() || ''

    const confirmed = window.confirm(
      `「${parentOrder.title}」の工程「${targetStep.title}」に応募しますか？`
    )

    if (!confirmed) return

    setApplyingStepId(stepId)

    try {
      const supabase = createClient()

      const { error: insertError } = await supabase
        .from('order_step_applications')
        .insert({
          order_id: targetStep.order_id,
          order_step_id: stepId,
          applicant_id: currentUser.id,
          message: applicationMessage || null,
          status: 'pending',
        })

      if (insertError) {
        if (insertError.code === '23505') {
          alert('この工程にはすでに応募済みです')
          setAppliedStepIds((prev) => [...prev, stepId])
          return
        }
        throw insertError
      }

      await supabase.from('notifications').insert({
        user_id: parentOrder.client_id,
        type: 'order_step_application',
        title: '工程に応募が届きました',
        body: `「${parentOrder.title}」の工程「${targetStep.title}」に応募が届きました。`,
        link_url: `/request/${targetStep.order_id}`,
      })

      setAppliedStepIds((prev) => [...prev, stepId])
      alert('応募しました。依頼者からの連絡をお待ちください。')
    } catch (err: any) {
      alert(err?.message || '応募処理中にエラーが発生しました')
    } finally {
      setApplyingStepId(null)
    }
  }

  const handleCreateConsultation = async (creator: CreatorItem) => {
    if (!currentUser?.id) {
      const currentPath = `${window.location.pathname}${window.location.search}`
      window.location.href = `/login?redirect_to=${encodeURIComponent(currentPath)}`
      return
    }

    if (String(currentUser.id) === String(creator.id)) {
      alert('自分自身には相談できません')
      return
    }

    const categoryIds = getCreatorCategoryIds(creator.id)
    const consultationCategoryId = categoryIds[0] || categoryOptions[0]?.id || null

    if (!consultationCategoryId) {
      alert('相談用の品目を設定できませんでした。品目データを確認してください。')
      return
    }

    setCreatingConsultationCreatorId(creator.id)

    try {
      const supabase = createClient()
      const creatorName = creator.display_name || 'クリエイター'

      const { data: newOrder, error: insertError } = await supabase
        .from('orders')
        .insert({
          client_id: currentUser.id,
          creator_id: creator.id,
          category_id: consultationCategoryId,
          title: `${creatorName}への事前相談`,
          description:
            '事前相談用の下書きです。依頼内容・予算・納期などをチャットで相談してください。',
          agreed_price: 0,
          deadline: null,
          specification: {
            type: 'creator_consultation',
            creator_id: creator.id,
          },
          status: 'draft',
        })
        .select('id')
        .single()

      if (insertError) throw insertError
      if (!newOrder?.id) throw new Error('相談用依頼の作成に失敗しました')

      router.push(`/request/${newOrder.id}`)
    } catch (err: any) {
      alert('相談の開始に失敗しました: ' + (err?.message || '不明なエラー'))
    } finally {
      setCreatingConsultationCreatorId(null)
    }
  }

  const handleBuyListing = async (listingId: string) => {
    if (!currentUser?.id) {
      const currentPath = `${window.location.pathname}${window.location.search}`
      window.location.href = `/login?redirect_to=${encodeURIComponent(currentPath)}`
      return
    }

    const targetListing = listings.find((listing) => listing.id === listingId)
    if (!targetListing) {
      alert('対象の作品が見つかりませんでした')
      return
    }

    if (targetListing.seller_user_id === currentUser.id) {
      alert('自分の作品は購入できません')
      return
    }

    if (targetListing.status !== 'active') {
      alert('この作品は現在購入できません')
      return
    }

    const confirmed = window.confirm(`「${targetListing.title}」を購入しますか？`)
    if (!confirmed) return

    setBuyingListingId(listingId)

    try {
      const supabase = createClient()

      const { error: purchaseError } = await supabase
        .from('product_purchases')
        .insert({
          listing_id: targetListing.id,
          buyer_user_id: currentUser.id,
          price: targetListing.price,
          category_id:
            categoryOptions.find((cat) => cat.name === getCategoryName(targetListing))?.id || null,
          status: 'completed',
        })

      if (purchaseError) throw purchaseError

      const { error: listingUpdateError } = await supabase
        .from('product_listings')
        .update({
          status: 'sold',
        })
        .eq('id', listingId)
        .eq('status', 'active')

      if (listingUpdateError) throw listingUpdateError

      await supabase.from('notifications').insert({
        user_id: targetListing.seller_user_id,
        type: 'listing_purchased',
        title: '作品が購入されました',
        body: `「${targetListing.title}」が購入されました。`,
        link_url: `/listing/${listingId}`,
      })

      alert('作品を購入しました')
      router.push(`/listing/${listingId}`)
      router.refresh()
    } catch (err: any) {
      alert(err?.message || '購入処理中にエラーが発生しました')
    } finally {
      setBuyingListingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-sm p-10 text-center text-gray-600">
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
          <div className="bg-white rounded-3xl shadow-sm p-10">
            <h1 className="text-2xl font-bold text-red-600 mb-4">表示できません</h1>
            <p className="text-gray-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 md:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-4">
                <span>Exchange</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900">
                依頼・クリエイター・作品を探す
              </h1>
              <p className="mt-3 text-gray-600 text-base md:text-lg leading-8 max-w-3xl">
                公開依頼、募集中工程、受付中クリエイター、作品マーケットをまとめて確認できます。
                まずは依頼を探すか、頼みたい相手を探してください。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/request/new"
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold shadow-sm transition"
              >
                新しい依頼を作成
              </Link>

              <Link
                href="/mypage"
                className="inline-flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 px-5 py-3 rounded-2xl font-bold text-gray-700 transition"
              >
                マイページへ戻る
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-sm font-bold text-blue-900">依頼一覧</p>
              <p className="text-xs text-blue-700 leading-5 mt-1">
                募集中の制作案件・工程を探す
              </p>
            </div>
            <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4">
              <p className="text-sm font-bold text-purple-900">クリエイター一覧</p>
              <p className="text-xs text-purple-700 leading-5 mt-1">
                受付中の依頼先候補を探す
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
              <p className="text-sm font-bold text-emerald-900">作品マーケット</p>
              <p className="text-xs text-emerald-700 leading-5 mt-1">
                完成済み作品を探す
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-2 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-5 py-4 rounded-2xl font-bold transition text-left ${
                activeTab === 'requests'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="block">依頼一覧</span>
              <span className={`block text-xs mt-1 ${activeTab === 'requests' ? 'text-blue-100' : 'text-gray-500'}`}>
                {totalRequestListings}件
              </span>
            </button>

            <button
              onClick={() => setActiveTab('creators')}
              className={`px-5 py-4 rounded-2xl font-bold transition text-left ${
                activeTab === 'creators'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="block">クリエイター一覧</span>
              <span className={`block text-xs mt-1 ${activeTab === 'creators' ? 'text-blue-100' : 'text-gray-500'}`}>
                {filteredCreators.length}人
              </span>
            </button>

            <button
              onClick={() => setActiveTab('listings')}
              className={`px-5 py-4 rounded-2xl font-bold transition text-left ${
                activeTab === 'listings'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="block">作品マーケット</span>
              <span className={`block text-xs mt-1 ${activeTab === 'listings' ? 'text-blue-100' : 'text-gray-500'}`}>
                {filteredListings.length}件
              </span>
            </button>
          </div>
        </div>

        {activeTab === 'requests' ? (
          <>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 md:p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm font-bold text-blue-600 mb-2">Search</p>
                  <h2 className="text-2xl font-bold">依頼・工程を検索</h2>
                  <p className="text-sm text-gray-500 mt-2 leading-6">
                    募集中工程・公開依頼をカテゴリ・タイトル・説明文・予算から絞り込めます。
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="inline-flex justify-center rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600">
                    表示中 {totalRequestListings} 件
                  </span>
                  <Link
                    href="/request/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-bold transition text-center"
                  >
                    新しい依頼を作成
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    カテゴリ
                  </label>
                  <select
                    value={requestCategoryId}
                    onChange={(e) => setRequestCategoryId(e.target.value)}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  >
                    <option value="">すべて</option>
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
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
                  <label className="block text-sm font-bold text-gray-600 mb-2">
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

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    最低金額
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    placeholder="例: 10000"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    最高金額
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="例: 50000"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>

            {totalRequestListings === 0 ? (
              <EmptyState
                icon="🔎"
                title="募集中の工程・公開依頼が見つかりません"
                message="検索条件をゆるめるか、カテゴリ・金額条件を外すと表示される場合があります。依頼者側なら、新しい依頼を作成して市場に出してみましょう。"
                actionLabel="新しい依頼を作成"
                actionHref="/request/new"
                secondaryLabel="条件なしで見る"
                secondaryHref="/exchange?tab=requests"
              />
            ) : (
              <div className="grid gap-6">
                {filteredOpenOrderSteps.map((step) => {
                  const parentOrder = step.orders
                  const isOwnOrder =
                    currentUser?.id && parentOrder?.client_id === currentUser.id
                  const categoryName = getCategoryName(step)
                  const typeChip = getOrderTypeChip(
                    step.orders?.order_type,
                    step.orders?.is_multi_step
                  )

                  return (
                    <div
                      key={step.id}
                      className="bg-white rounded-3xl shadow-sm p-5 md:p-8 border border-blue-100 hover:shadow-xl transition-shadow"
                    >
                      <div className="flex flex-col xl:flex-row xl:items-stretch gap-8">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-5">
                            <span
                              className={`inline-flex px-4 py-1.5 rounded-full text-sm font-medium ${typeChip.className}`}
                            >
                              {typeChip.label}
                            </span>

                            <span className="inline-flex px-4 py-1.5 rounded-full bg-blue-600 text-white text-sm font-medium">
                              工程募集
                            </span>

                            <span className="inline-flex px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                              {categoryName}
                            </span>

                            {parentOrder?.is_multi_step && (
                              <span className="inline-flex px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-medium border border-purple-100">
                                全{parentOrder.total_steps || '?'}工程中 {step.step_number}工程目
                              </span>
                            )}
                          </div>

                          <Link href={`/request/${step.order_id}`} className="block">
                            <p className="text-sm text-gray-500 mb-2">
                              親依頼：{parentOrder?.title || '依頼名未設定'}
                            </p>
                            <h3 className="text-3xl font-bold mb-3 hover:text-blue-600 transition">
                              工程{step.step_number}：{step.title}
                            </h3>
                          </Link>

                          <p className="text-gray-700 leading-8 text-base whitespace-pre-wrap">
                            {getOrderDescription(step.description || parentOrder?.description || null)}
                          </p>

                          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-2xl p-4">
                              <p className="text-xs text-gray-500 mb-1">工程納期</p>
                              <p className="font-bold text-gray-900">
                                {formatDate(step.deadline)}
                              </p>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4">
                              <p className="text-xs text-gray-500 mb-1">親依頼ステータス</p>
                              <p className="font-bold text-gray-900">
                                {parentOrder?.status === 'open' ? '公開中' : parentOrder?.status || '不明'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="w-full xl:w-80 shrink-0 flex flex-col">
                          <div className="bg-blue-50 rounded-3xl p-6 mb-4 border border-blue-100">
                            <p className="text-sm text-blue-600 mb-2">工程予算</p>
                            <p className="text-4xl font-bold text-blue-600 tracking-tight">
                              {step.budget !== null && Number(step.budget) > 0
                                ? `¥${Number(step.budget).toLocaleString()}`
                                : '未設定'}
                            </p>
                          </div>

                          <div className="space-y-3 mt-auto">
                            <button
                              onClick={() => handleApplyStep(step.id)}
                              disabled={!!isOwnOrder || applyingStepId === step.id || appliedStepIds.includes(step.id)}
                              className={`w-full py-4 rounded-2xl font-medium text-white shadow-sm transition ${
                                isOwnOrder
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : appliedStepIds.includes(step.id)
                                    ? 'bg-green-500 cursor-not-allowed'
                                    : applyingStepId === step.id
                                      ? 'bg-gray-400 cursor-not-allowed'
                                      : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              {isOwnOrder
                                ? '自分の依頼工程です'
                                : appliedStepIds.includes(step.id)
                                  ? '応募済み ✓'
                                  : applyingStepId === step.id
                                    ? '応募中...'
                                    : 'この工程に応募する'}
                            </button>

                            <Link
                              href={`/request/${step.order_id}`}
                              className="block w-full text-center border border-gray-200 hover:bg-gray-50 py-4 rounded-2xl font-medium transition"
                            >
                              依頼全体を見る
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {filteredOrders.map((order) => {
                  const isOwnOrder = currentUser?.id === order.client_id
                  const canAccept =
                    order.status === 'open' &&
                    !order.creator_id &&
                    !isOwnOrder
                  const statusChip = getOrderStatusChip(order)
                  const typeChip = getOrderTypeChip(order.order_type, order.is_multi_step)

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-3xl shadow-sm p-5 md:p-8 border border-gray-100 hover:shadow-xl transition-shadow"
                    >
                      <div className="flex flex-col xl:flex-row xl:items-stretch gap-8">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-5">
                            <span
                              className={`inline-flex px-4 py-1.5 rounded-full text-sm font-medium ${typeChip.className}`}
                            >
                              {typeChip.label}
                            </span>

                            <span className="inline-flex px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                              {getCategoryName(order)}
                            </span>

                            <span
                              className={`inline-flex px-4 py-1.5 rounded-full text-sm font-medium ${statusChip.className}`}
                            >
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
        ) : activeTab === 'creators' ? (
          <>
            {currentUser && (
              <div className="bg-white rounded-3xl shadow-sm p-8 mb-8 border border-blue-100">
                <div className="flex flex-col xl:flex-row xl:items-stretch gap-8">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-2xl shadow-inner">
                        👤
                      </div>

                      <div>
                        <div className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-2">
                          あなたのプロフィール
                        </div>
                        <h3 className="text-2xl font-bold">
                          {currentUser.display_name || '名称未設定'}
                        </h3>
                        <p className="text-gray-500">
                          @{currentUser.twitter_handle || '未設定'}
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-gray-500 mb-2">自己紹介</p>
                      <p className="text-gray-700 leading-8 whitespace-pre-wrap">
                        {currentUser.bio || '自己紹介は未設定です'}
                      </p>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-gray-500 mb-2">納品できる品目</p>
                      <div className="flex flex-wrap gap-2">
                        {getCreatorCategoryNames(currentUser.id).length > 0 ? (
                          getCreatorCategoryNames(currentUser.id).map((name) => (
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

                    <div className="mb-6">
                      <p className="text-sm text-gray-500 mb-2">スキルサブカテゴリ</p>
                      <div className="flex flex-wrap gap-2">
                        {getCreatorSkillTags(currentUser.id).length > 0 ? (
                          getCreatorSkillTags(currentUser.id).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-medium border border-purple-100"
                            >
                              {tag.parent_category || 'その他'}：{tag.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">未設定</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-2">補足スキル・得意領域</p>
                      <p className="text-gray-700">{getSkillText(currentUser)}</p>
                    </div>
                  </div>

                  <div className="w-full xl:w-80 shrink-0 flex flex-col">
                    <div className="bg-gray-50 rounded-3xl p-6 mb-4 border border-gray-100">
                      <p className="text-sm text-gray-500 mb-2">プロフィール状況</p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">プロフィール閲覧</span>
                          <span className="font-semibold text-gray-900">今後追加予定</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">価格表確認</span>
                          <span className="font-semibold text-gray-900">導線あり</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mt-auto">
                      <Link
                        href={`/creator/${currentUser.id}`}
                        className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-medium transition shadow-sm"
                      >
                        自分の価格表を見る
                      </Link>

                      {getFirstPortfolioUrl(currentUser) ? (
                        <a
                          href={getFirstPortfolioUrl(currentUser) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center border border-gray-200 hover:bg-gray-50 py-4 rounded-2xl font-medium transition"
                        >
                          自分のポートフォリオを見る
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
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 md:p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm font-bold text-blue-600 mb-2">Search</p>
                  <h2 className="text-2xl font-bold">クリエイターを検索</h2>
                  <p className="text-sm text-gray-500 mt-2 leading-6">
                    品目・スキルサブカテゴリ・表示名・自己紹介から探せます。
                  </p>
                </div>
                <div className="inline-flex justify-center rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600">
                  表示中 {filteredCreators.length} 人
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    納品できる品目
                  </label>
                  <select
                    value={creatorCategoryId}
                    onChange={(e) => setCreatorCategoryId(e.target.value)}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  >
                    <option value="">すべて</option>
                    {groupedCategoryOptions.map((group) => (
                      <optgroup key={group.parentCategory} label={group.parentCategory}>
                        {group.items.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    大カテゴリ
                  </label>
                  <select
                    value={creatorParentCategory}
                    onChange={(e) => {
                      setCreatorParentCategory(e.target.value)
                      setCreatorSkillTagKeyword('')
                      setCreatorSkillTagDropdownOpen(false)
                    }}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  >
                    <option value="">すべて</option>
                    {PARENT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative" ref={creatorSkillTagSearchRef}>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    サブカテゴリ
                  </label>

                  <input
                    type="text"
                    value={creatorSkillTagKeyword}
                    onFocus={() => setCreatorSkillTagDropdownOpen(true)}
                    onChange={(e) => {
                      setCreatorSkillTagKeyword(e.target.value)
                      setCreatorSkillTagDropdownOpen(true)
                    }}
                    placeholder="例: ボカロ曲"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-blue-200"
                  />

                  {creatorSkillTagKeyword && (
                    <button
                      type="button"
                      onClick={() => {
                        setCreatorSkillTagKeyword('')
                        setCreatorSkillTagDropdownOpen(false)
                      }}
                      className="absolute right-4 top-[44px] text-gray-400 hover:text-gray-700 text-sm"
                    >
                      ×
                    </button>
                  )}

                  {creatorSkillTagDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-sm z-50 max-h-72 overflow-y-auto p-2">
                      {filteredSkillTagSuggestions.length > 0 ? (
                        filteredSkillTagSuggestions.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              setCreatorSkillTagKeyword(tag.name)
                              setCreatorSkillTagDropdownOpen(false)
                            }}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 transition"
                          >
                            <div className="font-medium text-gray-900">{tag.name}</div>
                            <div className="text-xs text-gray-500">
                              {tag.parent_category || 'その他'}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-4 text-sm text-gray-500">
                          該当するタグがありません
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
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
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    自己紹介
                  </label>
                  <input
                    type="text"
                    value={creatorBioKeyword}
                    onChange={(e) => setCreatorBioKeyword(e.target.value)}
                    placeholder="例: イラスト"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    補足スキル
                  </label>
                  <input
                    type="text"
                    value={creatorSkillKeyword}
                    onChange={(e) => setCreatorSkillKeyword(e.target.value)}
                    placeholder="例: レトロ調"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    受付状況
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreatorAcceptingOnly((prev) => !prev)}
                    className={`w-full border rounded-2xl px-4 py-3 text-left font-medium transition ${
                      creatorAcceptingOnly
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {creatorAcceptingOnly ? '受付中のみ ✓' : 'すべて表示'}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    ランク
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreatorPrimeOnly((prev) => !prev)}
                    className={`w-full border rounded-2xl px-4 py-3 text-left font-medium transition ${
                      creatorPrimeOnly
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {creatorPrimeOnly ? 'プライムのみ ✓' : 'すべて表示'}
                  </button>
                </div>
              </div>
            </div>

            {filteredCreators.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm p-14 text-center">
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
                  const categoryNames = getCreatorCategoryNames(creator.id)
                  const skillTags = getCreatorSkillTags(creator.id)

                  return (
                    <div
                      key={creator.id}
                      className="bg-white rounded-3xl shadow-sm p-5 md:p-8 border border-gray-100 hover:shadow-xl transition-shadow"
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
                              <div className="mt-2 flex flex-wrap gap-2">
                                {(() => {
                                  const rankChip = getCreatorRankChip(creator.rank)
                                  return (
                                    <span
                                      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${rankChip.className}`}
                                    >
                                      {rankChip.label}
                                    </span>
                                  )
                                })()}

                                {creator.is_accepting_orders === false ? (
                                  <span className="inline-flex px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                                    受付停止中
                                  </span>
                                ) : (
                                  <span className="inline-flex px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                    依頼受付中
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-2">自己紹介</p>
                            <p className="text-gray-700 leading-8 whitespace-pre-wrap">
                              {creator.bio || '自己紹介は未設定です'}
                            </p>
                          </div>

                          <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-2">納品できる品目</p>
                            <div className="flex flex-wrap gap-2">
                              {categoryNames.length > 0 ? (
                                categoryNames.map((name) => (
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

                          <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-2">スキルサブカテゴリ</p>
                            <div className="flex flex-wrap gap-2">
                              {skillTags.length > 0 ? (
                                skillTags.map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="inline-flex px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-medium border border-purple-100"
                                  >
                                    {tag.parent_category || 'その他'}：{tag.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-500">未設定</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500 mb-2">補足スキル・得意領域</p>
                            <p className="text-gray-700">{getSkillText(creator)}</p>
                          </div>
                        </div>

                        <div className="w-full xl:w-80 shrink-0 flex flex-col">
                          <div className="bg-gray-50 rounded-3xl p-6 mb-4 border border-gray-100">
                            <p className="text-sm text-gray-500 mb-2">プロフィール導線</p>
                            <p className="text-lg font-semibold text-gray-900">
                              価格表・相談・指名依頼へ進めます
                            </p>
                          </div>

                          <div className="space-y-3 mt-auto">
                            <Link
                              href={`/creator/${creator.id}`}
                              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-medium transition shadow-sm"
                            >
                              価格表を見る
                            </Link>

                            {creator.is_accepting_orders === false ? (
                              <div className="block w-full text-center border border-gray-200 text-gray-500 bg-gray-50 py-4 rounded-2xl font-medium">
                                受付停止中
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleCreateConsultation(creator)}
                                  disabled={creatingConsultationCreatorId === creator.id}
                                  className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white py-4 rounded-2xl font-medium transition shadow-sm"
                                >
                                  {creatingConsultationCreatorId === creator.id
                                    ? '相談を作成中...'
                                    : 'このクリエイターに相談する'}
                                </button>

                                <Link
                                  href={`/request/new?creator_id=${creator.id}`}
                                  className="block w-full text-center bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 py-4 rounded-2xl font-medium transition"
                                >
                                  このクリエイターに依頼する
                                </Link>
                              </>
                            )}

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
        ) : (
          <>
            <ProductMarketStatsCard
              selectedCategoryName={selectedListingCategoryName}
              stats={listingMarketStats}
              loading={listingMarketStatsLoading}
            />

            <div className="bg-white rounded-3xl shadow-sm p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">作品を検索</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    既製品をカテゴリ・タイトル・価格帯から探せます
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    表示中 {filteredListings.length} 件
                  </span>
                  <Link
                    href="/listing/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-medium transition"
                  >
                    作品を出品する
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    カテゴリ
                  </label>
                  <select
                    value={listingCategoryId}
                    onChange={(e) => setListingCategoryId(e.target.value)}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  >
                    <option value="">すべての品目</option>
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={listingTitleKeyword}
                    onChange={(e) => setListingTitleKeyword(e.target.value)}
                    placeholder="例: オリジナル曲"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    最低価格
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={listingMinPrice}
                    onChange={(e) => setListingMinPrice(e.target.value)}
                    placeholder="例: 1000"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    最高価格
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={listingMaxPrice}
                    onChange={(e) => setListingMaxPrice(e.target.value)}
                    placeholder="例: 50000"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>

            {filteredListings.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm p-14 text-center">
                <div className="text-5xl mb-4">🛍</div>
                <h3 className="text-xl font-bold mb-2">条件に合う作品がありません</h3>
                <p className="text-gray-500">
                  検索条件を変えると、表示される場合があります
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredListings.map((listing) => {
                  const isOwnListing = currentUser?.id === listing.seller_user_id
                  const imageUrl = getListingImage(listing.image_urls)
                  const seller = sellerMap[listing.seller_user_id]

                  return (
                    <div
                      key={listing.id}
                      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      <Link href={`/listing/${listing.id}`} className="block">
                        <div className="w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={listing.title}
                              className="w-full h-full object-cover hover:scale-[1.02] transition"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                              画像なし
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="p-6">
                        <div className="text-sm text-gray-500 mb-2">
                          {getCategoryName(listing)}
                        </div>

                        <Link href={`/listing/${listing.id}`} className="block">
                          <h3 className="text-2xl font-bold mb-3 hover:text-blue-600 transition">
                            {listing.title}
                          </h3>
                        </Link>

                        <p className="text-gray-600 text-sm leading-7 mb-4">
                          {getListingDescription(listing.description)}
                        </p>

                        <div className="text-sm text-gray-500 mb-4">
                          出品者：{seller?.display_name || '不明'}
                        </div>

                        <div className="text-3xl font-bold text-blue-600 mb-5">
                          ¥{Number(listing.price || 0).toLocaleString()}
                        </div>

                        <div className="space-y-3">
                          <button
                            onClick={() => handleBuyListing(listing.id)}
                            disabled={isOwnListing || buyingListingId === listing.id}
                            className={`w-full py-4 rounded-2xl font-medium text-white shadow-sm transition ${
                              isOwnListing || buyingListingId === listing.id
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {isOwnListing
                              ? '自分の出品です'
                              : buyingListingId === listing.id
                                ? '購入中...'
                                : 'この作品を購入する'}
                          </button>

                          <Link
                            href={`/listing/${listing.id}`}
                            className="block w-full text-center border border-gray-200 hover:bg-gray-50 py-4 rounded-2xl font-medium transition"
                          >
                            詳細を見る
                          </Link>
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

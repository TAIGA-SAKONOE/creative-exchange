'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  id: string | null
  name: string
  parent_category: string | null
  created_by?: string | null
}

type PortfolioWork = {
  id: string | null
  title: string
  description: string
  category_id: number | null
  image_urls: string[]
  external_url: string
  price: string
  is_public: boolean
  sort_order: number
  imageFiles: File[]
  imagePreviewUrls: string[]
  isNew: boolean
  isDeleted: boolean
}

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

const createEmptyWork = (): PortfolioWork => ({
  id: null,
  title: '',
  description: '',
  category_id: null,
  image_urls: [],
  external_url: '',
  price: '',
  is_public: true,
  sort_order: 0,
  imageFiles: [],
  imagePreviewUrls: [],
  isNew: true,
  isDeleted: false,
})

export default function ProfileEdit() {
  const [user, setUser] = useState<any>(null)
  const [profileId, setProfileId] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [portfolioText, setPortfolioText] = useState('')

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const [portfolioWorks, setPortfolioWorks] = useState<PortfolioWork[]>([])

  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])

  const [allSkillTags, setAllSkillTags] = useState<SkillTag[]>([])
  const [selectedSkillTags, setSelectedSkillTags] = useState<SkillTag[]>([])
  const [parentCategory, setParentCategory] = useState('音楽')
  const [skillTagKeyword, setSkillTagKeyword] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      setUser(user)

      const { data: categoryRows, error: categoryError } = await supabase
        .from('categories')
        .select('id, name, parent_category, sort_order')
        .order('sort_order', { ascending: true })
        .order('parent_category', { ascending: true })
        .order('name', { ascending: true })

      if (categoryError) {
        console.error('categories取得エラー:', categoryError)
      } else {
        setCategories((categoryRows || []) as CategoryOption[])
      }

      const { data: tagRows, error: tagError } = await supabase
        .from('skill_tags')
        .select('id, name, parent_category, created_by')
        .order('name', { ascending: true })

      if (tagError) {
        console.error('skill_tags取得エラー:', tagError)
      } else {
        setAllSkillTags((tagRows || []) as SkillTag[])
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (profile) {
        setProfileId(profile.id)
        setDisplayName(profile.display_name || user.user_metadata?.name || '')
        setBio(profile.bio || '')
        setAvatarUrl(profile.avatar_url || null)
        if (profile.avatar_url) {
          setAvatarPreview(profile.avatar_url)
        }

        if (Array.isArray(profile.skills)) {
          setSkillsText(profile.skills.join('\n'))
        } else if (profile.skills) {
          setSkillsText(String(profile.skills))
        }

        if (Array.isArray(profile.portfolio_urls)) {
          setPortfolioText(profile.portfolio_urls.join('\n'))
        } else if (profile.portfolio_urls) {
          setPortfolioText(String(profile.portfolio_urls))
        }

        const { data: categoryLinks } = await supabase
          .from('user_categories')
          .select('category_id')
          .eq('user_id', profile.id)

        setSelectedCategoryIds((categoryLinks || []).map((row: any) => row.category_id))

        const { data: userSkillRows, error: userSkillError } = await supabase
          .from('user_skill_tags')
          .select(`
            skill_tag_id,
            skill_tags (
              id,
              name,
              parent_category,
              created_by
            )
          `)
          .eq('user_id', profile.id)

        if (!userSkillError) {
          const normalizedTags: SkillTag[] = (userSkillRows || [])
            .map((row: any) => {
              const tag = Array.isArray(row.skill_tags) ? row.skill_tags[0] : row.skill_tags
              if (!tag) return null
              return {
                id: tag.id,
                name: tag.name,
                parent_category: tag.parent_category || null,
                created_by: tag.created_by || null,
              }
            })
            .filter(Boolean) as SkillTag[]
          setSelectedSkillTags(normalizedTags)
        }

        // ポートフォリオ作品を取得
        const { data: workRows, error: workError } = await supabase
          .from('portfolio_works')
          .select('*')
          .eq('user_id', profile.id)
          .order('sort_order', { ascending: true })

        if (!workError && workRows) {
          const works: PortfolioWork[] = workRows.map((row: any) => ({
            id: row.id,
            title: row.title || '',
            description: row.description || '',
            category_id: row.category_id || null,
            image_urls: Array.isArray(row.image_urls) ? row.image_urls : [],
            external_url: row.external_url || '',
            price: row.price_range_min ? String(row.price_range_min) : '',
            is_public: row.is_public !== false,
            sort_order: row.sort_order || 0,
            imageFiles: [],
            imagePreviewUrls: Array.isArray(row.image_urls) ? row.image_urls : [],
            isNew: false,
            isDeleted: false,
          }))
          setPortfolioWorks(works)
        }
      } else {
        setDisplayName(user.user_metadata?.name || '')
      }

      setLoading(false)
    }

    loadProfile()
  }, [router])

  const normalizeLines = (value: string) => {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  const normalizeTagName = (value: string) => {
    return value.trim().replace(/\s+/g, ' ')
  }

  const groupedCategories = useMemo(() => {
    return groupCategoriesByParent(categories)
  }, [categories])

  const toggleCategory = (categoryId: number) => {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId)
      }
      return [...prev, categoryId]
    })
  }

  const selectedSkillTagNames = useMemo(() => {
    return selectedSkillTags.map((tag) => tag.name.toLowerCase())
  }, [selectedSkillTags])

  const skillTagSuggestions = useMemo(() => {
    const keyword = normalizeTagName(skillTagKeyword).toLowerCase()
    if (!keyword) return []
    return allSkillTags
      .filter((tag) => {
        const sameParent = (tag.parent_category || 'その他') === parentCategory
        const matchKeyword = tag.name.toLowerCase().includes(keyword)
        const alreadySelected = selectedSkillTagNames.includes(tag.name.toLowerCase())
        return sameParent && matchKeyword && !alreadySelected
      })
      .slice(0, 8)
  }, [allSkillTags, skillTagKeyword, parentCategory, selectedSkillTagNames])

  const addSkillTag = (tag: SkillTag) => {
    const normalizedName = normalizeTagName(tag.name)
    if (!normalizedName) return
    const alreadySelected = selectedSkillTags.some(
      (selected) => selected.name.toLowerCase() === normalizedName.toLowerCase()
    )
    if (alreadySelected) {
      setSkillTagKeyword('')
      return
    }
    setSelectedSkillTags((prev) => [
      ...prev,
      {
        id: tag.id,
        name: normalizedName,
        parent_category: tag.parent_category || parentCategory,
        created_by: tag.created_by || null,
      },
    ])
    setSkillTagKeyword('')
  }

  const addCurrentKeywordAsSkillTag = () => {
    const normalizedName = normalizeTagName(skillTagKeyword)
    if (!normalizedName) return
    const existing = allSkillTags.find(
      (tag) =>
        tag.name.toLowerCase() === normalizedName.toLowerCase() &&
        (tag.parent_category || 'その他') === parentCategory
    )
    if (existing) {
      addSkillTag(existing)
      return
    }
    addSkillTag({
      id: null,
      name: normalizedName,
      parent_category: parentCategory,
      created_by: profileId,
    })
  }

  const removeSkillTag = (tagName: string) => {
    setSelectedSkillTags((prev) =>
      prev.filter((tag) => tag.name.toLowerCase() !== tagName.toLowerCase())
    )
  }

  // アバター画像選択
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  // ポートフォリオ作品操作
  const addPortfolioWork = () => {
    if (portfolioWorks.filter((w) => !w.isDeleted).length >= 20) {
      alert('作品は最大20件まで登録できます')
      return
    }
    const newWork = createEmptyWork()
    newWork.sort_order = portfolioWorks.length
    setPortfolioWorks((prev) => [...prev, newWork])
  }

  const removePortfolioWork = (index: number) => {
    setPortfolioWorks((prev) =>
      prev.map((work, i) => {
        if (i !== index) return work
        if (work.isNew) return { ...work, isDeleted: true }
        return { ...work, isDeleted: true }
      })
    )
  }

  const updatePortfolioWork = (index: number, updates: Partial<PortfolioWork>) => {
    setPortfolioWorks((prev) =>
      prev.map((work, i) => (i === index ? { ...work, ...updates } : work))
    )
  }

  const handleWorkImageSelect = (index: number, files: FileList | null) => {
    if (!files) return
    const work = portfolioWorks[index]
    const currentCount = work.imagePreviewUrls.length
    const maxAdd = 5 - currentCount
    if (maxAdd <= 0) {
      alert('画像は最大5枚まで登録できます')
      return
    }
    const newFiles = Array.from(files).slice(0, maxAdd)
    const newPreviewUrls = newFiles.map((f) => URL.createObjectURL(f))
    updatePortfolioWork(index, {
      imageFiles: [...work.imageFiles, ...newFiles],
      imagePreviewUrls: [...work.imagePreviewUrls, ...newPreviewUrls],
    })
  }

  const removeWorkImage = (workIndex: number, imageIndex: number) => {
    const work = portfolioWorks[workIndex]
    const newPreviews = work.imagePreviewUrls.filter((_, i) => i !== imageIndex)
    const newFiles = work.imageFiles.filter((_, i) => i !== imageIndex)
    const newUrls = work.image_urls.filter((_, i) => i !== imageIndex)
    updatePortfolioWork(workIndex, {
      imagePreviewUrls: newPreviews,
      imageFiles: newFiles,
      image_urls: newUrls,
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    const supabase = createClient()

    try {
      // アバター画像をアップロード
      let savedAvatarUrl = avatarUrl
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const filePath = `${user.id}/avatar_${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(filePath, avatarFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage
          .from('profile-images')
          .getPublicUrl(filePath)
        savedAvatarUrl = publicUrl
      }

      const skills = normalizeLines(skillsText)
      const portfolioUrls = normalizeLines(portfolioText)

      const { data: savedProfile, error } = await supabase
        .from('users')
        .upsert(
          {
            auth_id: user.id,
            display_name: displayName,
            bio: bio,
            skills: skills.length > 0 ? skills : [],
            portfolio_urls: portfolioUrls.length > 0 ? portfolioUrls : [],
            avatar_url: savedAvatarUrl,
            twitter_handle: user.user_metadata?.preferred_username || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'auth_id' }
        )
        .select('id')
        .single()

      if (error || !savedProfile) {
        throw new Error(error?.message || 'プロフィール保存エラー')
      }

      const savedProfileId = savedProfile.id
      setProfileId(savedProfileId)

      // カテゴリ保存
      await supabase.from('user_categories').delete().eq('user_id', savedProfileId)
      if (selectedCategoryIds.length > 0) {
        const insertRows = selectedCategoryIds.map((categoryId) => ({
          user_id: savedProfileId,
          category_id: categoryId,
        }))
        const { error: insertCategoryError } = await supabase
          .from('user_categories')
          .insert(insertRows)
        if (insertCategoryError) throw new Error(insertCategoryError.message)
      }

      // スキルタグ保存
      const resolvedSkillTagIds: string[] = []
      for (const tag of selectedSkillTags) {
        if (tag.id) {
          resolvedSkillTagIds.push(tag.id)
          continue
        }
        const tagName = normalizeTagName(tag.name)
        if (!tagName) continue
        const { data: existingTag } = await supabase
          .from('skill_tags')
          .select('id')
          .eq('name', tagName)
          .maybeSingle()
        if (existingTag?.id) {
          resolvedSkillTagIds.push(existingTag.id)
          continue
        }
        const { data: newTag, error: newTagError } = await supabase
          .from('skill_tags')
          .insert({ name: tagName, parent_category: tag.parent_category || 'その他', created_by: savedProfileId })
          .select('id')
          .single()
        if (newTagError || !newTag) throw new Error(newTagError?.message || tagName)
        resolvedSkillTagIds.push(newTag.id)
      }
      await supabase.from('user_skill_tags').delete().eq('user_id', savedProfileId)
      if (resolvedSkillTagIds.length > 0) {
        const uniqueSkillTagIds = [...new Set(resolvedSkillTagIds)]
        const skillRows = uniqueSkillTagIds.map((skillTagId) => ({
          user_id: savedProfileId,
          skill_tag_id: skillTagId,
        }))
        const { error: insertSkillError } = await supabase.from('user_skill_tags').insert(skillRows)
        if (insertSkillError) throw new Error(insertSkillError.message)
      }

      // ポートフォリオ作品保存
      for (let i = 0; i < portfolioWorks.length; i++) {
        const work = portfolioWorks[i]

        // 削除対象
        if (work.isDeleted && work.id) {
          await supabase.from('portfolio_works').delete().eq('id', work.id)
          continue
        }
        if (work.isDeleted) continue

        // タイトルが空はスキップ
        if (!work.title.trim()) continue

        // 新規画像をアップロード
        const uploadedImageUrls: string[] = [...work.image_urls]
        for (const imageFile of work.imageFiles) {
          const ext = imageFile.name.split('.').pop()
          const filePath = `${savedProfileId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('portfolio-images')
            .upload(filePath, imageFile)
          if (uploadError) {
            console.error('画像アップロードエラー', uploadError)
            continue
          }
          const { data: { publicUrl } } = supabase.storage
            .from('portfolio-images')
            .getPublicUrl(filePath)
          uploadedImageUrls.push(publicUrl)
        }

        const workData = {
          user_id: savedProfileId,
          title: work.title.trim(),
          description: work.description.trim() || null,
          category_id: work.category_id || null,
          image_urls: uploadedImageUrls,
          external_url: work.external_url.trim() || null,
          price_range_min: work.price ? Number(work.price) : null,
          price_range_max: null,
          is_public: work.is_public,
          sort_order: i,
          updated_at: new Date().toISOString(),
        }

        if (work.id) {
          await supabase.from('portfolio_works').update(workData).eq('id', work.id)
        } else {
          await supabase.from('portfolio_works').insert({ ...workData, created_at: new Date().toISOString() })
        }
      }

      alert('プロフィールが保存されました！')
      router.push('/mypage')
    } catch (err: any) {
      alert('保存に失敗しました: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center">読み込み中...</div>

  const activeWorks = portfolioWorks.filter((w) => !w.isDeleted)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">プロフィール編集</h1>

        <form onSubmit={handleSave} className="space-y-6">

          {/* プロフィール画像 */}
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-lg font-bold mb-4">プロフィール画像</h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="アバター" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">👤</span>
                )}
              </div>
              <div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  画像を選択する
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null)
                      setAvatarPreview(null)
                      setAvatarUrl(null)
                    }}
                    className="ml-3 text-sm text-red-500 hover:text-red-700"
                  >
                    削除
                  </button>
                )}
                <p className="mt-2 text-xs text-gray-500">JPG・PNG・GIF対応。推奨：正方形</p>
              </div>
            </div>
          </div>

          {/* 基本情報 */}
          <div className="bg-white rounded-2xl shadow p-8 space-y-6">
            <h2 className="text-lg font-bold">基本情報</h2>

            <div>
              <label className="block text-sm font-medium mb-2">表示名</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="表示名を入力"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">自己紹介（Bio）</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-y"
                placeholder="簡単な自己紹介を入力してください"
              />
            </div>
          </div>

          {/* 納品できる品目 */}
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-lg font-bold mb-4">納品できる品目</h2>
            <div className="space-y-5">
              {groupedCategories.map((group) => (
                <div key={group.parentCategory} className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="font-bold text-gray-900">{group.parentCategory}</h3>
                    <span className="text-xs text-gray-500">{group.items.length}品目</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.items.map((category) => {
                      const checked = selectedCategoryIds.includes(category.id)
                      return (
                        <label
                          key={category.id}
                          className={`flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition bg-white ${
                            checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCategory(category.id)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{category.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">Exchange のクリエイター検索で使われます。</p>
          </div>

          {/* スキルサブカテゴリ */}
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-lg font-bold mb-4">スキルサブカテゴリ</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2">大カテゴリ</label>
                <select
                  value={parentCategory}
                  onChange={(e) => setParentCategory(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  {PARENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">サブカテゴリ検索・追加</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillTagKeyword}
                    onChange={(e) => setSkillTagKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCurrentKeywordAsSkillTag()
                      }
                    }}
                    className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="例：ボカロ楽曲制作"
                  />
                  <button
                    type="button"
                    onClick={addCurrentKeywordAsSkillTag}
                    className="px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-black"
                  >
                    追加
                  </button>
                </div>
              </div>
            </div>

            {skillTagSuggestions.length > 0 && (
              <div className="mb-4 bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-3">候補</p>
                <div className="flex flex-wrap gap-2">
                  {skillTagSuggestions.map((tag) => (
                    <button
                      key={tag.id || tag.name}
                      type="button"
                      onClick={() => addSkillTag(tag)}
                      className="px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-sm"
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="min-h-16 bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-3">選択済みタグ</p>
              {selectedSkillTags.length === 0 ? (
                <p className="text-sm text-gray-400">まだスキルサブカテゴリが選択されていません</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedSkillTags.map((tag) => (
                    <span
                      key={`${tag.parent_category}-${tag.name}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-sm"
                    >
                      <span>{tag.parent_category || 'その他'}：{tag.name}</span>
                      <button type="button" onClick={() => removeSkillTag(tag.name)} className="text-blue-400 hover:text-blue-700">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">例：ボカロ楽曲制作、リリックビデオ、ゲームBGMなど。</p>
          </div>

          {/* ポートフォリオ作品 */}
          <div className="bg-white rounded-2xl shadow p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold">ポートフォリオ作品</h2>
                <p className="text-sm text-gray-500 mt-1">
                  作品を登録するとクリエイタープロフィールに表示されます。最大20件。
                </p>
              </div>
              <span className="text-sm text-gray-500">{activeWorks.length} / 20件</span>
            </div>

            <div className="space-y-6">
              {portfolioWorks.map((work, index) => {
                if (work.isDeleted) return null
                return (
                  <div key={index} className="border border-gray-200 rounded-2xl p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-gray-700">作品 {activeWorks.indexOf(work) + 1}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={work.is_public}
                            onChange={(e) => updatePortfolioWork(index, { is_public: e.target.checked })}
                            className="w-4 h-4"
                          />
                          公開
                        </label>
                        <button
                          type="button"
                          onClick={() => removePortfolioWork(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          削除
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">作品タイトル <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={work.title}
                          onChange={(e) => updatePortfolioWork(index, { title: e.target.value })}
                          className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                          placeholder="作品のタイトルを入力"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">説明文</label>
                        <textarea
                          value={work.description}
                          onChange={(e) => updatePortfolioWork(index, { description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y bg-white"
                          placeholder="作品の説明・制作背景など"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">カテゴリ</label>
                          <select
                            value={work.category_id || ''}
                            onChange={(e) => updatePortfolioWork(index, { category_id: e.target.value ? Number(e.target.value) : null })}
                            className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                          >
                            <option value="">未選択</option>
                            {groupedCategories.map((group) => (
                              <optgroup key={group.parentCategory} label={group.parentCategory}>
                                {group.items.map((cat) => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 mb-1">外部リンク（X・Pixiv等）</label>
                          <input
                            type="url"
                            value={work.external_url}
                            onChange={(e) => updatePortfolioWork(index, { external_url: e.target.value })}
                            className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">作品価格（円）</label>
                        <input
                          type="number"
                          value={work.price}
                          onChange={(e) => updatePortfolioWork(index, { price: e.target.value })}
                          className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                          placeholder="例：15000"
                          min="0"
                        />
                        <p className="mt-1 text-xs text-gray-400">相場ボードの参考価格として反映されます</p>
                      </div>

                      {/* 画像アップロード */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-2">作品画像（最大5枚）</label>

                        {work.imagePreviewUrls.length > 0 && (
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {work.imagePreviewUrls.map((url, imgIndex) => (
                              <div key={imgIndex} className="relative aspect-square">
                                <img
                                  src={url}
                                  alt={`作品画像${imgIndex + 1}`}
                                  className="w-full h-full object-cover rounded-xl border border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeWorkImage(index, imgIndex)}
                                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {work.imagePreviewUrls.length < 5 && (
                          <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
                            <span>＋ 画像を追加</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => handleWorkImageSelect(index, e.target.files)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {activeWorks.length < 20 && (
              <button
                type="button"
                onClick={addPortfolioWork}
                className="mt-4 w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition font-medium"
              >
                ＋ 作品を追加する
              </button>
            )}
          </div>

          {/* 補足スキル */}
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-lg font-bold mb-4">補足スキル・得意領域</h2>
            <textarea
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-y"
              placeholder={`1行に1つずつ入力してください\n例:\n和風題字\nレトロ広告風\nボカロ文脈に強い`}
            />
            <p className="mt-2 text-sm text-gray-500">タグ化しにくい強みや得意分野を自由に書けます。</p>
          </div>

          {/* ポートフォリオURL（外部リンク） */}
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-lg font-bold mb-4">外部ポートフォリオURL</h2>
            <textarea
              value={portfolioText}
              onChange={(e) => setPortfolioText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-y"
              placeholder={`1行に1つずつURLを入力してください\n例:\nhttps://example.com/portfolio\nhttps://note.com/...`}
            />
            <p className="mt-2 text-sm text-gray-500">XやPixivなど外部サイトへのリンクを登録できます。</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-400"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </form>

        <button
          onClick={() => router.push('/mypage')}
          className="mt-6 text-gray-500 hover:text-gray-700"
        >
          ← マイページに戻る
        </button>
      </div>
    </div>
  )
}

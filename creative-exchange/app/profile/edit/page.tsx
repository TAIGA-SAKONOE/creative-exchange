'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type CategoryOption = {
  id: number
  name: string
}

type SkillTag = {
  id: string | null
  name: string
  parent_category: string | null
  created_by?: string | null
}

const PARENT_CATEGORIES = ['音楽', 'イラスト', '動画', '文章', 'その他']

export default function ProfileEdit() {
  const [user, setUser] = useState<any>(null)
  const [profileId, setProfileId] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [portfolioText, setPortfolioText] = useState('')

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

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      setUser(user)

      const { data: categoryRows } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true })

      setCategories((categoryRows || []) as CategoryOption[])

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

        if (userSkillError) {
          console.error('user_skill_tags取得エラー:', userSkillError)
        } else {
          const normalizedTags: SkillTag[] = (userSkillRows || [])
            .map((row: any) => {
              const tag = Array.isArray(row.skill_tags)
                ? row.skill_tags[0]
                : row.skill_tags

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    const supabase = createClient()

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
          twitter_handle: user.user_metadata?.preferred_username || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'auth_id',
        }
      )
      .select('id')
      .single()

    if (error || !savedProfile) {
      alert('保存に失敗しました: ' + (error?.message || 'プロフィール保存エラー'))
      setSaving(false)
      return
    }

    const savedProfileId = savedProfile.id
    setProfileId(savedProfileId)

    const { error: deleteCategoryError } = await supabase
      .from('user_categories')
      .delete()
      .eq('user_id', savedProfileId)

    if (deleteCategoryError) {
      alert('品目の更新に失敗しました: ' + deleteCategoryError.message)
      setSaving(false)
      return
    }

    if (selectedCategoryIds.length > 0) {
      const insertRows = selectedCategoryIds.map((categoryId) => ({
        user_id: savedProfileId,
        category_id: categoryId,
      }))

      const { error: insertCategoryError } = await supabase
        .from('user_categories')
        .insert(insertRows)

      if (insertCategoryError) {
        alert('品目の保存に失敗しました: ' + insertCategoryError.message)
        setSaving(false)
        return
      }
    }

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
        .insert({
          name: tagName,
          parent_category: tag.parent_category || 'その他',
          created_by: savedProfileId,
        })
        .select('id')
        .single()

      if (newTagError || !newTag) {
        alert('スキルタグの作成に失敗しました: ' + (newTagError?.message || tagName))
        setSaving(false)
        return
      }

      resolvedSkillTagIds.push(newTag.id)
    }

    const { error: deleteSkillError } = await supabase
      .from('user_skill_tags')
      .delete()
      .eq('user_id', savedProfileId)

    if (deleteSkillError) {
      alert('スキルタグの更新に失敗しました: ' + deleteSkillError.message)
      setSaving(false)
      return
    }

    if (resolvedSkillTagIds.length > 0) {
      const uniqueSkillTagIds = [...new Set(resolvedSkillTagIds)]

      const skillRows = uniqueSkillTagIds.map((skillTagId) => ({
        user_id: savedProfileId,
        skill_tag_id: skillTagId,
      }))

      const { error: insertSkillError } = await supabase
        .from('user_skill_tags')
        .insert(skillRows)

      if (insertSkillError) {
        alert('スキルタグの保存に失敗しました: ' + insertSkillError.message)
        setSaving(false)
        return
      }
    }

    alert('プロフィールが保存されました！')
    setSaving(false)
    router.push('/mypage')
  }

  if (loading) return <div className="p-8 text-center">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">プロフィール編集</h1>

        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow p-8 space-y-6">
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

          <div>
            <label className="block text-sm font-medium mb-3">納品できる品目</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((category) => {
                const checked = selectedCategoryIds.includes(category.id)

                return (
                  <label
                    key={category.id}
                    className={`flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition ${
                      checked
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
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
            <p className="mt-2 text-sm text-gray-500">
              大まかな品目です。Exchange のクリエイター検索で使われます。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">
              スキルサブカテゴリ
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  大カテゴリ
                </label>
                <select
                  value={parentCategory}
                  onChange={(e) => setParentCategory(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  {PARENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  サブカテゴリ検索・追加
                </label>
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
                <p className="text-sm text-gray-400">
                  まだスキルサブカテゴリが選択されていません
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedSkillTags.map((tag) => (
                    <span
                      key={`${tag.parent_category}-${tag.name}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-sm"
                    >
                      <span>{tag.parent_category || 'その他'}：{tag.name}</span>
                      <button
                        type="button"
                        onClick={() => removeSkillTag(tag.name)}
                        className="text-blue-400 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-2 text-sm text-gray-500">
              例：ボカロ楽曲制作、リリックビデオ、ゲームBGM、Live2D用原画など。
              候補にないものはそのまま新規タグとして追加できます。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">補足スキル・得意領域</label>
            <textarea
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-y"
              placeholder={`1行に1つずつ入力してください\n例:\n和風題字\nレトロ広告風\nボカロ文脈に強い`}
            />
            <p className="mt-2 text-sm text-gray-500">
              タグ化しにくい強みや得意分野を自由に書けます。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">ポートフォリオURL</label>
            <textarea
              value={portfolioText}
              onChange={(e) => setPortfolioText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-y"
              placeholder={`1行に1つずつURLを入力してください\n例:\nhttps://example.com/portfolio\nhttps://note.com/...`}
            />
            <p className="mt-2 text-sm text-gray-500">
              Exchange のクリエイター一覧で使われます。1行に1つずつ入力してください。
            </p>
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

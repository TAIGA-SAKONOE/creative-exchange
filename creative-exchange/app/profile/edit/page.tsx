'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type CategoryOption = {
  id: number
  name: string
}

export default function ProfileEdit() {
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [portfolioText, setPortfolioText] = useState('')
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
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

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (profile) {
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

  const toggleCategory = (categoryId: number) => {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId)
      }
      return [...prev, categoryId]
    })
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

    const profileId = savedProfile.id

    const { error: deleteError } = await supabase
      .from('user_categories')
      .delete()
      .eq('user_id', profileId)

    if (deleteError) {
      alert('品目の更新に失敗しました: ' + deleteError.message)
      setSaving(false)
      return
    }

    if (selectedCategoryIds.length > 0) {
      const insertRows = selectedCategoryIds.map((categoryId) => ({
        user_id: profileId,
        category_id: categoryId,
      }))

      const { error: insertError } = await supabase
        .from('user_categories')
        .insert(insertRows)

      if (insertError) {
        alert('品目の保存に失敗しました: ' + insertError.message)
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
              Exchange のクリエイター検索で使われます。複数選択できます。
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
              納品できる品目だけでは表しにくい強みや得意分野を自由に書けます。
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

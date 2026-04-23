'use client'

import { createClient } from '../../../../lib/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type CategoryOption = {
  id: number
  name: string
}

export default function RequestEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<any>(null)
  const [request, setRequest] = useState<any>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])

  const [selectedCategory, setSelectedCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) throw authError
      if (!user) {
        router.replace('/login')
        return
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, display_name')
        .eq('auth_id', user.id)
        .single()

      if (profileError || !userProfile) {
        setError('プロフィール情報の取得に失敗しました')
        return
      }

      setProfile(userProfile)

      const { data: categoryRows, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true })

      if (categoryError) {
        throw categoryError
      }

      setCategories((categoryRows || []) as CategoryOption[])

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

      if (orderError || !orderData) {
        setError('依頼情報の取得に失敗しました')
        return
      }

      if (String(orderData.client_id) !== String(userProfile.id)) {
        setError('この依頼を編集する権限がありません')
        return
      }

      if (!['draft', 'open'].includes(orderData.status)) {
        setError('この依頼は現在編集できません')
        return
      }

      setRequest(orderData)
      setSelectedCategory(orderData.category_id ? String(orderData.category_id) : '')
      setTitle(orderData.title || '')
      setDescription(orderData.description || '')
      setBudget(orderData.agreed_price ? String(orderData.agreed_price) : '')
      setDeadline(orderData.deadline || '')
    } catch (err: any) {
      setError(err.message || '読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile?.id || !request) return

    if (!selectedCategory || !title.trim() || !description.trim()) {
      alert('必須項目を入力してください')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          category_id: parseInt(selectedCategory, 10),
          title: title.trim(),
          description: description.trim(),
          agreed_price: budget ? parseInt(budget, 10) : null,
          deadline: deadline || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('client_id', profile.id)
        .in('status', ['draft', 'open'])

      if (updateError) {
        throw updateError
      }

      alert('依頼を更新しました')
      router.push(`/request/${id}`)
    } catch (err: any) {
      alert('依頼更新に失敗しました: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-12 text-center">読み込み中...</div>
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">編集できません</h1>
            <p className="text-gray-700">{error}</p>
            <button
              onClick={() => router.push(`/request/${id}`)}
              className="mt-6 text-gray-500 hover:text-gray-700"
            >
              ← 依頼詳細に戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={() => router.push(`/request/${id}`)}
          className="mb-6 text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          ← 依頼詳細に戻る
        </button>

        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-3xl font-bold mb-8">依頼を編集</h1>

          <form onSubmit={handleSave} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                品目
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">品目を選択してください</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                依頼タイトル
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                依頼内容
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-40 p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 resize-y"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                希望納期
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                希望予算（任意）
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-medium text-lg"
            >
              {saving ? '保存中...' : 'この内容で更新する'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

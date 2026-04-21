'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewRequest() {
  const [categories, setCategories] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadCategories = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      setCategories(data || [])
      setLoading(false)
    }

    loadCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !categoryId) {
      alert('タイトル、品目、依頼内容は必須です')
      return
    }

    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // specification に最低限の値を入れる（JSONB対応）
    const specification = {
      delivery_format: ['PNG'],     // 仮の値
      max_revisions: 3,
      commercial_use: true
    }

    const { error } = await supabase
      .from('orders')
      .insert({
        client_id: user.id,
        category_id: parseInt(categoryId),
        title,
        description,
        agreed_price: budget ? parseInt(budget) : null,
        specification,                 // ← ここを追加
        status: 'draft'
      })

    if (error) {
      alert('依頼の作成に失敗しました: ' + error.message)
      console.error(error)
    } else {
      alert('依頼を作成しました！')
      router.push('/mypage')
    }

    setSaving(false)
  }

  if (loading) return <div className="p-8 text-center">品目情報を読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">新しい依頼を作成</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">依頼タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="例: MV用一枚絵をお願いしたい"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">品目</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
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
            <label className="block text-sm font-medium mb-2">依頼内容</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-y"
              placeholder="詳細、希望納期、参考画像の説明などを書いてください"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">希望予算（任意）</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="例: 15000"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? '作成中...' : '依頼を作成する'}
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

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
      const { data } = await supabase.from('categories').select('*').order('name')
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
      alert('ログインしてください')
      router.push('/login')
      return
    }

    const { error } = await supabase.from('orders').insert({
      client_id: user.id,
      category_id: parseInt(categoryId),
      title: title.trim(),
      description: description.trim(),
      agreed_price: budget ? parseInt(budget) : null,
      specification: { note: '基本依頼' },
      status: 'draft'
    })

    if (error) {
      console.error('Insert error:', error)
      alert('依頼作成失敗: ' + error.message)
    } else {
      alert('依頼を作成しました！')
      router.push('/mypage')
    }

    setSaving(false)
  }

  if (loading) return <div className="p-12 text-center">読み込み中...</div>

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
              className="w-full px-4 py-3 border rounded-xl" 
              placeholder="依頼タイトル" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">品目</label>
            <select 
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)} 
              className="w-full px-4 py-3 border rounded-xl" 
              required
            >
              <option value="">品目を選択</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">依頼内容</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              rows={5} 
              className="w-full px-4 py-3 border rounded-xl" 
              placeholder="依頼内容" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">希望予算（任意）</label>
            <input 
              type="number" 
              value={budget} 
              onChange={(e) => setBudget(e.target.value)} 
              className="w-full px-4 py-3 border rounded-xl" 
              placeholder="例: 10000" 
            />
          </div>

          <button 
            type="submit" 
            disabled={saving} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-medium disabled:bg-gray-400"
          >
            {saving ? '作成中...' : '依頼を作成する'}
          </button>
        </form>

        <button 
          onClick={() => router.push('/mypage')} 
          className="mt-8 text-gray-500 hover:text-gray-700 block mx-auto"
        >
          ← マイページに戻る
        </button>
      </div>
    </div>
  )
}

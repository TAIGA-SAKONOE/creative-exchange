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

    try {
      // 1. usersテーブルから users.id を取得（auth_idで検索）
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (profileError || !profile) {
        alert('プロフィールが見つかりません。先にプロフィール編集を完了してください。')
        router.push('/profile/edit')
        return
      }

      // 2. ordersテーブルに挿入（client_idには users.id を使用）
      const { error } = await supabase.from('orders').insert({
        client_id: profile.id,                    // ← これが重要
        category_id: parseInt(categoryId),
        title: title.trim(),
        description: description.trim(),
        agreed_price: budget ? parseInt(budget) : null,
        specification: { note: '基本依頼' },
        status: 'draft'
      })

      if (error) {
        console.error('Orders insert error:', error)
        alert('依頼作成失敗: ' + error.message)
      } else {
        alert('依頼を作成しました！')
        router.push('/mypage')
      }
    } catch (err) {
      console.error(err)
      alert('予期せぬエラーが発生しました')
    }

    setSaving(false)
  }

    try {
      // 1. まず users テーブルに確実にレコードを作成（これが重要）
      await supabase.from('users').upsert({
        auth_id: user.id,
        display_name: user.user_metadata?.name || 'ユーザー',
        twitter_handle: user.user_metadata?.preferred_username || null,
        updated_at: new Date().toISOString()
      })

      // 2. その後 orders に挿入
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
        console.error('Orders insert error:', error)
        alert('依頼作成失敗: ' + error.message)
      } else {
        alert('依頼を作成しました！')
        router.push('/mypage')
      }
    } catch (err) {
      console.error(err)
      alert('予期せぬエラーが発生しました')
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

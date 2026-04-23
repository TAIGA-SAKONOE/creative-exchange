'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewRequest() {
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [marketStats, setMarketStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadCategories = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('カテゴリ取得エラー:', error)
      } else {
        setCategories(data || [])
      }

      setLoading(false)
    }

    loadCategories()
  }, [])

  // 品目選択時に相場を取得
  useEffect(() => {
    const fetchMarketStats = async () => {
      if (!selectedCategory) {
        setMarketStats(null)
        return
      }

      const supabase = createClient()

      const { data } = await supabase.rpc('calculate_market_stats', {
        p_category_id: parseInt(selectedCategory),
        p_days: 90
      })

      setMarketStats(data || { count: 0, median: 0, p25: 0, p75: 0 })
    }

    fetchMarketStats()
  }, [selectedCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory || !title.trim() || !description.trim()) {
      alert('必須項目を入力してください')
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインしてください')

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (!profile) throw new Error('ユーザー情報が見つかりません')

      const { error } = await supabase.from('orders').insert({
        client_id: profile.id,
        category_id: parseInt(selectedCategory),
        title: title.trim(),
        description: description.trim(),
        agreed_price: budget ? parseInt(budget) : null,
        specification: { note: '基本依頼' },
        status: 'open'
      })

      if (error) throw error

      alert('依頼を作成しました！')
      router.push('/mypage')
    } catch (err: any) {
      alert('依頼作成に失敗しました: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-12 text-center">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <button 
          onClick={() => router.push('/mypage')}
          className="mb-6 text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          ← マイページに戻る
        </button>

        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-3xl font-bold mb-8">新しい依頼を作成</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">品目</label>
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

            {/* 相場表示エリア */}
            {selectedCategory && marketStats && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <p className="text-sm text-blue-600 font-medium mb-3">この品目の相場（直近90日間）</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500">取引件数</p>
                    <p className="text-lg font-semibold">{marketStats.count}件</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">中央値</p>
                    <p className="text-xl font-bold text-blue-600">
                      ¥{Math.round(marketStats.median).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">価格帯</p>
                    <p className="text-sm">
                      ¥{Math.round(marketStats.p25).toLocaleString()} 〜 ¥{Math.round(marketStats.p75).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">依頼タイトル</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：MV用のイラストをお願いします"
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">依頼内容</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="詳細な要望、参考画像の有無、納期希望などを書いてください"
                className="w-full h-40 p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 resize-y"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">希望予算（任意）</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="例：15000"
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-medium text-lg"
            >
              {submitting ? '依頼を作成中...' : 'この内容で依頼を作成する'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

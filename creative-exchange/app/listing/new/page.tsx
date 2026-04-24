'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewListing() {
  const [categories, setCategories] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: userProfile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()
      setProfile(userProfile)

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      setCategories(cats || [])
      setLoading(false)
    }
    init()
  }, [router])

  const handleSubmit = async () => {
    if (!profile || !title.trim() || !price || !categoryId) {
      alert('タイトル、品目、価格は必須です')
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    try {
      let imageUrls: string[] = []

      if (imageFile) {
        const filePath = `listings/${profile.id}/${Date.now()}_${imageFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('deliverables')
          .upload(filePath, imageFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('deliverables')
          .getPublicUrl(filePath)
        imageUrls = [publicUrl]
      }

      const { error: insertError } = await supabase
        .from('product_listings')
        .insert({
          seller_user_id: profile.id,
          title: title.trim(),
          description: description.trim(),
          price: parseInt(price),
          category_id: parseInt(categoryId),
          image_urls: imageUrls,
          status: 'active'
        })

      if (insertError) throw insertError

      alert('作品を出品しました！')
      router.push('/listing')
    } catch (err: any) {
      alert('出品に失敗しました: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-12 text-center">読み込み中...</div>

  
  

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <button onClick={() => router.push('/listing')} className="mb-6 text-gray-500 hover:text-gray-700">
          ← 作品一覧に戻る
        </button>

        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-3xl font-bold mb-8">作品を出品する</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">タイトル *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="作品のタイトル"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">品目 *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">価格（円） *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="5000"
                min="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">説明</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y"
                placeholder="作品の説明、仕様など"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">サムネイル画像</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full text-sm"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || !price || !categoryId}
              className={`w-full py-4 rounded-xl font-medium text-lg text-white ${
                submitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? '出品中...' : '出品する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

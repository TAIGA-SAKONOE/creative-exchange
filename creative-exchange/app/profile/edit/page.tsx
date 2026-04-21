'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfileEdit() {
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      
      // 現在のユーザー取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // 既存のプロフィール情報を取得
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (profile) {
        setDisplayName(profile.display_name || '')
        setBio(profile.bio || '')
      } else {
        // 初回はauthのメタデータから名前を入れる
        setDisplayName(user.user_metadata?.name || '')
      }

      setLoading(false)
    }

    loadProfile()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)

    const supabase = createClient()

    const { error } = await supabase
      .from('users')
      .upsert({
        auth_id: user.id,
        display_name: displayName,
        bio: bio,
        twitter_handle: user.user_metadata?.preferred_username || null,
        updated_at: new Date().toISOString()
      })

    if (error) {
      alert('保存に失敗しました: ' + error.message)
    } else {
      alert('プロフィールが保存されました！')
      router.push('/mypage')
    }

    setSaving(false)
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

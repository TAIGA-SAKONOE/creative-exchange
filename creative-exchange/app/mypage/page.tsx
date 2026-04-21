'use client'

import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MyPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else {
        router.push('/login')
      }
      setLoading(false)
    }

    getUser()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">マイページ</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
          >
            ログアウト
          </button>
        </div>

        {user && (
          <div className="bg-white p-8 rounded-xl shadow">
            <p className="text-lg">
              ようこそ、<strong>{user.user_metadata?.name || user.email}</strong> さん
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Xアカウントでログイン済み
            </p>

            <div className="mt-12 text-center text-gray-400">
              <p>ここに今後、プロフィール編集や依頼作成機能が追加されます。</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

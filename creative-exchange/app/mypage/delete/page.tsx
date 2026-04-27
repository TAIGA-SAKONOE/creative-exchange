'use client'

import { createClient } from '../../../lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteAccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '本当に退会しますか？この操作は取り消せません。'
    )

    if (!confirmed) return

    setLoading(true)
    setErrorMessage(null)

    try {
      const supabase = createClient()

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        throw new Error(sessionError.message)
      }

      if (!session?.access_token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || '退会処理に失敗しました')
      }

      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setErrorMessage(err?.message || '退会処理に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/mypage"
          className="inline-flex mb-6 text-sm text-gray-500 hover:text-gray-800"
        >
          ← マイページへ戻る
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-red-100">
          <div className="mb-8">
            <p className="text-sm font-bold text-red-600 mb-3">退会手続き</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Creative Exchangeを退会する
            </h1>
            <p className="text-gray-600 leading-7">
              退会するとログインできなくなり、プロフィール情報とポートフォリオ作品は削除または匿名化されます。
              取引履歴・レビューは市場データとして匿名で保持されます。
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
              <h2 className="font-bold text-red-700 mb-3">
                退会すると以下のデータが削除されます
              </h2>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-2">
                <li>プロフィール情報</li>
                <li>ポートフォリオ作品</li>
                <li>アカウント情報</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <h2 className="font-bold text-gray-900 mb-3">
                匿名で保持されるデータ
              </h2>
              <p className="text-sm text-gray-600 leading-7">
                取引履歴・レビューは市場データとして匿名で保持されます。
                これは相場情報や信用情報の一貫性を保つためです。
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5">
              <h2 className="font-bold text-yellow-800 mb-3">
                退会できない場合
              </h2>
              <p className="text-sm text-yellow-800 leading-7">
                進行中の取引・工程がある場合は退会できません。
                取引完了またはキャンセル後に再度お試しください。
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4">
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-4 rounded-2xl font-bold"
            >
              {loading ? '退会処理中...' : '退会する'}
            </button>

            <Link
              href="/mypage"
              className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-4 rounded-2xl font-bold"
            >
              キャンセル
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Creative Exchange</h1>
      <p className="text-gray-600 mb-8">クリエイティブの証券取引所</p>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">システムステータス</h2>
        {error ? (
          <p className="text-red-600">
            DB接続エラー: {error.message}
          </p>
        ) : (
          <p className="text-green-600">
            DB接続OK — カテゴリ数: {count}件
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">認証ステータス</h2>
        {user ? (
          <div>
            <p className="text-green-600 mb-2">
              ログイン中: {user.email || user.id}
            </p>
            <Link
              href="/mypage"
              className="text-blue-600 hover:underline"
            >
              マイページへ →
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-gray-500 mb-2">未ログイン</p>
            <Link
              href="/login"
              className="inline-block bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-700"
            >
              ログイン
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}

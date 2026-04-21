'use client'

import { createClient } from '../../lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

 const handleLogin = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'x',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Creative Exchange</h1>
          <p className="mt-2 text-gray-600">
            サブカルチャークリエイターのための取引市場
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={handleLogin}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            X（Twitter）でログイン
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          ログインすることで利用規約とプライバシーポリシーに同意したことになります。
        </p>
      </div>
    </div>
  )
}

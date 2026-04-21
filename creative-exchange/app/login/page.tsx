'use client'

import { createClient } from '../../lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')

  const handleLogin = async () => {
    const supabase = createClient()
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 text-sm">
            <p className="font-bold text-red-800">認証エラー</p>
            <p className="text-red-700">error: {error}</p>
            <p className="text-red-700">code: {errorCode}</p>
            <p className="text-red-700">description: {errorDescription}</p>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={handleLogin}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800"
          >
            X (Twitter) でログイン
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}

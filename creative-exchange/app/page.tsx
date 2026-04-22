'use client'

import { createClient } from '../lib/supabase/client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Creative Exchange</h1>
          <p className="text-xl text-gray-600">クリエイティブの証券取引所</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* システムステータス */}
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-xl font-semibold mb-6">システムステータス</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">DB接続</span>
                <span className="text-green-600 font-medium">OK</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">カテゴリ数</span>
                <span className="font-medium">20件</span>
              </div>
            </div>
          </div>

          {/* 認証ステータス */}
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-xl font-semibold mb-6">認証ステータス</h2>
            <div className="space-y-4">
              <div>
                <span className="text-gray-600">ログイン中:</span>
                <span className="ml-2 font-medium">nagasa...@gmail.com</span>
              </div>
              <Link href="/mypage">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium">
                  マイページへ →
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ★ ここに相場ボードへの導線を追加 */}
        <div className="mt-12 text-center">
          <Link href="/market">
            <button className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-5 rounded-2xl font-medium text-xl shadow-lg hover:shadow-xl transition-all">
              相場ボードを見る
              <span className="text-2xl">📊</span>
            </button>
          </Link>
          <p className="mt-4 text-gray-500">最新のクリエイティブ制作相場を確認できます</p>
        </div>

        {/* 既存のマイページリンク（小さく残す） */}
        <div className="mt-8 text-center">
          <Link href="/mypage" className="text-blue-600 hover:underline">
            マイページへ移動する
          </Link>
        </div>
      </div>
    </div>
  )
}

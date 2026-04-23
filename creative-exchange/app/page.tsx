'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Creative Exchange
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            サブカルチャークリエイターのための取引市場
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/mypage"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-medium transition"
            >
              マイページへ
            </Link>
            <Link
              href="/market"
              className="border border-gray-300 hover:bg-gray-50 px-8 py-4 rounded-2xl font-medium transition"
            >
              相場ボードを見る
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl shadow p-8">
            <h2 className="text-xl font-semibold mb-4">相場の透明化</h2>
            <p className="text-gray-600 leading-relaxed">
              品目ごとの取引実績に基づき、クリエイティブ制作の相場を可視化します。
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow p-8">
            <h2 className="text-xl font-semibold mb-4">価格表の自動生成</h2>
            <p className="text-gray-600 leading-relaxed">
              取引履歴から、クリエイターごとの価格表を自動で表示します。
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow p-8">
            <h2 className="text-xl font-semibold mb-4">安全な取引フロー</h2>
            <p className="text-gray-600 leading-relaxed">
              依頼作成から納品・検収・評価までを一つの流れで扱えます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'

const categories = [
  'イラスト・キャラクター制作',
  'Live2D・3Dモデリング',
  '漫画・同人誌制作',
  '動画・映像制作',
  '音楽・楽曲制作',
  '音声・ミックス処理',
  'デザイン',
  '文章・シナリオ',
]

const features = [
  {
    title: '相場が見える',
    description:
      '受託相場・作品相場をカテゴリ別に表示。取引件数や信頼度を見ながら、価格の目安を確認できます。',
    icon: '📈',
  },
  {
    title: '工程で管理',
    description:
      '作詞・イラスト・動画編集など、複数クリエイターの分業を工程ごとに募集・受注・納品・検収できます。',
    icon: '🧩',
  },
  {
    title: '安心して取引',
    description:
      '事前相談、メッセージ、納品ファイル、検収、レビューまでを一箇所にまとめて管理できます。',
    icon: '🛡️',
  },
]

function BrandMark() {
  return (
    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 shadow-xl flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-white/10" />

      <div className="absolute -top-5 -right-5 w-16 h-16 rounded-full bg-white/20" />
      <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-black/10" />

      <div className="relative z-10 text-white font-black text-2xl md:text-3xl tracking-tight">
        CE
      </div>

      <div className="absolute bottom-5 left-5 right-5 h-6">
        <div className="absolute bottom-0 left-0 w-3 h-2 rounded-sm bg-white/50" />
        <div className="absolute bottom-0 left-5 w-3 h-4 rounded-sm bg-white/60" />
        <div className="absolute bottom-0 left-10 w-3 h-6 rounded-sm bg-white/70" />
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex flex-col items-center mb-8">
              <BrandMark />

              <div className="mt-5">
                <div className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                  Creative Exchange
                </div>
                <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs md:text-sm font-medium">
                  Creative Trading Platform
                </div>
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
              クリエイターのための
              <br className="hidden md:block" />
              クリエイティブ取引所
            </h1>

            <p className="text-lg md:text-2xl text-gray-700 mb-6 font-medium">
              依頼・受注・相場・作品販売をひとつの場所で。
            </p>

            <p className="text-base md:text-lg text-gray-600 leading-8 max-w-3xl mx-auto mb-10">
              Creative Exchangeは、同人・音楽・映像・イラスト制作など
              サブカルチャーの取引を、相場を見ながら、工程まで管理して、
              安全に進められるクリエイティブ取引プラットフォームです。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition shadow-sm"
              >
                はじめる（無料）
              </Link>

              <Link
                href="/market"
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-2xl font-bold transition shadow-sm"
              >
                相場を見る
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            取引に必要なものを、一つに。
          </h2>
          <p className="text-gray-600">
            価格の不透明さ、分業管理の煩雑さ、納品後の不安を減らします。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-3xl shadow p-8 border border-gray-100"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mb-6">
                {feature.icon}
              </div>

              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>

              <p className="text-gray-600 leading-7">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                対応カテゴリ
              </h2>
              <p className="text-gray-600">
                同人・サブカルチャー領域の制作取引に対応しています。
              </p>
            </div>

            <Link
              href="/exchange?tab=creators"
              className="inline-flex justify-center bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-medium transition"
            >
              クリエイターを探す
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-5 font-medium text-gray-800"
              >
                {category}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white text-center shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center font-black text-xl">
              CE
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            クリエイティブ取引を、もっと見えるものに。
          </h2>

          <p className="text-white/90 leading-8 mb-8 max-w-2xl mx-auto">
            まずはXでログインして、プロフィールを作成してください。
            依頼を出す側でも、受ける側でも、すぐに使い始められます。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-2xl font-bold transition"
            >
              今すぐXでログインして始める
            </Link>

            <Link
              href="/market"
              className="border border-white/40 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-bold transition"
            >
              相場ボードを見る
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

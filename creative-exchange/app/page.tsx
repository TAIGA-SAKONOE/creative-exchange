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
      'カテゴリ別の受託相場・作品相場を確認できます。価格の目安が見えることで、安すぎる受注や高すぎる発注を避けやすくなります。',
    icon: '📈',
  },
  {
    title: '実績が積み上がる',
    description:
      '依頼・受注・納品・検収・レビューの履歴が信用として残ります。クリエイターは実力を、依頼者は誠実な取引姿勢を市場で示せます。',
    icon: '🏛️',
  },
  {
    title: '取引が保証される',
    description:
      '事前相談、工程管理、納品ファイル、検収、レビューまでを一箇所で管理。曖昧なやり取りを減らし、安全な取引を支えます。',
    icon: '🛡️',
  },
]

const proofPoints = [
  {
    title: '価格の透明化',
    body: 'カテゴリごとの相場を見ながら依頼・受注できます。',
  },
  {
    title: '工程の見える化',
    body: '分業制作でも、募集・受注・納品・検収を工程ごとに管理できます。',
  },
  {
    title: '信用の蓄積',
    body: 'レビューと取引履歴が、次の仕事につながる市場上の実績になります。',
  },
]

function BrandMark() {
  return (
    <img
      src="/logo-full.png"
      alt="Creative Exchange"
      className="w-64 md:w-80 h-auto"
    />
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
            </div>

            <p className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-white/80 border border-blue-100 text-blue-700 text-sm font-bold shadow-sm mb-6">
              Creative Exchange / クリエイティブ取引所
            </p>

            <h1 className="text-3xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
              クリエイターが、
              <br />
              実力を市場で証明する場所。
            </h1>

            <p className="text-lg md:text-2xl text-gray-700 mb-6 font-bold">
              相場が見える。実績が積み上がる。取引が保証される。
            </p>

            <p className="text-base md:text-lg text-gray-600 leading-8 max-w-3xl mx-auto mb-10">
              Creative Exchangeは、同人・音楽・映像・イラスト制作など
              サブカルチャーの制作取引を、価格の透明性、工程管理、信用評価によって支える
              クリエイティブ取引プラットフォームです。
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Link
                href="/request/new?type=simple"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold transition shadow-sm"
              >
                かんたん依頼を作る
              </Link>

              <Link
                href="/exchange?tab=creators"
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-6 py-4 rounded-2xl font-bold transition shadow-sm"
              >
                クリエイターを探す
              </Link>

              <Link
                href="/market"
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-6 py-4 rounded-2xl font-bold transition shadow-sm"
              >
                相場を見る
              </Link>
            </div>

            <p className="mt-5 text-sm text-gray-500">
              まずは軽く依頼する、相手を探す、相場だけ確認する。目的に合わせてすぐ始められます。
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-bold text-blue-600 mb-3">
            Market Proof
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            取引を、才能の証明に変える。
          </h2>
          <p className="text-gray-600 leading-7 max-w-3xl mx-auto">
            クリエイターの実力は、作品だけではなく、価格・納期・取引評価・継続実績にも表れます。
            Creative Exchangeは、その実績を市場の中に積み上げていく場所です。
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {proofPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-3xl border border-gray-100 bg-gray-50 p-7"
              >
                <h3 className="text-xl font-bold mb-3">{point.title}</h3>
                <p className="text-gray-600 leading-7">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-bold text-blue-600 mb-3">
            Start Routes
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            目的に合わせて、すぐ使い始める。
          </h2>
          <p className="text-gray-600 leading-7 max-w-3xl mx-auto">
            依頼したい人、探したい人、まず相場を見たい人。
            Creative Exchangeは、入口を分けて迷わず進めるようにしています。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/request/new?type=simple"
            className="group bg-white rounded-3xl shadow p-8 border border-blue-100 hover:shadow-xl transition"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mb-6">
              ⚡
            </div>
            <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600">
              かんたん依頼を作る
            </h3>
            <p className="text-gray-600 leading-7 mb-5">
              修正なし前提・単一工程のライトな依頼を作成します。まず小さく頼みたいときに向いています。
            </p>
            <span className="inline-flex text-blue-600 font-bold">
              依頼作成へ →
            </span>
          </Link>

          <Link
            href="/exchange?tab=creators"
            className="group bg-white rounded-3xl shadow p-8 border border-gray-100 hover:shadow-xl transition"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-3xl mb-6">
              🎨
            </div>
            <h3 className="text-xl font-bold mb-3 group-hover:text-purple-600">
              クリエイターを探す
            </h3>
            <p className="text-gray-600 leading-7 mb-5">
              品目・スキル・受付状況・ランクから、依頼先候補を探せます。
            </p>
            <span className="inline-flex text-purple-600 font-bold">
              クリエイター一覧へ →
            </span>
          </Link>

          <Link
            href="/market"
            className="group bg-white rounded-3xl shadow p-8 border border-gray-100 hover:shadow-xl transition"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl mb-6">
              📊
            </div>
            <h3 className="text-xl font-bold mb-3 group-hover:text-emerald-600">
              相場を見る
            </h3>
            <p className="text-gray-600 leading-7 mb-5">
              カテゴリ別の価格帯を確認し、依頼金額や受注価格の目安をつかめます。
            </p>
            <span className="inline-flex text-emerald-600 font-bold">
              相場ボードへ →
            </span>
          </Link>
        </div>
      </section>

      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <p className="text-sm font-bold text-blue-600 mb-3">
                Categories
              </p>
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
            クリエイターが、実力を市場で証明する場所。
          </h2>

          <p className="text-white/90 leading-8 mb-8 max-w-2xl mx-auto">
            まずはXでログインして、プロフィールを作成してください。
            依頼を出す側でも、受ける側でも、相場と実績を確認しながら使い始められます。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Link
              href="/request/new?type=simple"
              className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-4 rounded-2xl font-bold transition"
            >
              かんたん依頼を作る
            </Link>

            <Link
              href="/exchange?tab=creators"
              className="border border-white/40 hover:bg-white/10 text-white px-6 py-4 rounded-2xl font-bold transition"
            >
              クリエイターを探す
            </Link>

            <Link
              href="/market"
              className="border border-white/40 hover:bg-white/10 text-white px-6 py-4 rounded-2xl font-bold transition"
            >
              相場を見る
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

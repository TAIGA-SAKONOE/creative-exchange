export default function PaymentGuidePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 md:p-12">
          <p className="text-sm font-bold text-blue-600 mb-3">
            Payment Guide
          </p>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            決済・仮払いについて
          </h1>

          <p className="text-gray-600 leading-8 mb-8">
            Creative Exchangeは、イラスト・音楽・動画・文章などの
            クリエイティブ制作を依頼・受注できる取引プラットフォームです。
            依頼者は制作料金を支払い、クリエイターは納品・検収完了後に
            報酬を受け取る仕組みを予定しています。
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-10">
            <p className="font-bold text-blue-900 mb-2">
              現在、決済・仮払い機能はβ提供準備中です
            </p>
            <p className="text-sm text-blue-800 leading-7">
              正式な決済機能の提供開始までは、取引条件・支払方法・返金条件等について、
              運営からの案内または当事者間の合意に従ってください。
              本ページの内容は、正式提供開始に向けた基本方針を示すものです。
            </p>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                1. 決済の対象
              </h2>
              <p className="text-gray-600 leading-8">
                本サービスで予定している決済の対象は、ユーザー間で成立する
                クリエイティブ制作取引の制作料金です。対象には、イラスト制作、
                動画制作、音楽制作、MIX、ロゴ制作、文章制作、その他これらに関連する
                制作物または制作業務が含まれます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                2. 基本的な取引の流れ
              </h2>
              <ol className="list-decimal pl-6 text-gray-600 leading-8 space-y-2">
                <li>依頼者が依頼内容・予算・納期などを設定します。</li>
                <li>クリエイターが依頼を受注、または依頼者がクリエイターを指名します。</li>
                <li>依頼者が制作料金を支払います。</li>
                <li>クリエイターが制作物を納品します。</li>
                <li>依頼者が納品物を確認し、検収を行います。</li>
                <li>検収完了後、クリエイターへの支払いが確定します。</li>
                <li>取引完了後、双方がレビューを投稿できます。</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                3. 仮払いの考え方
              </h2>
              <p className="text-gray-600 leading-8">
                仮払いは、依頼者が制作料金を支払った後、納品・検収が完了するまで
                支払いを留保することで、未払い・納品後の不払い・取引不履行などの
                リスクを軽減するための仕組みです。実際の決済処理は、Stripe等の
                外部決済サービスを利用する予定です。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                4. 手数料
              </h2>
              <p className="text-gray-600 leading-8">
                本サービスでは、取引金額に対して原則10%のサービス手数料を設定する
                方針です。この手数料には、決済処理、プラットフォーム運営、取引記録、
                検収・レビュー機能、相場・信用情報の整備等に関する費用が含まれます。
              </p>
              <p className="text-sm text-gray-500 leading-7 mt-3">
                ※ 正式な手数料率、計算方法、負担者、消費税等の取扱いは、
                正式提供開始時の利用規約・特定商取引法に基づく表記等で定めます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                5. キャンセル・返金
              </h2>
              <p className="text-gray-600 leading-8">
                キャンセル・返金の可否は、受注前、制作開始前、制作開始後、納品後、
                検収後など、取引の進行状況によって異なります。詳細は
                「キャンセル・返金ポリシー」に定めます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                6. 外部決済サービス
              </h2>
              <p className="text-gray-600 leading-8">
                本サービスでは、決済処理のためにStripeその他の外部決済サービスを
                利用する場合があります。決済情報の取扱いは、当該外部サービスの
                規約・ポリシーにも従います。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                7. 注意事項
              </h2>
              <ul className="list-disc pl-6 text-gray-600 leading-8 space-y-2">
                <li>本ページの内容は、β提供準備中の基本方針です。</li>
                <li>正式提供開始時には、内容を変更する場合があります。</li>
                <li>本サービスは、法令・決済事業者の審査・運用条件に従って提供されます。</li>
                <li>禁止される取引、権利侵害のおそれがある取引、公序良俗に反する取引は利用できません。</li>
              </ul>
            </section>
          </div>

          <div className="mt-12 pt-6 border-t border-gray-100 text-sm text-gray-500">
            制定日：2026年4月23日
          </div>
        </div>
      </section>
    </main>
  )
}

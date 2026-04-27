export default function OperatorPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 md:p-12">
          <p className="text-sm font-bold text-blue-600 mb-3">
            Operator
          </p>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            運営者情報
          </h1>

          <p className="text-gray-600 leading-8 mb-10">
            Creative Exchangeは、クリエイティブ制作に関する依頼・受注・納品・検収・評価を
            より安全で分かりやすく行うための取引プラットフォームです。
            クリエイターの相場・実績・信用・工程を見える化し、創作取引の透明性を高めることを目的としています。
          </p>

          <div className="overflow-hidden rounded-2xl border border-gray-200 mb-10">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <th className="w-1/3 bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    サービス名
                  </th>
                  <td className="px-4 py-4 text-gray-700">
                    Creative Exchange
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    運営者
                  </th>
                  <td className="px-4 py-4 text-gray-700">
                    長崎 泰雅
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    事業形態
                  </th>
                  <td className="px-4 py-4 text-gray-700">
                    個人事業として開業準備中
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    事業内容
                  </th>
                  <td className="px-4 py-4 text-gray-700 leading-7">
                    クリエイティブ制作に関する依頼・受注・納品・検収・評価・決済補助等を行う
                    ウェブプラットフォームの企画、開発及び運営
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    サービスURL
                  </th>
                  <td className="px-4 py-4 text-gray-700">
                    https://creative-exchange.vercel.app
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    お問い合わせ
                  </th>
                  <td className="px-4 py-4 text-gray-700">
                    お問い合わせページよりご連絡ください。
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <section className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                運営方針
              </h2>
              <p className="text-gray-600 leading-8">
                Creative Exchangeは、創作依頼における相場の不透明さ、SNS上の取引トラブル、
                実績が蓄積されにくい問題を解消するため、相場情報、取引履歴、レビュー、工程管理を
                統合したサービスとして運営します。
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                決済機能について
              </h2>
              <p className="text-gray-600 leading-8">
                現在、決済・仮払い機能はβ提供準備中です。正式提供開始時には、
                利用規約、特定商取引法に基づく表記、キャンセル・返金ポリシー、
                決済・仮払いについての各ページにて詳細を定めます。
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <p className="text-sm text-gray-600 leading-7">
                所在地・電話番号等の表示が必要となる場合は、
                「特定商取引法に基づく表記」において、法令に従い適切に表示します。
              </p>
            </div>
          </section>

          <div className="mt-12 pt-6 border-t border-gray-100 text-sm text-gray-500">
            制定日：2026年4月23日
          </div>
        </div>
      </section>
    </main>
  )
}

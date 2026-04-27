export default function CommercialLawPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 md:p-12">
          <p className="text-sm font-bold text-blue-600 mb-3">
            Legal Notice
          </p>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            特定商取引法に基づく表記
          </h1>

          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5 mb-10">
            <p className="font-bold text-yellow-900 mb-2">
              現在、決済・仮払い機能はβ提供準備中です
            </p>
            <p className="text-sm text-yellow-800 leading-7">
              本ページは、正式な決済機能の提供開始に向けた暫定的な表示です。
              正式提供開始時には、販売価格、手数料、支払方法、返金条件、
              役務提供時期その他必要な事項を更新します。
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200">
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
                    販売事業者・役務提供事業者
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
                    運営責任者
                  </th>
                  <td className="px-4 py-4 text-gray-700">
                    長崎 泰雅
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    所在地
                  </th>
                  <td className="px-4 py-4 text-gray-700 leading-7">
                    請求があった場合には、法令に従い遅滞なく開示します。
                    <br />
                    ※ 正式な有償取引開始前に、表示方法を確認のうえ更新します。
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    電話番号
                  </th>
                  <td className="px-4 py-4 text-gray-700 leading-7">
                    請求があった場合には、法令に従い遅滞なく開示します。
                    <br />
                    お問い合わせは、原則としてお問い合わせページよりお願いいたします。
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    メールアドレス
                  </th>
                  <td className="px-4 py-4 text-gray-700">
                    お問い合わせページよりご連絡ください。
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
                    役務の内容
                  </th>
                  <td className="px-4 py-4 text-gray-700 leading-7">
                    クリエイティブ制作に関する依頼・受注・納品・検収・評価・決済補助等を行う
                    ウェブプラットフォームの提供
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    販売価格・役務の対価
                  </th>
                  <td className="px-4 py-4 text-gray-700 leading-7">
                    各依頼ページ、取引画面、決済画面又は本サービス上に表示される金額によります。
                    現在、決済・仮払い機能はβ提供準備中です。
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    サービス手数料
                  </th>
                  <td className="px-4 py-4 text-gray-700 leading-7">
                    取引金額に対して原則10%のサービス手数料を設定する方針です。
                    正式な手数料率、計算方法、負担者、消費税等の取扱いは、
                    正式提供開始時の表示に従います。
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    商品代金以外の必要料金
                  </th>
                  <td className="px-4 py-4 text-gray-700 leading-7">
                    サービス手数料、決済手数料、振込手数料、通信料その他本サービス上で表示される費用が
                    発生する場合があります。
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    支払方法
                  </th>
                  <td className="px-4 py-4 text-gray-700 leading-7">
                    Stripeその他運営者が指定する外部決済サービスを利用する予定です。
                    正式提供開始時に、本サービス上で表示します。
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    支払時期
                  </th>
                  <td className="px-4 py-4 text-gray-700 leading-7">
                    依頼作成時、受注成立時、又は各取引画面・決済画面に表示される時期に支払いが発生します。
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    役務提供時期
                  </th>
                  <td className="px-4 py-4 text-gray-700 leading-7">
                    各依頼において合意された納期、又は本サービス上に表示される条件に従います。
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    キャンセル・返金
                  </th>
                  <td className="px-4 py-4 text-gray-700 leading-7">
                    キャンセル及び返金の可否は、取引の進行状況、当事者間の合意、
                    本サービス上の表示、利用規約及びキャンセル・返金ポリシーに従います。
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    動作環境
                  </th>
                  <td className="px-4 py-4 text-gray-700 leading-7">
                    インターネットに接続可能なPC、スマートフォン、タブレット等の端末及び
                    最新版に近い主要ブラウザでの利用を推奨します。
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-12 pt-6 border-t border-gray-100 text-sm text-gray-500">
            制定日：2026年4月23日
          </div>
        </div>
      </section>
    </main>
  )
}

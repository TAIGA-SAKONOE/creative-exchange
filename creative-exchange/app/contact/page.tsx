export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 md:p-12">
          <p className="text-sm font-bold text-blue-600 mb-3">
            Contact
          </p>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            お問い合わせ
          </h1>

          <p className="text-gray-600 leading-8 mb-10">
            Creative Exchangeに関するお問い合わせは、以下の方法でご連絡ください。
            サービス内容、取引、決済、利用規約、プライバシーポリシー、その他運営に関するご質問を受け付けています。
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-10">
            <h2 className="text-lg font-bold text-blue-900 mb-3">
              お問い合わせ方法
            </h2>
            <p className="text-blue-800 leading-8">
              現在、お問い合わせフォームは準備中です。
              お問い合わせ先メールアドレスは、正式公開前に本ページ及び特定商取引法に基づく表記に掲載します。
            </p>
          </div>

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
                    お問い合わせ内容
                  </th>
                  <td className="px-4 py-4 text-gray-700 leading-7">
                    サービス利用、取引、決済、キャンセル・返金、規約、個人情報の取扱い、
                    不具合報告、その他運営に関するお問い合わせ
                  </td>
                </tr>

                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-bold text-gray-700">
                    返信について
                  </th>
                  <td className="px-4 py-4 text-gray-700 leading-7">
                    内容を確認のうえ、必要に応じて返信します。
                    返信までにお時間をいただく場合があります。
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <section className="space-y-8 text-gray-700 leading-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                取引に関するお問い合わせ
              </h2>
              <p>
                依頼、受注、納品、検収、レビュー、キャンセル、返金等に関するお問い合わせの際は、
                可能な範囲で、対象となる依頼名、取引内容、発生している問題、相手方とのやり取り状況をお知らせください。
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                不具合報告
              </h2>
              <p>
                画面表示、ログイン、依頼作成、プロフィール編集、取引機能等に不具合がある場合は、
                利用端末、ブラウザ、発生した画面、操作内容、エラーメッセージ等をお知らせください。
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                個人情報に関するお問い合わせ
              </h2>
              <p>
                個人情報の開示、訂正、削除、利用停止等に関するお問い合わせは、
                プライバシーポリシーをご確認のうえ、ご連絡ください。
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

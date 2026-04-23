export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h1 className="text-4xl font-bold mb-8">プライバシーポリシー</h1>

          <div className="space-y-8 text-gray-700 leading-8">
            <section>
              <h2 className="text-xl font-bold mb-3">1. 取得する情報</h2>
              <p>
                本サービスは、ユーザー登録、ログイン、プロフィール編集、依頼作成、受注、納品、
                検収、評価その他の機能提供のために、氏名又は表示名、SNSアカウント情報、
                プロフィール情報、取引情報、アクセス情報その他本サービス運営上必要な情報を取得する場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">2. 利用目的</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>本サービスの提供、運営、保守のため</li>
                <li>本人確認、認証、ユーザー管理のため</li>
                <li>依頼、受注、納品、検収、評価等の取引機能を提供するため</li>
                <li>相場情報、価格表その他統計情報の作成及び表示のため</li>
                <li>不正利用の防止、調査及び対応のため</li>
                <li>お問い合わせ対応のため</li>
                <li>サービス改善、新機能開発及び分析のため</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">3. 第三者提供</h2>
              <p>
                運営者は、法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。
                ただし、決済、認証、ホスティングその他本サービス提供に必要な外部サービスを利用する場合、
                その提供に必要な範囲で情報を取り扱わせることがあります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">4. 外部サービスの利用</h2>
              <p>
                本サービスは、認証、データ保存、ホスティング、決済その他の目的で外部サービスを利用する場合があります。
                これらの外部サービスにおける情報の取扱いは、各提供事業者の定める規約及びポリシーによります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">5. 安全管理</h2>
              <p>
                運営者は、取得した情報について、漏えい、滅失、毀損等の防止その他の安全管理のために、
                必要かつ適切な措置を講じます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">6. 開示・訂正・削除等</h2>
              <p>
                ユーザーは、法令の定めるところにより、自己に関する情報の開示、訂正、追加、削除、
                利用停止等を求めることができます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">7. ポリシーの変更</h2>
              <p>
                運営者は、必要に応じて本ポリシーを変更できます。
                変更後の内容は、本サービス上に掲載した時点又は別途定める時点から効力を生じます。
              </p>
            </section>

            <section className="pt-4 text-sm text-gray-500">
              制定日：2026年4月23日
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

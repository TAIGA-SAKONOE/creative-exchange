export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 md:p-12">
          <p className="text-sm font-bold text-blue-600 mb-3">
            Privacy Policy
          </p>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            プライバシーポリシー
          </h1>

          <p className="text-gray-600 leading-8 mb-10">
            Creative Exchange（以下「本サービス」といいます。）は、
            本サービスの提供にあたり取得するユーザー情報について、以下のとおりプライバシーポリシーを定めます。
          </p>

          <div className="space-y-10 text-gray-700 leading-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">1. 取得する情報</h2>
              <p>
                本サービスは、ユーザー登録、ログイン、プロフィール編集、依頼作成、受注、納品、検収、評価、
                お問い合わせ、決済その他の機能提供のため、以下の情報を取得する場合があります。
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>氏名、表示名、メールアドレスその他連絡先情報</li>
                <li>X（旧Twitter）等のSNSアカウントに関する情報</li>
                <li>プロフィール、スキル、ポートフォリオ、実績、自己紹介等の情報</li>
                <li>依頼、受注、納品、検収、レビュー、評価その他取引に関する情報</li>
                <li>決済、請求、返金、手数料その他支払いに関する情報</li>
                <li>お問い合わせ内容、運営者との連絡内容</li>
                <li>アクセスログ、Cookie、端末情報、ブラウザ情報、IPアドレス、利用履歴等</li>
                <li>その他本サービスの提供、運営、保守、改善に必要な情報</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">2. 利用目的</h2>
              <p>本サービスは、取得した情報を以下の目的で利用します。</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>本サービスの提供、運営、保守のため</li>
                <li>本人確認、認証、ユーザー管理のため</li>
                <li>依頼、受注、納品、検収、評価等の取引機能を提供するため</li>
                <li>決済、請求、返金、手数料計算その他支払い関連処理のため</li>
                <li>相場情報、価格表、統計情報、信用情報その他本サービス上の表示を作成するため</li>
                <li>不正利用、規約違反、権利侵害、トラブル等の防止、調査及び対応のため</li>
                <li>お問い合わせ対応、重要なお知らせ、必要な連絡のため</li>
                <li>サービス改善、新機能開発、利用状況分析のため</li>
                <li>法令又は行政機関・司法機関の要請に対応するため</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">3. Cookie・アクセスログ等</h2>
              <p>
                本サービスは、利便性向上、ログイン状態の維持、不正利用防止、アクセス解析、
                サービス改善等のため、Cookie、アクセスログ、端末情報、ブラウザ情報、IPアドレス等を取得する場合があります。
              </p>
              <p className="mt-3">
                ユーザーは、ブラウザの設定によりCookieを無効化できます。
                ただし、Cookieを無効化した場合、本サービスの一部機能を利用できない場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">4. 外部サービスの利用</h2>
              <p>
                本サービスは、認証、データ保存、ホスティング、決済、アクセス解析、メール送信その他の目的で、
                外部サービスを利用する場合があります。
              </p>
              <p className="mt-3">
                外部サービスには、Supabase、Vercel、Stripe、X（旧Twitter）その他運営者が必要と認めるサービスが含まれます。
                これらの外部サービスにおける情報の取扱いは、各提供事業者の定める規約及びポリシーにも従います。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. 決済情報の取扱い</h2>
              <p>
                本サービスは、決済処理のためにStripeその他の外部決済サービスを利用する場合があります。
                クレジットカード番号等の決済手段に関する情報は、原則として外部決済サービス事業者により管理され、
                本サービス運営者が直接保持しない場合があります。
              </p>
              <p className="mt-3">
                本サービスは、決済状況、支払金額、返金状況、手数料、取引ID等、
                サービス提供に必要な範囲の決済関連情報を取得又は参照する場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">6. 第三者提供</h2>
              <p>
                運営者は、法令に基づく場合、本人の同意がある場合、生命・身体・財産の保護のために必要な場合、
                公的機関への協力が必要な場合その他法令により認められる場合を除き、
                本人の同意なく個人情報を第三者に提供しません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">7. 業務委託</h2>
              <p>
                運営者は、本サービスの提供、運営、保守、決済、問い合わせ対応、分析、法務・税務対応その他必要な業務の一部を
                外部事業者に委託する場合があります。この場合、委託先に対して必要な範囲で情報を提供し、
                適切な管理を行うよう努めます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">8. 安全管理</h2>
              <p>
                運営者は、取得した情報について、漏えい、滅失、毀損、不正アクセス等の防止その他の安全管理のために、
                必要かつ適切な措置を講じるよう努めます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">9. 開示・訂正・削除等</h2>
              <p>
                ユーザーは、法令の定めるところにより、自己に関する情報の開示、訂正、追加、削除、
                利用停止、第三者提供停止等を求めることができます。
              </p>
              <p className="mt-3">
                請求方法その他詳細については、お問い合わせページよりご連絡ください。
                ただし、本人確認、法令上の保存義務、取引記録の保全、不正防止等のため、
                一部の情報について削除又は利用停止に応じられない場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">10. 退会後の情報</h2>
              <p>
                ユーザーが退会した場合であっても、法令遵守、紛争防止、不正利用防止、取引記録の保全、
                会計処理その他本サービス運営上必要な範囲で、一定期間情報を保持する場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">11. 未成年者の利用</h2>
              <p>
                未成年者が本サービスを利用する場合は、親権者その他法定代理人の同意を得た上で利用するものとします。
                未成年者が本サービスを利用した場合、当該同意を得ているものとみなします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">12. ポリシーの変更</h2>
              <p>
                運営者は、必要に応じて本ポリシーを変更できます。
                変更後の内容は、本サービス上に掲載した時点又は別途定める時点から効力を生じます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">13. お問い合わせ窓口</h2>
              <p>
                本ポリシーに関するお問い合わせ、個人情報の開示・訂正・削除等の請求は、
                お問い合わせページよりご連絡ください。
              </p>
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

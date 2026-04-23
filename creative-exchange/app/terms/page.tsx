export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h1 className="text-4xl font-bold mb-8">利用規約</h1>

          <div className="space-y-8 text-gray-700 leading-8">
            <section>
              <h2 className="text-xl font-bold mb-3">第1条（適用）</h2>
              <p>
                本規約は、Creative Exchange（以下「本サービス」）の利用条件を定めるものです。
                本サービスを利用するすべてのユーザーは、本規約に同意したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">第2条（本サービスの内容）</h2>
              <p>
                本サービスは、クリエイティブ制作に関する依頼、受注、納品、検収、評価、
                相場情報の表示その他これらに付随する機能を提供するプラットフォームです。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">第3条（ユーザー登録）</h2>
              <p>
                ユーザーは、本サービス所定の方法により登録を行うものとします。
                登録情報に虚偽、不正確又は不完全な内容があってはなりません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">第4条（禁止事項）</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>法令又は公序良俗に違反する行為</li>
                <li>他者の知的財産権、名誉、信用、プライバシーその他の権利利益を侵害する行為</li>
                <li>虚偽の情報を登録又は掲載する行為</li>
                <li>不正アクセス、システムへの過度な負荷、リバースエンジニアリングその他本サービスの運営を妨害する行為</li>
                <li>本サービスを通じた詐欺的行為又はこれに類する行為</li>
                <li>その他、運営者が不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">第5条（投稿情報・取引情報）</h2>
              <p>
                ユーザーは、本サービス上に掲載又は送信する文章、画像、ファイルその他一切の情報について、
                自らが適法に利用又は提供する権限を有することを保証するものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">第6条（知的財産権）</h2>
              <p>
                本サービスに関するプログラム、デザイン、文章、ロゴその他の知的財産権は、
                運営者又は正当な権利者に帰属します。
                個別の制作物に関する権利の帰属は、当事者間の合意又は別途定める条件に従います。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">第7条（免責）</h2>
              <p>
                運営者は、本サービスに事実上又は法律上の瑕疵がないことを保証しません。
                また、ユーザー間の取引、紛争、損害等について、運営者に故意又は重過失がある場合を除き、
                責任を負いません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">第8条（サービス内容の変更・停止）</h2>
              <p>
                運営者は、必要と判断した場合、ユーザーへの事前通知なく、本サービスの内容変更、
                一時停止又は終了を行うことができます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">第9条（規約の変更）</h2>
              <p>
                運営者は、必要に応じて本規約を変更できます。
                変更後の規約は、本サービス上に表示した時点又は別途定める時点から効力を生じます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">第10条（準拠法・管轄）</h2>
              <p>
                本規約は日本法に準拠します。
                本サービスに関して紛争が生じた場合には、運営者所在地を管轄する裁判所を
                第一審の専属的合意管轄裁判所とします。
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

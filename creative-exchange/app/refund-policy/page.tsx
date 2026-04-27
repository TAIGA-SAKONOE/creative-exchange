export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 md:p-12">
          <p className="text-sm font-bold text-blue-600 mb-3">
            Cancellation & Refund Policy
          </p>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            キャンセル・返金ポリシー
          </h1>

          <p className="text-gray-600 leading-8 mb-8">
            本ポリシーは、Creative Exchangeにおけるクリエイティブ制作取引の
            キャンセル及び返金に関する基本方針を定めるものです。
          </p>

          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5 mb-10">
            <p className="font-bold text-yellow-900 mb-2">
              現在、決済・仮払い機能はβ提供準備中です
            </p>
            <p className="text-sm text-yellow-800 leading-7">
              本ページは、正式な決済機能の提供開始に向けた暫定的なポリシーです。
              正式提供開始時には、決済方法、仮払い方式、返金手続、手数料等に応じて内容を更新します。
            </p>
          </div>

          <div className="space-y-10 text-gray-700 leading-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                1. 基本方針
              </h2>
              <p>
                Creative Exchangeでは、依頼者と受注者との間で成立した制作取引について、
                取引の進行状況、当事者間の合意、利用規約、本ポリシー及び本サービス上の表示に従い、
                キャンセル及び返金の可否を判断します。
              </p>
              <p className="mt-3">
                クリエイティブ制作は、制作開始後に受注者の時間、技能、準備作業等が投入されるため、
                取引の段階によってキャンセル及び返金の条件が異なります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                2. 受注前のキャンセル
              </h2>
              <p>
                依頼がまだ受注されていない段階では、依頼者は原則として依頼を取り下げることができます。
                受注者が確定しておらず、制作作業も開始されていない場合、制作料金の支払いが発生しているときは
                原則として返金対象となります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                3. 受注後・制作開始前のキャンセル
              </h2>
              <p>
                受注成立後であっても、制作開始前であり、受注者に具体的な作業、準備、資料確認、
                スケジュール確保等の負担が生じていない場合には、当事者間の合意によりキャンセルできる場合があります。
              </p>
              <p className="mt-3">
                ただし、受注者が既に作業時間を確保している場合、打ち合わせ、構成検討、ラフ作成、
                資料確認等に着手している場合には、全部又は一部の返金が認められない場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                4. 制作開始後のキャンセル
              </h2>
              <p>
                制作開始後のキャンセルについては、既に実施された作業、制作物の進捗、受注者の拘束時間、
                当事者間で合意された条件等を考慮し、全部又は一部の返金が認められない場合があります。
              </p>
              <p className="mt-3">
                制作開始後に依頼者都合でキャンセルする場合、受注者は進捗に応じた報酬を請求できる場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                5. 納品後のキャンセル・返金
              </h2>
              <p>
                受注者が制作物を納品した後は、原則としてキャンセル及び返金は制限されます。
                依頼内容と明らかに異なる納品、重大な不備、合意条件の不履行等がある場合には、
                修正、再納品、減額、返金その他の対応を協議するものとします。
              </p>
              <p className="mt-3">
                依頼者の主観的な好みの変更、依頼内容の後出し変更、当初合意されていない追加修正等を理由とする返金は、
                原則として認められません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                6. 検収完了後の返金
              </h2>
              <p>
                依頼者が納品物を確認し、検収を完了した後は、原則として返金はできません。
                ただし、重大な権利侵害、納品物の利用不能、詐欺的行為その他運営者が必要と判断する事情がある場合には、
                個別に対応を検討する場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                7. 受注者都合によるキャンセル
              </h2>
              <p>
                受注者が制作を継続できない場合、納期を大幅に超過した場合、連絡不能となった場合、
                又は合意された制作物を納品できない場合には、依頼者に対して全部又は一部の返金が行われる場合があります。
              </p>
              <p className="mt-3">
                受注者都合によるキャンセルが繰り返される場合、運営者は当該ユーザーに対し、
                利用制限、表示制限、登録停止その他必要な措置を行うことがあります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                8. 依頼者都合によるキャンセル
              </h2>
              <p>
                依頼者の事情変更、予算変更、不要化、連絡遅延、確認遅延、依頼内容の大幅変更等によるキャンセルについては、
                取引の進行状況に応じて、全部又は一部の返金が認められない場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                9. 音信不通時の対応
              </h2>
              <p>
                依頼者又は受注者が一定期間連絡不能となった場合、運営者は本サービス上の記録、取引状況、
                納品状況、検収状況等を確認し、必要に応じて取引の継続、キャンセル、返金、支払い確定、
                利用制限その他の措置を行う場合があります。
              </p>
              <p className="mt-3">
                音信不通の判定期間及び具体的な処理方法は、正式な決済機能の提供開始時に本サービス上で定めます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                10. 双方合意によるキャンセル
              </h2>
              <p>
                依頼者と受注者が双方合意した場合、取引をキャンセルできる場合があります。
                この場合の返金額、受注者への支払額、手数料の扱い等は、取引の進行状況、
                当事者間の合意及び本サービス上の表示に従います。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                11. 手数料の取扱い
              </h2>
              <p>
                キャンセル又は返金が行われる場合でも、決済手数料、振込手数料、サービス手数料その他既に発生した費用については、
                返金対象外となる場合があります。
              </p>
              <p className="mt-3">
                正式な手数料の取扱いは、決済機能の提供開始時に、利用規約、特定商取引法に基づく表記、
                決済・仮払いについてのページ等で定めます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                12. 禁止行為・不正利用への対応
              </h2>
              <p>
                詐欺的行為、虚偽の依頼、虚偽の納品、権利侵害物の納品、支払い回避、手数料回避、
                本サービス外での不適切な直接取引誘導その他不正利用が確認された場合、
                運営者は返金の可否にかかわらず、利用制限、登録停止、取引取消、関係機関への相談その他必要な措置を行うことがあります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                13. 個別判断
              </h2>
              <p>
                本ポリシーに定めのない事項、又は本ポリシーの適用が困難な事項については、
                取引内容、進行状況、本サービス上の記録、当事者間の合意、法令その他の事情を考慮し、
                運営者が合理的に判断します。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                14. ポリシーの変更
              </h2>
              <p>
                運営者は、必要に応じて本ポリシーを変更できます。
                変更後の内容は、本サービス上に掲載した時点又は別途定める時点から効力を生じます。
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

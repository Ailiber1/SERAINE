export const metadata = {
  title: "プライバシーポリシー | SÉRAINE",
  description: "SÉRAINEのプライバシーポリシー。お客様の個人情報の取り扱いについて。",
};

export default function PrivacyPage() {
  return (
    <main className="bg-soft-white min-h-[calc(100dvh-160px)]">
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] tracking-[0.25em] text-champagne-gold uppercase mb-4 text-center">
            Privacy Policy
          </p>
          <h1 className="font-heading text-[28px] md:text-[36px] leading-snug tracking-wide text-deep-charcoal text-center mb-12">
            プライバシーポリシー
          </h1>

          <div className="space-y-10 text-[14px] text-deep-charcoal/70 leading-relaxed">
            <section>
              <h2 className="text-[16px] font-medium text-deep-charcoal mb-3">1. 個人情報の収集について</h2>
              <p>
                当サイトでは、お客様にサービスを提供するにあたり、以下の個人情報を収集することがあります。
                お名前、メールアドレス、住所、電話番号、お支払い情報などの情報は、
                ご注文の処理およびカスタマーサポートの提供に使用いたします。
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-deep-charcoal mb-3">2. 個人情報の利用目的</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>商品のご注文・配送に関するご連絡</li>
                <li>お問い合わせへの回答</li>
                <li>新商品やキャンペーンのご案内（ご同意いただいた場合のみ）</li>
                <li>サービスの改善および品質向上</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-deep-charcoal mb-3">3. 個人情報の第三者提供</h2>
              <p>
                お客様の個人情報は、以下の場合を除き、第三者に提供することはありません。
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>お客様ご本人の同意がある場合</li>
                <li>法令に基づく場合</li>
                <li>配送業者への配送先情報の提供（商品をお届けするために必要な範囲に限ります）</li>
                <li>決済処理のために決済サービス提供会社への情報提供</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-deep-charcoal mb-3">4. 個人情報の管理</h2>
              <p>
                お客様の個人情報は、適切なセキュリティ対策を講じて管理いたします。
                SSL暗号化通信による情報の保護、アクセス制限の実施など、
                不正アクセス・紛失・破損・改ざん・漏洩の防止に努めます。
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-deep-charcoal mb-3">5. Cookieの使用について</h2>
              <p>
                当サイトでは、お客様の利便性向上のためにCookieを使用しています。
                Cookieはお客様のブラウザ設定により無効にすることができますが、
                一部のサービスが正常に動作しなくなる場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-medium text-deep-charcoal mb-3">6. お問い合わせ</h2>
              <p>
                個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください。
              </p>
              <p className="mt-3">
                SÉRAINE カスタマーサポート<br />
                メール: contact@seraine.jp<br />
                所在地: 東京都港区南青山 x-x-x
              </p>
            </section>

            <p className="text-[13px] text-deep-charcoal/40 pt-6 border-t border-border-light">
              制定日: 2026年3月31日
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

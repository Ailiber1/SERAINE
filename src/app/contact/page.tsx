import Link from "next/link";

export const metadata = {
  title: "お問い合わせ | SÉRAINE",
  description: "SÉRAINEへのお問い合わせはこちらから。",
};

export default function ContactPage() {
  return (
    <main className="bg-soft-white min-h-[calc(100dvh-160px)]">
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] tracking-[0.25em] text-champagne-gold uppercase mb-4 text-center">
            Contact
          </p>
          <h1 className="font-heading text-[28px] md:text-[36px] leading-snug tracking-wide text-deep-charcoal text-center mb-12">
            お問い合わせ
          </h1>

          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-[12px] tracking-wide text-deep-charcoal/60 uppercase">
                  お名前
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  className="h-12 px-4 border border-border-light rounded-md bg-white text-[14px] outline-none focus:border-champagne-gold transition-colors"
                  placeholder="山田 花子"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-[12px] tracking-wide text-deep-charcoal/60 uppercase">
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="h-12 px-4 border border-border-light rounded-md bg-white text-[14px] outline-none focus:border-champagne-gold transition-colors"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="subject" className="text-[12px] tracking-wide text-deep-charcoal/60 uppercase">
                件名
              </label>
              <input
                id="subject"
                type="text"
                required
                className="h-12 px-4 border border-border-light rounded-md bg-white text-[14px] outline-none focus:border-champagne-gold transition-colors"
                placeholder="お問い合わせの件名"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-[12px] tracking-wide text-deep-charcoal/60 uppercase">
                メッセージ
              </label>
              <textarea
                id="message"
                rows={6}
                required
                className="px-4 py-3 border border-border-light rounded-md bg-white text-[14px] outline-none focus:border-champagne-gold transition-colors resize-none"
                placeholder="お問い合わせ内容をご記入ください"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-deep-charcoal text-white text-[13px] tracking-wider rounded-md hover:bg-deep-charcoal/85 transition-colors"
            >
              送信する
            </button>
          </form>

          <div className="mt-16 pt-10 border-t border-border-light text-center">
            <p className="text-[13px] text-deep-charcoal/50 mb-2">その他のお問い合わせ</p>
            <p className="text-[14px] text-deep-charcoal/70">contact@seraine.jp</p>
            <p className="text-[13px] text-deep-charcoal/50 mt-4">
              東京都港区南青山 x-x-x
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export const runtime = 'edge';

import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "私たちについて | SÉRAINE",
  description: "SÉRAINEのブランドストーリー。自然の恵みと先進のサイエンスが織りなす、あなたの肌のための特別なスキンケア。",
};

export default function AboutPage() {
  return (
    <main className="bg-soft-white">
      {/* ヒーロー */}
      <section className="relative min-h-[480px] md:min-h-[560px] flex items-center justify-center overflow-hidden bg-deep-charcoal">
        <Image
          src="/images/about-hero.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          loading="eager"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-deep-charcoal/50" />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-3 md:px-6">
          <p className="text-[11px] tracking-[0.3em] text-champagne-gold uppercase mb-6">
            About SÉRAINE
          </p>
          <h1 className="font-heading text-[32px] md:text-[48px] leading-tight tracking-[-0.02em] md:tracking-wide mb-6 text-white">
            穏やかに輝く、<br />
            あなただけの美しさを。
          </h1>
          <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
            SÉRAINEは、真の美しさはシンプルさと自然の中にあると信じています。
          </p>
        </div>
      </section>

      {/* ブランドストーリー */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
            <Image
              src="/images/about-story.jpg"
              alt="SÉRAINEのブランドストーリー"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-[11px] tracking-[0.25em] text-champagne-gold uppercase mb-4">
              Our Story
            </p>
            <h2 className="font-heading text-[24px] md:text-[32px] leading-snug tracking-wide text-deep-charcoal mb-6">
              美しさの原点を求めて
            </h2>
            <div className="space-y-4 text-deep-charcoal/70 text-sm leading-relaxed">
              <p>
                SÉRAINEは「穏やかな輝き」を意味するフランス語から生まれました。
                私たちは、肌本来の力を信じ、それを最大限に引き出すスキンケアを追求しています。
              </p>
              <p>
                世界中から厳選した希少な植物エキスと、最先端のバイオテクノロジーを融合。
                科学的根拠に基づきながらも、自然の恵みを最大限に活かした処方を開発しています。
              </p>
              <p>
                東京・南青山のラボで、一つひとつ丁寧に製造。
                大量生産では実現できない品質と、使うたびに感じる特別な体験をお届けします。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 哲学 */}
      <section className="py-20 md:py-28 px-6 bg-blush-pink/20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] tracking-[0.25em] text-champagne-gold uppercase mb-4">
            Our Philosophy
          </p>
          <h2 className="font-heading text-[24px] md:text-[32px] leading-snug tracking-wide text-deep-charcoal mb-10">
            美しさの哲学
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <div className="w-12 h-[1px] bg-champagne-gold mx-auto mb-6" />
              <h3 className="font-heading text-lg text-deep-charcoal mb-3">純粋さ</h3>
              <p className="text-deep-charcoal/60 text-sm leading-relaxed">
                不要な成分を排除し、肌に本当に必要なものだけを届ける。シンプルであることが、最も贅沢なスキンケアだと考えます。
              </p>
            </div>
            <div>
              <div className="w-12 h-[1px] bg-champagne-gold mx-auto mb-6" />
              <h3 className="font-heading text-lg text-deep-charcoal mb-3">科学と自然の融合</h3>
              <p className="text-deep-charcoal/60 text-sm leading-relaxed">
                伝統的な植物療法の知恵と、現代の皮膚科学を組み合わせ、エビデンスに基づいた処方を実現しています。
              </p>
            </div>
            <div>
              <div className="w-12 h-[1px] bg-champagne-gold mx-auto mb-6" />
              <h3 className="font-heading text-lg text-deep-charcoal mb-3">サステナビリティ</h3>
              <p className="text-deep-charcoal/60 text-sm leading-relaxed">
                環境に配慮したパッケージ、エシカルな原料調達。美しさを追求しながら、地球にもやさしい製品づくりを。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* こだわりの成分 */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="order-2 md:order-1">
            <p className="text-[11px] tracking-[0.25em] text-champagne-gold uppercase mb-4">
              Our Ingredients
            </p>
            <h2 className="font-heading text-[24px] md:text-[32px] leading-snug tracking-wide text-deep-charcoal mb-6">
              厳選された成分
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-deep-charcoal mb-1">ダマスクローズウォーター</h3>
                <p className="text-deep-charcoal/60 text-sm leading-relaxed">
                  ブルガリア産のダマスクローズから抽出。肌のキメを整え、豊かなうるおいを与えます。
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-deep-charcoal mb-1">ビタミンC誘導体</h3>
                <p className="text-deep-charcoal/60 text-sm leading-relaxed">
                  安定型ビタミンC誘導体を高濃度で配合。透明感あふれる肌へと導きます。
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-deep-charcoal mb-1">ヒト型セラミド</h3>
                <p className="text-deep-charcoal/60 text-sm leading-relaxed">
                  肌のバリア機能を強化し、外的刺激から肌を守ります。内側からのうるおいを実感。
                </p>
              </div>
            </div>
          </div>
          <div className="relative aspect-square rounded-lg overflow-hidden order-1 md:order-2">
            <Image
              src="/images/about-ingredients.jpg"
              alt="SÉRAINEの厳選成分"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ブランド情報 */}
      <section className="py-20 md:py-28 px-6 bg-deep-charcoal text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-[24px] md:text-[32px] tracking-wide mb-10">
            SÉRAINE
          </h2>
          <div className="space-y-4 text-white/60 text-sm">
            <p>東京都港区南青山 x-x-x</p>
            <p>お問い合わせ: contact@seraine.jp</p>
          </div>
          <div className="mt-12">
            <Link
              href="/products"
              className="inline-block bg-champagne-gold text-white px-10 py-3 text-sm tracking-wider hover:bg-champagne-gold/90 transition-colors rounded"
            >
              製品を見る
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

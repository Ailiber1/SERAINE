import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types/database";
import { formatPrice } from "@/lib/utils/format";
import { getProductImage } from "@/lib/utils/product-image";

// レビューダミーデータ
const reviews = [
  {
    name: "M.T",
    age: "30代",
    rating: 5,
    comment:
      "セラムを使い始めて2週間。肌のトーンが明らかに変わりました。",
  },
  {
    name: "K.S",
    age: "40代",
    rating: 5,
    comment:
      "クリームの質感が最高。翌朝のモチモチ感がやみつきです。",
  },
  {
    name: "A.Y",
    age: "30代",
    rating: 4,
    comment:
      "パッケージも美しくて、使うたびに気分が上がります。",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating}つ星`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i <= rating ? "#C9A96E" : "none"}
          stroke="#C9A96E"
          strokeWidth="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default async function Home() {
  const supabase = await createClient();

  // 人気商品を4つ取得
  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(4);

  const popularProducts = (products || []) as Product[];

  return (
    <>
      {/* ===== ヒーローセクション ===== */}
      <section className="relative w-full min-h-[520px] md:min-h-[640px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/hero-bg.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-soft-white/20" />
        <div className="relative z-10 text-center px-5 py-20 md:py-28">
          <p className="text-[10px] md:text-[11px] tracking-[0.35em] text-deep-charcoal/40 uppercase mb-4">
            Serene Beauty, Timeless Glow
          </p>
          <h1 className="font-heading text-[32px] md:text-[48px] lg:text-[56px] leading-tight tracking-wide text-deep-charcoal">
            穏やかに輝く、<br className="sm:hidden" />
            あなただけの美しさを。
          </h1>
          <p className="mt-5 text-[14px] md:text-[15px] text-deep-charcoal/60 max-w-md mx-auto leading-relaxed">
            自然の恵みと先進のサイエンスが織りなす、
            あなたの肌のための特別なスキンケア。
          </p>
          <Link
            href="/products"
            className="inline-block mt-8 md:mt-10 px-10 py-3.5 bg-deep-charcoal text-white text-[13px] tracking-[0.15em] rounded-md hover:bg-deep-charcoal/85 transition-colors"
          >
            製品を見る
          </Link>
        </div>
      </section>

      {/* ===== ブランドストーリー ===== */}
      <section className="py-20 md:py-28 px-5">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-10 md:gap-16 items-center">
            <div className="relative aspect-[4/5] rounded-md overflow-hidden order-2 md:order-1">
              <Image
                src="/images/brand-story.png"
                alt="SÉRAINEのブランドストーリー"
                fill
                className="object-cover"
              />
            </div>
            <div className="order-1 md:order-2 md:pl-4">
              <p className="text-[11px] tracking-[0.25em] text-champagne-gold uppercase mb-4">
                Our Philosophy
              </p>
              <h2 className="font-heading text-[28px] md:text-[36px] leading-snug tracking-wide text-deep-charcoal">
                美しさの哲学
              </h2>
              <p className="mt-6 text-[14px] leading-[2] text-deep-charcoal/65 max-w-lg">
                私たちは、真の美しさはシンプルさと自然の中にあると信じています。
                SÉRAINEは、厳選された植物エキスと先進のサイエンスを融合し、
                あなたの肌を内側から輝かせるスキンケアを創造します。
              </p>
              <p className="mt-4 text-[14px] leading-[2] text-deep-charcoal/65 max-w-lg">
                心を込めたセルフケアの時間が、
                あなた本来の輝きを引き出し、
                唯一無二の美しさを祝福する——
                それがSÉRAINEの願いです。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 人気の製品 ===== */}
      <section className="py-20 md:py-28 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] tracking-[0.25em] text-champagne-gold uppercase mb-3">
              Best Sellers
            </p>
            <h2 className="font-heading text-[28px] md:text-[36px] tracking-wide text-deep-charcoal">
              人気の製品
            </h2>
          </div>

          {/* 非対称グリッド: 2カラムだが高さを変える */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10 md:gap-x-7">
            {popularProducts.map((product, i) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className={`group block ${i % 2 === 1 ? "md:mt-8" : ""}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-blush-pink/20">
                  <Image
                    src={getProductImage(product)}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    priority={i < 2}
                  />
                </div>
                <div className="mt-4 px-1">
                  <h3 className="text-[13px] md:text-[14px] tracking-wide text-deep-charcoal/80 group-hover:text-deep-charcoal transition-colors">
                    {product.name}
                  </h3>
                  <p className="mt-1.5 font-price text-[14px] md:text-[15px] tracking-wide text-deep-charcoal">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link
              href="/products"
              className="inline-block px-10 py-3.5 border border-deep-charcoal text-deep-charcoal text-[13px] tracking-[0.15em] rounded-md hover:bg-deep-charcoal hover:text-white transition-colors"
            >
              すべての製品を見る
            </Link>
          </div>
        </div>
      </section>

      {/* ===== こだわり ===== */}
      <section className="py-20 md:py-28 px-5">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-10 md:gap-16 items-center">
            <div>
              <p className="text-[11px] tracking-[0.25em] text-champagne-gold uppercase mb-4">
                Our Commitment
              </p>
              <h2 className="font-heading text-[28px] md:text-[36px] leading-snug tracking-wide text-deep-charcoal">
                <span className="font-price">3</span>つのこだわり
              </h2>

              <div className="mt-10 space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-[1px] bg-champagne-gold" />
                    <h3 className="text-[15px] font-medium tracking-wide text-deep-charcoal">
                      厳選された天然成分
                    </h3>
                  </div>
                  <p className="text-[13px] leading-[1.9] text-deep-charcoal/60 pl-11">
                    世界中から厳選した希少な植物エキスを贅沢に配合。
                    お肌に本当に必要なものだけを届けます。
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-[1px] bg-champagne-gold" />
                    <h3 className="text-[15px] font-medium tracking-wide text-deep-charcoal">
                      先進のサイエンス製法
                    </h3>
                  </div>
                  <p className="text-[13px] leading-[1.9] text-deep-charcoal/60 pl-11">
                    最新のバイオテクノロジーで成分の浸透力を最大化。
                    自然と科学の最適なバランスを追求しています。
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-[1px] bg-champagne-gold" />
                    <h3 className="text-[15px] font-medium tracking-wide text-deep-charcoal">
                      サステナブルな美しさ
                    </h3>
                  </div>
                  <p className="text-[13px] leading-[1.9] text-deep-charcoal/60 pl-11">
                    環境に配慮したパッケージと製造プロセス。
                    美しさを追求しながら、地球にもやさしく。
                  </p>
                </div>
              </div>
            </div>

            <div className="relative aspect-[4/5] rounded-md overflow-hidden">
              <Image
                src="/images/ingredient.png"
                alt="SÉRAINEのこだわり"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== お客様の声 ===== */}
      <section className="py-20 md:py-28 px-5 bg-blush-pink/30">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] tracking-[0.25em] text-champagne-gold uppercase mb-3">
              Testimonials
            </p>
            <h2 className="font-heading text-[28px] md:text-[36px] tracking-wide text-deep-charcoal">
              お客様の声
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {reviews.map((review, i) => (
              <div
                key={i}
                className="bg-white rounded-md px-7 py-8 md:px-8 md:py-9"
              >
                <StarRating rating={review.rating} />
                <p className="mt-5 text-[13px] leading-[1.9] text-deep-charcoal/70">
                  {review.comment}
                </p>
                <div className="mt-6 pt-5 border-t border-border-light">
                  <p className="text-[13px] font-medium text-deep-charcoal">
                    {review.name}
                  </p>
                  <p className="text-[11px] text-deep-charcoal/40 mt-0.5">
                    {review.age}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative w-full min-h-[360px] md:min-h-[440px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/cta-bg.jpg"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-deep-charcoal/50" />
        <div className="relative z-10 text-center px-5 py-16">
          <h2 className="font-heading text-[28px] md:text-[40px] tracking-wide text-white leading-snug">
            あなたの肌に最高のケアを。
          </h2>
          <Link
            href="/products"
            className="inline-block mt-8 px-10 py-3.5 bg-champagne-gold text-white text-[13px] tracking-[0.15em] rounded-md hover:bg-champagne-gold-dark transition-colors"
          >
            ショッピングを始める
          </Link>
        </div>
      </section>
    </>
  );
}

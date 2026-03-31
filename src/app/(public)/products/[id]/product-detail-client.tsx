"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, Check } from "lucide-react";
import type { Product } from "@/types/database";
import { formatPrice } from "@/lib/utils/format";
import { getProductImage } from "@/lib/utils/product-image";
import { useCart } from "@/lib/cart-context";

interface Props {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({
  product,
  relatedProducts,
}: Props) {
  const { addItem, isAdding } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const imageSrc = getProductImage(product);
  const isCurrentlyAdding = isAdding === product.id;

  function handleAddToCart() {
    addItem(product.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="py-8 md:py-16 px-5">
      <div className="max-w-[1200px] mx-auto">
        {/* パンくず */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-[13px] text-deep-charcoal/50 hover:text-deep-charcoal transition-colors mb-8 md:mb-12"
        >
          <ArrowLeft size={16} />
          製品一覧に戻る
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-10 md:gap-16">
          {/* 商品画像 */}
          <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden rounded-md bg-blush-pink/20">
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 55vw"
            />
          </div>

          {/* 商品情報 */}
          <div className="flex flex-col">
            {product.category && (
              <p className="text-[11px] tracking-[0.2em] text-champagne-gold uppercase mb-3">
                {product.category.name}
              </p>
            )}

            <h1 className="font-heading text-[28px] md:text-[36px] tracking-wide text-deep-charcoal leading-snug">
              {product.name}
            </h1>

            <p className="mt-4 font-price text-[20px] md:text-[24px] tracking-wide text-deep-charcoal">
              {formatPrice(product.price)}
            </p>

            {/* 説明 */}
            {product.description && (
              <div className="mt-8 pt-8 border-t border-border-light">
                <p className="text-[14px] leading-[2] text-deep-charcoal/65">
                  {product.description}
                </p>
              </div>
            )}

            {/* 成分 */}
            {product.ingredients && (
              <div className="mt-8 pt-8 border-t border-border-light">
                <h2 className="text-[12px] tracking-[0.15em] text-deep-charcoal/50 uppercase mb-3">
                  成分
                </h2>
                <p className="text-[13px] leading-[1.9] text-deep-charcoal/55">
                  {product.ingredients}
                </p>
              </div>
            )}

            {/* 数量 + カートに追加 */}
            <div className="mt-8 pt-8 border-t border-border-light">
              <div className="flex items-center gap-6">
                {/* 数量セレクター */}
                <div className="flex items-center border border-border-light rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-deep-charcoal/50 hover:text-deep-charcoal transition-colors"
                    aria-label="数量を減らす"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 h-10 flex items-center justify-center font-price text-[14px] text-deep-charcoal border-x border-border-light">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-deep-charcoal/50 hover:text-deep-charcoal transition-colors"
                    aria-label="数量を増やす"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* カートに追加ボタン */}
                <button
                  onClick={handleAddToCart}
                  disabled={isCurrentlyAdding || product.stock === 0}
                  className={`flex-1 h-12 flex items-center justify-center gap-2 text-[13px] tracking-[0.1em] rounded-md transition-all duration-300 ${
                    added
                      ? "bg-champagne-gold text-white"
                      : product.stock === 0
                        ? "bg-deep-charcoal/20 text-deep-charcoal/40 cursor-not-allowed"
                        : "bg-deep-charcoal text-white hover:bg-deep-charcoal/85"
                  }`}
                >
                  {added ? (
                    <>
                      <Check size={16} />
                      カートに追加しました
                    </>
                  ) : product.stock === 0 ? (
                    "在庫切れ"
                  ) : (
                    "カートに追加"
                  )}
                </button>
              </div>

              {product.stock > 0 && product.stock <= 5 && (
                <p className="mt-3 text-[12px] text-champagne-gold">
                  残り{product.stock}点
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 関連商品 */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 md:mt-28 pt-16 border-t border-border-light">
            <h2 className="font-heading text-[24px] md:text-[28px] tracking-wide text-deep-charcoal text-center mb-10">
              関連商品
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8 md:gap-x-7">
              {relatedProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group block"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-blush-pink/20">
                    <Image
                      src={getProductImage(p)}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-3 px-1">
                    <h3 className="text-[13px] tracking-wide text-deep-charcoal/80 group-hover:text-deep-charcoal transition-colors">
                      {p.name}
                    </h3>
                    <p className="mt-1 font-price text-[14px] tracking-wide text-deep-charcoal">
                      {formatPrice(p.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

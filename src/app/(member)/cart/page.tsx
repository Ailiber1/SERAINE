"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils/format";
import { getProductImage } from "@/lib/utils/product-image";
import type { Product } from "@/types/database";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalItems } = useCart();

  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  if (totalItems === 0) {
    return (
      <div className="py-20 md:py-32 px-5">
        <div className="max-w-[600px] mx-auto text-center">
          <ShoppingBag
            size={48}
            strokeWidth={1}
            className="mx-auto text-deep-charcoal/20 mb-6"
          />
          <h1 className="font-heading text-[28px] md:text-[36px] tracking-wide text-deep-charcoal mb-4">
            カートは空です
          </h1>
          <p className="text-[14px] text-deep-charcoal/50 mb-10">
            まだ商品がカートに入っていません。
          </p>
          <Link
            href="/products"
            className="inline-block px-10 py-3.5 bg-deep-charcoal text-white text-[13px] tracking-[0.15em] rounded-md hover:bg-deep-charcoal/85 transition-colors"
          >
            製品を見る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-20 px-5">
      <div className="max-w-[900px] mx-auto">
        <h1 className="font-heading text-[28px] md:text-[36px] tracking-wide text-deep-charcoal text-center mb-12 md:mb-16">
          ショッピングカート
        </h1>

        <div className="flex flex-col gap-0">
          {/* カート項目 */}
          {items.map((item) => {
            if (!item.product) return null;
            const product = item.product as Product;
            const imageSrc = getProductImage(product);

            return (
              <div
                key={item.product_id}
                className="flex gap-4 md:gap-6 py-6 border-b border-border-light"
              >
                {/* 画像 */}
                <Link
                  href={`/products/${product.id}`}
                  className="relative w-[90px] md:w-[120px] aspect-[3/4] flex-shrink-0 overflow-hidden rounded-md bg-blush-pink/20"
                >
                  <Image
                    src={imageSrc}
                    alt={product.name}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </Link>

                {/* 商品情報 */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <Link
                        href={`/products/${product.id}`}
                        className="text-[14px] tracking-wide text-deep-charcoal hover:text-champagne-gold transition-colors"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 font-price text-[14px] text-deep-charcoal/70">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="p-1.5 text-deep-charcoal/30 hover:text-error transition-colors flex-shrink-0"
                      aria-label="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* 数量 + 小計 */}
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <div className="flex items-center border border-border-light rounded-md">
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center text-deep-charcoal/50 hover:text-deep-charcoal transition-colors disabled:opacity-30"
                        aria-label="数量を減らす"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 h-8 flex items-center justify-center font-price text-[13px] text-deep-charcoal border-x border-border-light">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity + 1)
                        }
                        className="w-8 h-8 flex items-center justify-center text-deep-charcoal/50 hover:text-deep-charcoal transition-colors"
                        aria-label="数量を増やす"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <p className="font-price text-[15px] tracking-wide text-deep-charcoal">
                      {formatPrice(product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 合計 */}
        <div className="mt-8 pt-6 border-t border-deep-charcoal/10">
          <div className="flex justify-between items-center">
            <span className="text-[14px] text-deep-charcoal/60">小計</span>
            <span className="font-price text-[20px] tracking-wide text-deep-charcoal">
              {formatPrice(subtotal)}
            </span>
          </div>
          <p className="mt-2 text-[12px] text-deep-charcoal/40">
            送料はチェックアウト時に計算されます
          </p>
        </div>

        {/* アクション */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/products"
            className="flex-1 h-14 flex items-center justify-center border-2 border-deep-charcoal text-deep-charcoal text-[14px] tracking-[0.1em] rounded-md hover:bg-deep-charcoal hover:text-white transition-colors font-medium"
          >
            買い物を続ける
          </Link>
          <Link
            href="/checkout"
            className="flex-1 h-14 flex items-center justify-center bg-deep-charcoal text-white text-[14px] tracking-[0.1em] rounded-md hover:bg-deep-charcoal/85 transition-colors font-medium"
          >
            レジに進む
          </Link>
        </div>
      </div>
    </div>
  );
}

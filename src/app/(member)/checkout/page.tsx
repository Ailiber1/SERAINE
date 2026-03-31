"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils/format";
import { getProductImage } from "@/lib/utils/product-image";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, ChevronLeft, Truck, Shield } from "lucide-react";
import type { Product, ShippingSettings } from "@/types/database";

const DEFAULT_SHIPPING_FEE = 550;
const DEFAULT_FREE_THRESHOLD = 8000;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, totalItems } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    fee: DEFAULT_SHIPPING_FEE,
    free_threshold: DEFAULT_FREE_THRESHOLD,
  });

  // フォーム状態
  const [form, setForm] = useState({
    name: "",
    postalCode: "",
    address: "",
    phone: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 送料設定を取得
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "shipping")
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const val = data.value as { fee?: number; free_threshold?: number };
          setShippingSettings({
            fee: typeof val.fee === "number" ? val.fee : DEFAULT_SHIPPING_FEE,
            free_threshold:
              typeof val.free_threshold === "number"
                ? val.free_threshold
                : DEFAULT_FREE_THRESHOLD,
          });
        }
      });
  }, []);

  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  const shippingFee =
    subtotal >= shippingSettings.free_threshold ? 0 : shippingSettings.fee;
  const total = subtotal + shippingFee;

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) errors.name = "お名前を入力してください";
    if (!form.postalCode.trim()) {
      errors.postalCode = "郵便番号を入力してください";
    } else if (!/^\d{3}-?\d{4}$/.test(form.postalCode)) {
      errors.postalCode = "郵便番号の形式が正しくありません（例: 123-4567）";
    }
    if (!form.address.trim()) errors.address = "住所を入力してください";
    if (!form.phone.trim()) {
      errors.phone = "電話番号を入力してください";
    } else if (!/^[\d-]{10,15}$/.test(form.phone)) {
      errors.phone = "電話番号の形式が正しくありません";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;
    if (items.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
          shipping: {
            name: form.name.trim(),
            postal_code: form.postalCode.trim(),
            address: form.address.trim(),
            phone: form.phone.trim(),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "エラーが発生しました");
        setIsSubmitting(false);
        return;
      }

      // 注文IDをsessionStorageに保存（完了画面で使う）
      if (data.orderId) {
        sessionStorage.setItem("seraine_last_order_id", data.orderId);
      }

      // カートをクリア
      clearCart();

      // Stripe Checkoutにリダイレクト
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("通信エラーが発生しました。もう一度お試しください。");
      setIsSubmitting(false);
    }
  }

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
            カートが空です
          </h1>
          <p className="text-[14px] text-deep-charcoal/50 mb-10">
            商品をカートに追加してからチェックアウトへお進みください。
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
    <div className="py-10 md:py-16 px-5">
      <div className="max-w-[960px] mx-auto">
        {/* 戻るリンク */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-1 text-[13px] text-deep-charcoal/50 hover:text-deep-charcoal transition-colors mb-8"
        >
          <ChevronLeft size={16} />
          カートに戻る
        </Link>

        <h1 className="font-heading text-[28px] md:text-[36px] tracking-wide text-deep-charcoal mb-10 md:mb-14">
          チェックアウト
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
            {/* 左: 配送先入力 */}
            <div className="flex-1 lg:max-w-[520px]">
              <h2 className="text-[15px] tracking-wide font-medium text-deep-charcoal mb-6">
                お届け先情報
              </h2>

              <div className="flex flex-col gap-5">
                {/* 名前 */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-[12px] tracking-wide text-deep-charcoal/60 mb-1.5"
                  >
                    お名前 <span className="text-error">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="w-full h-11 px-4 text-[14px] bg-white border border-border-light rounded-md focus:outline-none focus:border-champagne-gold transition-colors"
                    placeholder="山田 花子"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-[12px] text-error">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* 郵便番号 */}
                <div>
                  <label
                    htmlFor="postalCode"
                    className="block text-[12px] tracking-wide text-deep-charcoal/60 mb-1.5"
                  >
                    郵便番号 <span className="text-error">*</span>
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    value={form.postalCode}
                    onChange={(e) =>
                      setForm({ ...form, postalCode: e.target.value })
                    }
                    className="w-full h-11 px-4 text-[14px] bg-white border border-border-light rounded-md focus:outline-none focus:border-champagne-gold transition-colors"
                    placeholder="123-4567"
                    inputMode="numeric"
                  />
                  {formErrors.postalCode && (
                    <p className="mt-1 text-[12px] text-error">
                      {formErrors.postalCode}
                    </p>
                  )}
                </div>

                {/* 住所 */}
                <div>
                  <label
                    htmlFor="address"
                    className="block text-[12px] tracking-wide text-deep-charcoal/60 mb-1.5"
                  >
                    住所 <span className="text-error">*</span>
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    className="w-full h-11 px-4 text-[14px] bg-white border border-border-light rounded-md focus:outline-none focus:border-champagne-gold transition-colors"
                    placeholder="東京都渋谷区xxx 1-2-3 マンション名 101"
                  />
                  {formErrors.address && (
                    <p className="mt-1 text-[12px] text-error">
                      {formErrors.address}
                    </p>
                  )}
                </div>

                {/* 電話番号 */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-[12px] tracking-wide text-deep-charcoal/60 mb-1.5"
                  >
                    電話番号 <span className="text-error">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full h-11 px-4 text-[14px] bg-white border border-border-light rounded-md focus:outline-none focus:border-champagne-gold transition-colors"
                    placeholder="090-1234-5678"
                    inputMode="tel"
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-[12px] text-error">
                      {formErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* 安心の印 */}
              <div className="mt-8 flex flex-col gap-3">
                <div className="flex items-center gap-2.5 text-[12px] text-deep-charcoal/50">
                  <Shield size={14} strokeWidth={1.5} />
                  SSL暗号化通信で安全にお支払い
                </div>
                <div className="flex items-center gap-2.5 text-[12px] text-deep-charcoal/50">
                  <Truck size={14} strokeWidth={1.5} />
                  {formatPrice(shippingSettings.free_threshold)}
                  以上のご購入で送料無料
                </div>
              </div>
            </div>

            {/* 右: 注文サマリー */}
            <div className="lg:w-[360px] lg:flex-shrink-0">
              <div className="bg-white border border-border-light rounded-lg p-6">
                <h2 className="text-[15px] tracking-wide font-medium text-deep-charcoal mb-5">
                  ご注文内容
                </h2>

                <div className="flex flex-col gap-4 mb-6">
                  {items.map((item) => {
                    if (!item.product) return null;
                    const product = item.product as Product;
                    const imageSrc = getProductImage(product);

                    return (
                      <div
                        key={item.product_id}
                        className="flex gap-3"
                      >
                        <div className="relative w-[56px] aspect-[3/4] flex-shrink-0 overflow-hidden rounded bg-blush-pink/20">
                          <Image
                            src={imageSrc}
                            alt={product.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] tracking-wide text-deep-charcoal truncate">
                            {product.name}
                          </p>
                          <p className="mt-0.5 text-[12px] text-deep-charcoal/50">
                            数量: {item.quantity}
                          </p>
                        </div>
                        <p className="font-price text-[13px] text-deep-charcoal flex-shrink-0">
                          {formatPrice(product.price * item.quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border-light pt-4 flex flex-col gap-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-deep-charcoal/60">小計</span>
                    <span className="font-price text-deep-charcoal">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-deep-charcoal/60">送料</span>
                    <span className="font-price text-deep-charcoal">
                      {shippingFee === 0 ? "無料" : formatPrice(shippingFee)}
                    </span>
                  </div>
                  <div className="mt-2 pt-3 border-t border-border-light flex justify-between">
                    <span className="text-[14px] font-medium text-deep-charcoal">
                      合計（税込）
                    </span>
                    <span className="font-price text-[18px] tracking-wide text-deep-charcoal">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                {/* エラー表示 */}
                {error && (
                  <div className="mt-4 p-3 bg-error/5 border border-error/20 rounded-md">
                    <p className="text-[13px] text-error">{error}</p>
                  </div>
                )}

                {/* 注文確定ボタン */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 w-full h-12 flex items-center justify-center bg-deep-charcoal text-white text-[13px] tracking-[0.12em] rounded-md hover:bg-deep-charcoal/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      処理中...
                    </span>
                  ) : (
                    "お支払いへ進む"
                  )}
                </button>

                <p className="mt-3 text-[11px] text-deep-charcoal/40 text-center">
                  Stripeの安全な決済画面に移動します
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

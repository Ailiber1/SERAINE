"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { Suspense } from "react";
function CompleteContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    // 決済完了後にカートをクリア（localStorageを直接操作）
    localStorage.removeItem("seraine-cart");

    // sessionStorageから注文IDを取得
    const storedOrderId = sessionStorage.getItem("seraine_last_order_id");
    if (storedOrderId) {
      setOrderId(storedOrderId);
      sessionStorage.removeItem("seraine_last_order_id");
    }
  }, []);

  const orderNumber = orderId ? orderId.slice(0, 8).toUpperCase() : null;

  return (
    <div className="py-16 md:py-24 px-5">
      <div className="max-w-[560px] mx-auto text-center">
        {/* 成功アイコン */}
        <div className="mb-8">
          <CheckCircle
            size={56}
            strokeWidth={1}
            className="mx-auto text-champagne-gold"
          />
        </div>

        <h1 className="font-heading text-[32px] md:text-[40px] tracking-wide text-deep-charcoal mb-4">
          ご注文ありがとうございます
        </h1>

        <p className="text-[14px] text-deep-charcoal/60 leading-relaxed mb-8">
          ご注文を承りました。
          <br />
          商品の発送準備が整い次第、ご連絡いたします。
        </p>

        {/* 注文番号 */}
        {orderNumber && (
          <div className="bg-white border border-border-light rounded-lg p-6 mb-8">
            <p className="text-[12px] tracking-wide text-deep-charcoal/50 mb-1">
              注文番号
            </p>
            <p className="font-price text-[20px] tracking-[0.1em] text-deep-charcoal font-medium">
              #{orderNumber}
            </p>
          </div>
        )}

        {sessionId && !orderNumber && (
          <div className="bg-white border border-border-light rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center gap-2 text-[14px] text-deep-charcoal/60">
              <Package size={18} strokeWidth={1.5} />
              決済が完了しました
            </div>
          </div>
        )}

        {/* ナビゲーション */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/mypage"
            className="inline-flex items-center justify-center gap-2 h-11 px-8 bg-deep-charcoal text-white text-[13px] tracking-[0.1em] rounded-md hover:bg-deep-charcoal/85 transition-colors"
          >
            マイページで確認
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center h-11 px-8 border border-deep-charcoal text-deep-charcoal text-[13px] tracking-[0.1em] rounded-md hover:bg-deep-charcoal hover:text-white transition-colors"
          >
            お買い物を続ける
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 md:py-24 px-5 text-center">
          <div className="w-8 h-8 border-2 border-border-light border-t-champagne-gold rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <CompleteContent />
    </Suspense>
  );
}

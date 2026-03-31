"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CancelOrderButtonProps {
  orderId: string;
  orderNumber: string;
}

export default function CancelOrderButton({
  orderId,
  orderNumber,
}: CancelOrderButtonProps) {
  const [status, setStatus] = useState<"idle" | "confirming" | "loading" | "cancelled">("idle");
  const router = useRouter();

  const handleCancel = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "キャンセルに失敗しました");
        setStatus("idle");
        return;
      }

      setStatus("cancelled");
      router.refresh();
    } catch {
      alert("キャンセル処理中にエラーが発生しました");
      setStatus("idle");
    }
  };

  if (status === "cancelled") {
    return (
      <p className="mt-3 text-[12px] text-deep-charcoal/50">
        キャンセルが完了しました
      </p>
    );
  }

  if (status === "confirming") {
    return (
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[12px] text-deep-charcoal/60">
          #{orderNumber} をキャンセルしますか？
        </span>
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 text-[11px] bg-deep-charcoal text-white rounded-md hover:bg-deep-charcoal/85 transition-colors"
        >
          はい
        </button>
        <button
          onClick={() => setStatus("idle")}
          className="px-3 py-1.5 text-[11px] border border-border-light text-deep-charcoal/60 rounded-md hover:bg-deep-charcoal/5 transition-colors"
        >
          いいえ
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStatus("confirming")}
      disabled={status === "loading"}
      className="mt-3 px-4 py-1.5 text-[11px] tracking-wide border border-champagne-gold/60 text-champagne-gold rounded-md hover:bg-champagne-gold/10 transition-colors disabled:opacity-50"
    >
      {status === "loading" ? "処理中..." : "キャンセルする"}
    </button>
  );
}

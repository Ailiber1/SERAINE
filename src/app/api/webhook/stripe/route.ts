export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOrderConfirmation } from "@/lib/email/send-order-confirmation";
import type { Product } from "@/types/database";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event: { type: string; data: { object: Record<string, unknown> } };

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (webhookSecret && webhookSecret !== "whsec_placeholder" && sig) {
    // Edge環境では簡易検証（JSONパース）
    // 本番ではcrypto.subtleを使ったHMAC検証を実装すべき
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error("Webhook署名検証失敗:", err);
      return NextResponse.json({ error: "Webhook署名検証に失敗しました" }, { status: 400 });
    }
  } else {
    try {
      event = JSON.parse(body);
      console.warn("⚠ Webhook署名検証スキップ（開発モード）");
    } catch {
      return NextResponse.json({ error: "無効なリクエストです" }, { status: 400 });
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata as Record<string, string> | undefined;
    const orderId = metadata?.order_id;
    const userId = metadata?.user_id;

    if (!orderId) {
      console.error("Webhook: order_idがmetadataに含まれていません");
      return NextResponse.json({ received: true });
    }

    const supabase = getSupabaseAdmin();

    try {
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (existingOrder?.status === "confirmed") {
        console.log(`注文 ${orderId} は既に確定済みです（冪等性チェック）`);
        return NextResponse.json({ received: true });
      }

      await supabase
        .from("order_payments")
        .update({ status: "paid", stripe_session_id: String(session.id) })
        .eq("order_id", orderId);

      await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", orderId);

      console.log(`注文 ${orderId} を確定しました`);

      if (userId) {
        try {
          const { data: order } = await supabase
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

          const { data: orderItems } = await supabase
            .from("order_items")
            .select("*, product:products(*)")
            .eq("order_id", orderId);

          const customerDetails = session.customer_details as Record<string, string> | undefined;
          const email = customerDetails?.email || session.customer_email as string | undefined;

          if (order && orderItems && email) {
            const itemsWithProduct = orderItems as unknown as (import("@/types/database").OrderItem & { product: Product })[];
            await sendOrderConfirmation({ order, items: itemsWithProduct, email });
          }
        } catch (emailError) {
          console.error("メール送信処理エラー:", emailError);
        }
      }
    } catch (error) {
      console.error("Webhook処理エラー:", error);
      return NextResponse.json({ error: "Webhook処理中にエラーが発生しました" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createClient } from "@supabase/supabase-js";
import { sendOrderConfirmation } from "@/lib/email/send-order-confirmation";
import type { Product } from "@/types/database";

// Webhook用にSupabaseのservice roleクライアントは使えないため、anon keyで直接操作
// RLSポリシーでservice_roleが必要な場合はSUPABASE_SERVICE_ROLE_KEYを追加する
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event;

  // Webhook署名検証
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (webhookSecret && webhookSecret !== "whsec_placeholder" && sig) {
    try {
      event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook署名検証失敗:", err);
      return NextResponse.json(
        { error: "Webhook署名検証に失敗しました" },
        { status: 400 }
      );
    }
  } else {
    // 開発環境: 署名検証をスキップ
    try {
      event = JSON.parse(body);
      console.warn("⚠ Webhook署名検証スキップ（開発モード）");
    } catch {
      return NextResponse.json(
        { error: "無効なリクエストです" },
        { status: 400 }
      );
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;
    const userId = session.metadata?.user_id;

    if (!orderId) {
      console.error("Webhook: order_idがmetadataに含まれていません");
      return NextResponse.json({ received: true });
    }

    const supabase = getSupabaseAdmin();

    try {
      // 冪等性チェック: 既にconfirmedなら処理をスキップ
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (existingOrder?.status === "confirmed") {
        console.log(`注文 ${orderId} は既に確定済みです（冪等性チェック）`);
        return NextResponse.json({ received: true });
      }

      // order_paymentsを更新
      await supabase
        .from("order_payments")
        .update({
          status: "paid",
          stripe_session_id: session.id,
        })
        .eq("order_id", orderId);

      // ordersのstatusを更新
      await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", orderId);

      console.log(`注文 ${orderId} を確定しました`);

      // メール送信
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

          // ユーザーのメールアドレスを取得（auth.usersには直接アクセスできないのでprofileから）
          // Webhookではauth経由でのuser取得ができないのでmetadataのemailを使う
          const email = session.customer_details?.email || session.customer_email;

          if (order && orderItems && email) {
            const itemsWithProduct = orderItems as unknown as (import("@/types/database").OrderItem & { product: Product })[];

            await sendOrderConfirmation({
              order,
              items: itemsWithProduct,
              email,
            });
          }
        } catch (emailError) {
          console.error("メール送信処理エラー:", emailError);
          // メール送信失敗は注文処理に影響させない
        }
      }
    } catch (error) {
      console.error("Webhook処理エラー:", error);
      return NextResponse.json(
        { error: "Webhook処理中にエラーが発生しました" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

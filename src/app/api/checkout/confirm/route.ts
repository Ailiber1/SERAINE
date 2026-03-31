export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendOrderConfirmation } from "@/lib/email/send-order-confirmation";
import type { OrderItem, Product, Order } from "@/types/database";

const STRIPE_API = "https://api.stripe.com/v1";

export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json();
    if (!session_id) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    // 認証チェック
    const cookieStore = request.cookies;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // Stripeセッションの状態を確認
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "決済設定エラー" }, { status: 500 });
    }

    const stripeRes = await fetch(`${STRIPE_API}/checkout/sessions/${session_id}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const stripeSession = await stripeRes.json();

    if (stripeSession.payment_status !== "paid") {
      return NextResponse.json({ error: "決済が完了していません" }, { status: 400 });
    }

    // metadataからorder_idを取得
    const orderId = stripeSession.metadata?.order_id;
    if (!orderId) {
      return NextResponse.json({ error: "注文情報が見つかりません" }, { status: 400 });
    }

    // 注文を確認済みに更新（まだpendingの場合のみ）
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (!order) {
      return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
    }

    if (order.status === "pending") {
      await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", orderId);

      await supabase
        .from("order_payments")
        .update({ status: "paid", stripe_session_id: session_id })
        .eq("order_id", orderId);
    }

    // 注文確認メール送信（まだ送信していない場合）
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && resendApiKey !== "your_resend_api_key" && user.email) {
      try {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("*, product:products(*)")
          .eq("order_id", orderId);

        if (orderItems && orderItems.length > 0) {
          await sendOrderConfirmation({
            order: { ...order, status: "confirmed" } as Order,
            items: orderItems as unknown as (OrderItem & { product: Product })[],
            email: user.email,
          });
        }
      } catch (emailErr) {
        console.error("注文確認メール送信エラー:", emailErr);
      }
    }

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error("決済確認エラー:", error);
    return NextResponse.json({ error: "決済確認中にエラーが発生しました" }, { status: 500 });
  }
}

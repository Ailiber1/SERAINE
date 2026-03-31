export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendOrderConfirmation } from "@/lib/email/send-order-confirmation";
import type { OrderItem, Product, Order } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const { session_id, order_id: clientOrderId } = await request.json();

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

    // order_idを特定（クライアントから送られたIDを優先、なければStripe APIから取得）
    let orderId = clientOrderId;

    if (!orderId && session_id) {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (stripeKey) {
        try {
          const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
            headers: { Authorization: `Bearer ${stripeKey}` },
          });
          const stripeSession = await stripeRes.json();
          orderId = stripeSession.metadata?.order_id;
        } catch (e) {
          console.error("Stripe API エラー:", e);
        }
      }
    }

    if (!orderId) {
      // order_idが取得できない場合、最新のpending注文を探す
      const { data: latestOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      orderId = latestOrder?.id;
    }

    if (!orderId) {
      return NextResponse.json({ error: "注文情報が見つかりません" }, { status: 400 });
    }

    // 注文を取得
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (!order) {
      return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
    }

    // 既に確認済みの場合はメール送信せず返す（リロード対策）
    if (order.status !== "pending") {
      return NextResponse.json({ success: true, orderId, alreadyConfirmed: true });
    }

    // ステータスを確認済みに更新
    await supabase
      .from("orders")
      .update({ status: "confirmed" })
      .eq("id", orderId);

    await supabase
      .from("order_payments")
      .update({ status: "paid", stripe_session_id: session_id || "" })
      .eq("order_id", orderId);

    // サーバー側でカートをクリア
    await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);

    // 注文確認メール送信
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
          console.log(`注文確認メール送信完了: ${user.email}`);
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

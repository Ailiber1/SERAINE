export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createCheckoutSession } from "@/lib/stripe/client";
import type { StripeLineItem } from "@/lib/stripe/client";

function validateCheckout(body: unknown): { items: { product_id: string; quantity: number }[]; shipping: { name: string; postal_code: string; address: string; phone: string } } | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.items) || b.items.length === 0) return null;
  if (!b.shipping || typeof b.shipping !== 'object') return null;
  const shipping = b.shipping as Record<string, unknown>;
  if (typeof shipping.name !== 'string' || !shipping.name) return null;
  if (typeof shipping.postal_code !== 'string') return null;
  if (typeof shipping.address !== 'string' || !shipping.address) return null;
  if (typeof shipping.phone !== 'string') return null;

  const items = b.items.map((item: unknown) => {
    const i = item as Record<string, unknown>;
    return { product_id: String(i.product_id), quantity: Number(i.quantity) };
  });

  return {
    items,
    shipping: {
      name: String(shipping.name),
      postal_code: String(shipping.postal_code),
      address: String(shipping.address),
      phone: String(shipping.phone),
    },
  };
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const parsed = validateCheckout(body);
    if (!parsed) {
      return NextResponse.json({ error: "入力内容に問題があります" }, { status: 400 });
    }

    const { items, shipping } = parsed;

    const productIds = items.map((i) => i.product_id);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, stock, is_active")
      .in("id", productIds)
      .eq("is_active", true);

    if (productsError || !products) {
      return NextResponse.json({ error: "商品情報の取得に失敗しました" }, { status: 500 });
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        return NextResponse.json({ error: "一部の商品が見つかりません" }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `「${product.name}」の在庫が不足しています` }, { status: 400 });
      }
    }

    let shippingFee = 550;
    let freeThreshold = 8000;
    const { data: shippingSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "shipping")
      .single();
    if (shippingSetting?.value) {
      const val = shippingSetting.value as { fee?: number; free_threshold?: number };
      if (typeof val.fee === "number") shippingFee = val.fee;
      if (typeof val.free_threshold === "number") freeThreshold = val.free_threshold;
    }

    const subtotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.product_id)!;
      return sum + product.price * item.quantity;
    }, 0);

    const finalShippingFee = subtotal >= freeThreshold ? 0 : shippingFee;
    const total = subtotal + finalShippingFee;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total,
        status: "pending",
        shipping_name: shipping.name,
        shipping_postal_code: shipping.postal_code.replace("-", ""),
        shipping_address: shipping.address,
        shipping_phone: shipping.phone,
        shipping_fee: finalShippingFee,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("注文作成エラー:", orderError);
      return NextResponse.json({ error: "注文の作成に失敗しました" }, { status: 500 });
    }

    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id)!;
      return {
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price * item.quantity,
      };
    });

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      console.error("注文アイテム作成エラー:", itemsError);
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: "注文アイテムの作成に失敗しました" }, { status: 500 });
    }

    const { error: paymentError } = await supabase
      .from("order_payments")
      .insert({ order_id: order.id, amount: total, status: "pending" });
    if (paymentError) {
      console.error("支払いレコード作成エラー:", paymentError);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const lineItems: StripeLineItem[] = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id)!;
      return {
        price_data: { currency: "jpy", product_data: { name: product.name }, unit_amount: product.price },
        quantity: item.quantity,
      };
    });

    if (finalShippingFee > 0) {
      lineItems.push({
        price_data: { currency: "jpy", product_data: { name: "送料" }, unit_amount: finalShippingFee },
        quantity: 1,
      });
    }

    const session = await createCheckoutSession({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      metadata: { order_id: order.id, user_id: user.id },
    });

    await supabase
      .from("order_payments")
      .update({ stripe_session_id: session.id })
      .eq("order_id", order.id);

    // 注文受付確認メールを送信
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && resendApiKey !== "your_resend_api_key" && user.email) {
      try {
        const orderItemsWithProduct = items.map((item) => {
          const product = products.find((p) => p.id === item.product_id)!;
          return {
            id: "", order_id: order.id, product_id: item.product_id,
            quantity: item.quantity, price: product.price * item.quantity, created_at: "",
            product: { id: product.id, name: product.name, price: product.price, stock: product.stock, image_urls: [] as string[], category_id: null, is_active: true, description: null, ingredients: null, created_at: "" },
          };
        });

        const { sendOrderConfirmation } = await import("@/lib/email/send-order-confirmation");
        await sendOrderConfirmation({
          order: order as import("@/types/database").Order,
          items: orderItemsWithProduct as (import("@/types/database").OrderItem & { product: import("@/types/database").Product })[],
          email: user.email,
        });
      } catch (emailErr) {
        console.error("注文確認メール送信エラー:", emailErr);
      }
    }

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (error) {
    console.error("チェックアウトエラー:", error);
    const message = error instanceof Error && error.message.includes("STRIPE_SECRET_KEY")
      ? "決済サービスの設定に問題があります。しばらく経ってからもう一度お試しください。"
      : "決済処理の接続に失敗しました。しばらく経ってからもう一度お試しください。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

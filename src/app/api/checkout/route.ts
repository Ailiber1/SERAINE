import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { stripe } from "@/lib/stripe/client";
import { z } from "zod";

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      product_id: z.string().uuid(),
      quantity: z.number().int().min(1).max(10),
    })
  ).min(1),
  shipping: z.object({
    name: z.string().min(1).max(100),
    postal_code: z.string().regex(/^\d{3}-?\d{4}$/, "郵便番号の形式が正しくありません"),
    address: z.string().min(1).max(500),
    phone: z.string().regex(/^[\d-]+$/, "電話番号の形式が正しくありません").min(10).max(15),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Cookie取得（認証用）
    const cookieStore = request.cookies;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // APIルートではcookie設定不要
          },
        },
      }
    );

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // リクエスト解析
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "入力内容に問題があります", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, shipping } = parsed.data;

    // 商品情報を取得
    const productIds = items.map((i) => i.product_id);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, stock, is_active")
      .in("id", productIds)
      .eq("is_active", true);

    if (productsError || !products) {
      return NextResponse.json(
        { error: "商品情報の取得に失敗しました" },
        { status: 500 }
      );
    }

    // 在庫チェック
    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        return NextResponse.json(
          { error: "一部の商品が見つかりません" },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `「${product.name}」の在庫が不足しています` },
          { status: 400 }
        );
      }
    }

    // 送料計算（site_settingsから取得を試みる）
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

    // 小計計算
    const subtotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.product_id)!;
      return sum + product.price * item.quantity;
    }, 0);

    const finalShippingFee = subtotal >= freeThreshold ? 0 : shippingFee;
    const total = subtotal + finalShippingFee;

    // 注文をDBに作成（status: pending）
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
      return NextResponse.json(
        { error: "注文の作成に失敗しました" },
        { status: 500 }
      );
    }

    // 注文アイテムを作成
    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id)!;
      return {
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price * item.quantity,
      };
    });

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("注文アイテム作成エラー:", itemsError);
      // ロールバック: 注文を削除
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "注文アイテムの作成に失敗しました" },
        { status: 500 }
      );
    }

    // 支払いレコードを作成（status: pending）
    const { error: paymentError } = await supabase
      .from("order_payments")
      .insert({
        order_id: order.id,
        amount: total,
        status: "pending",
      });

    if (paymentError) {
      console.error("支払いレコード作成エラー:", paymentError);
    }

    // Stripe Checkout Session作成
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const lineItems = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id)!;
      return {
        price_data: {
          currency: "jpy",
          product_data: {
            name: product.name,
          },
          unit_amount: product.price,
        },
        quantity: item.quantity,
      };
    });

    // 送料がある場合はline_itemsに追加
    if (finalShippingFee > 0) {
      lineItems.push({
        price_data: {
          currency: "jpy",
          product_data: {
            name: "送料",
          },
          unit_amount: finalShippingFee,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      metadata: {
        order_id: order.id,
        user_id: user.id,
      },
    });

    // stripe_session_idを支払いレコードに保存
    await supabase
      .from("order_payments")
      .update({ stripe_session_id: session.id })
      .eq("order_id", order.id);

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (error) {
    console.error("チェックアウトエラー:", error);
    return NextResponse.json(
      { error: "チェックアウト処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

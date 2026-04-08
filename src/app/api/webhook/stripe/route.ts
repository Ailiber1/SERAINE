export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOrderConfirmation } from "@/lib/email/send-order-confirmation";
import type { Product } from "@/types/database";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const parts = signature.split(",");
  const timestamp = parts.find(p => p.startsWith("t="))?.slice(2);
  const v1Sig = parts.find(p => p.startsWith("v1="))?.slice(3);

  if (!timestamp || !v1Sig) return false;

  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (age > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedSig === v1Sig;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !sig) {
    console.error("Webhook: STRIPE_WEBHOOK_SECRET未設定または署名なし");
    return NextResponse.json({ error: "署名検証に失敗しました" }, { status: 400 });
  }

  const isValid = await verifyStripeSignature(body, sig, webhookSecret);
  if (!isValid) {
    console.error("Webhook: 署名検証失敗");
    return NextResponse.json({ error: "署名検証に失敗しました" }, { status: 400 });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "無効なリクエストです" }, { status: 400 });
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

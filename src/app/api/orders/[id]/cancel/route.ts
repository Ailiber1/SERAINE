export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Resend } from "resend";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    // 認証チェック
    const cookieStore = request.cookies;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // 注文を取得（自分の注文のみ）
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*, product:products(id, name, price))")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "注文が見つかりません" },
        { status: 404 }
      );
    }

    // キャンセル可能なステータスか確認
    if (order.status !== "pending" && order.status !== "confirmed") {
      return NextResponse.json(
        { error: "この注文はキャンセルできません" },
        { status: 400 }
      );
    }

    // ステータスをcancelledに更新
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("注文キャンセルエラー:", updateError);
      return NextResponse.json(
        { error: "キャンセル処理に失敗しました" },
        { status: 500 }
      );
    }

    // キャンセル確認メール送信
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && resendApiKey !== "your_resend_api_key" && user.email) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: "SÉRAINE <onboarding@resend.dev>",
          to: user.email,
          subject: "【SÉRAINE】ご注文のキャンセルが完了しました",
          html: buildCancelConfirmationHtml(order),
        });
        console.log(`キャンセル確認メール送信完了: ${user.email}`);
      } catch (emailError) {
        console.error("キャンセルメール送信エラー:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("キャンセル処理エラー:", error);
    return NextResponse.json(
      { error: "キャンセル処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

interface OrderForEmail {
  id: string;
  total: number;
  shipping_fee: number;
  created_at: string;
  order_items: {
    quantity: number;
    price: number;
    product: { name: string } | null;
  }[];
}

function buildCancelConfirmationHtml(order: OrderForEmail): string {
  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const orderDate = new Date(order.created_at);
  const formattedDate = `${orderDate.getFullYear()}年${orderDate.getMonth() + 1}月${orderDate.getDate()}日`;

  const itemsHtml = order.order_items
    .map(
      (item) =>
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #E5E3DF;font-size:14px;color:#1A1A1A;">${item.product?.name || "商品"}</td>
          <td style="padding:10px 0;border-bottom:1px solid #E5E3DF;text-align:center;font-size:14px;color:#1A1A1A80;">${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #E5E3DF;text-align:right;font-size:14px;color:#1A1A1A;">&yen;${item.price.toLocaleString("ja-JP")}</td>
        </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#FAFAF8;">
  <div style="max-width:600px;margin:0 auto;font-family:'Helvetica Neue',Arial,'Noto Sans JP',sans-serif;color:#1A1A1A;background:#FFFFFF;">
    <!-- ヘッダー -->
    <div style="text-align:center;padding:40px 0 32px;border-bottom:1px solid #E5E3DF;">
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;letter-spacing:0.15em;margin:0;color:#1A1A1A;">SÉRAINE</h1>
    </div>

    <!-- 本文 -->
    <div style="padding:40px 32px;">
      <h2 style="font-size:18px;font-weight:500;margin:0 0 20px;color:#1A1A1A;">ご注文のキャンセルが完了しました</h2>
      <p style="font-size:14px;line-height:1.8;color:#1A1A1A99;margin:0 0 28px;">
        以下のご注文のキャンセル処理が完了いたしました。
      </p>

      <!-- 注文情報 -->
      <div style="background:#FAFAF8;border-radius:8px;padding:20px;margin:0 0 24px;">
        <div style="display:flex;justify-content:space-between;margin:0 0 8px;">
          <div>
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#1A1A1A60;margin:0 0 4px;">注文番号</p>
            <p style="font-size:16px;font-weight:600;margin:0;color:#1A1A1A;">#${orderNumber}</p>
          </div>
          <div style="text-align:right;">
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#1A1A1A60;margin:0 0 4px;">注文日</p>
            <p style="font-size:14px;margin:0;color:#1A1A1A;">${formattedDate}</p>
          </div>
        </div>
      </div>

      <!-- 商品一覧 -->
      <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
        <thead>
          <tr style="border-bottom:2px solid #1A1A1A;">
            <th style="padding:8px 0;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#1A1A1A80;">商品</th>
            <th style="padding:8px 0;text-align:center;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#1A1A1A80;">数量</th>
            <th style="padding:8px 0;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#1A1A1A80;">金額</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="border-top:1px solid #E5E3DF;padding-top:12px;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="font-size:14px;color:#1A1A1A80;padding:4px 0;">送料</td>
            <td style="font-size:14px;text-align:right;color:#1A1A1A;">${order.shipping_fee === 0 ? "無料" : `&yen;${order.shipping_fee.toLocaleString("ja-JP")}`}</td>
          </tr>
          <tr>
            <td style="font-size:16px;font-weight:600;color:#1A1A1A;padding:8px 0 0;">合計（キャンセル済み）</td>
            <td style="font-size:16px;font-weight:600;text-align:right;color:#C44;padding:8px 0 0;text-decoration:line-through;">&yen;${order.total.toLocaleString("ja-JP")}</td>
          </tr>
        </table>
      </div>

      <div style="border-left:3px solid #C9A96E;padding-left:16px;margin:0 0 28px;">
        <p style="font-size:13px;line-height:1.7;color:#1A1A1A80;margin:0;">
          決済済みの場合、返金処理は通常5〜10営業日で完了いたします。<br/>
          ご不明な点がございましたら、お気軽にお問い合わせください。
        </p>
      </div>

      <p style="font-size:12px;color:#1A1A1A60;margin:0;">
        ※ このメールは自動送信です。このメールへの返信はお受けできません。
      </p>
    </div>

    <!-- フッター -->
    <div style="text-align:center;padding:24px 32px;border-top:1px solid #E5E3DF;background:#FAFAF8;">
      <p style="font-size:11px;color:#1A1A1A40;margin:0;letter-spacing:0.1em;">
        &copy; SÉRAINE. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
}

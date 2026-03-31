import type { Order, OrderItem, Product } from "@/types/database";

interface OrderConfirmationParams {
  order: Order;
  items: (OrderItem & { product: Product })[];
  email: string;
}

export async function sendOrderConfirmation({
  order,
  items,
  email,
}: OrderConfirmationParams): Promise<void> {
  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #E5E3DF;">${item.product.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #E5E3DF;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #E5E3DF;text-align:right;">¥${item.price.toLocaleString("ja-JP")}</td>
        </tr>`
    )
    .join("");

  const htmlBody = `
    <div style="max-width:600px;margin:0 auto;font-family:'Noto Sans JP',sans-serif;color:#1A1A1A;">
      <div style="text-align:center;padding:32px 0;border-bottom:1px solid #E5E3DF;">
        <h1 style="font-family:'Cormorant Garamond',serif;font-size:28px;letter-spacing:0.15em;margin:0;">SERAINE</h1>
      </div>
      <div style="padding:32px 24px;">
        <h2 style="font-size:18px;margin:0 0 16px;">ご注文ありがとうございます</h2>
        <p style="font-size:14px;color:#1A1A1A99;margin:0 0 24px;">
          ご注文を承りました。商品の発送準備が整い次第、改めてご連絡いたします。
        </p>
        <div style="background:#FAFAF8;padding:16px;border-radius:8px;margin:0 0 24px;">
          <p style="font-size:12px;color:#1A1A1A80;margin:0 0 4px;">注文番号</p>
          <p style="font-size:16px;font-weight:600;margin:0;">${order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 24px;">
          <thead>
            <tr style="border-bottom:2px solid #1A1A1A;">
              <th style="padding:8px 0;text-align:left;">商品</th>
              <th style="padding:8px 0;text-align:center;">数量</th>
              <th style="padding:8px 0;text-align:right;">金額</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div style="border-top:1px solid #E5E3DF;padding-top:16px;">
          <div style="display:flex;justify-content:space-between;font-size:14px;margin:0 0 8px;">
            <span>送料</span>
            <span>${order.shipping_fee === 0 ? "無料" : `¥${order.shipping_fee.toLocaleString("ja-JP")}`}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:600;">
            <span>合計</span>
            <span>¥${order.total.toLocaleString("ja-JP")}</span>
          </div>
        </div>
        <div style="margin-top:24px;padding:16px;background:#FAFAF8;border-radius:8px;">
          <p style="font-size:12px;color:#1A1A1A80;margin:0 0 4px;">お届け先</p>
          <p style="font-size:14px;margin:0;">
            ${order.shipping_name}<br/>
            〒${order.shipping_postal_code}<br/>
            ${order.shipping_address}<br/>
            ${order.shipping_phone}
          </p>
        </div>
      </div>
      <div style="text-align:center;padding:24px;border-top:1px solid #E5E3DF;font-size:12px;color:#1A1A1A60;">
        © SERAINE. All rights reserved.
      </div>
    </div>
  `;

  // Resend APIキーが未設定の場合はconsole.logにフォールバック
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey || resendApiKey === "your_resend_api_key") {
    console.log("=== 注文確認メール（Resend未設定のためconsole出力） ===");
    console.log(`宛先: ${email}`);
    console.log(`注文番号: ${order.id.slice(0, 8).toUpperCase()}`);
    console.log(`合計: ¥${order.total.toLocaleString("ja-JP")}`);
    console.log("=== メール送信スキップ ===");
    return;
  }

  // Resend REST APIを使ってメール送信（fetch APIベース、SDKなし）
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SÉRAINE <onboarding@resend.dev>",
        to: [email],
        subject: `【SERAINE】ご注文確認 #${order.id.slice(0, 8).toUpperCase()}`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend API error: ${err}`);
    }

    console.log(`注文確認メール送信完了: ${email}`);
  } catch (error) {
    console.error("メール送信エラー:", error);
    // メール送信失敗は注文処理に影響させない
  }
}

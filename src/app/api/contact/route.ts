export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function validateContact(body: unknown): { name: string; email: string; subject: string; message: string } | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (typeof b.name !== 'string' || !b.name || b.name.length > 100) return null;
  if (typeof b.email !== 'string' || !b.email.includes('@')) return null;
  if (typeof b.subject !== 'string' || !b.subject || b.subject.length > 200) return null;
  if (typeof b.message !== 'string' || !b.message || b.message.length > 5000) return null;
  return { name: b.name, email: b.email, subject: b.subject, message: b.message };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = validateContact(body);

    if (!parsed) {
      return NextResponse.json(
        { error: "入力内容に問題があります" },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed;

    // Supabaseに保存
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

    const { error: dbError } = await supabase.from("contacts").insert({
      name,
      email,
      subject,
      message,
    });

    if (dbError) {
      console.error("お問い合わせ保存エラー:", dbError);
      return NextResponse.json(
        { error: "お問い合わせの保存に失敗しました" },
        { status: 500 }
      );
    }

    // Resendで受付確認メール送信
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && resendApiKey !== "your_resend_api_key") {
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
            subject: "【SÉRAINE】お問い合わせを受け付けました",
            html: buildContactConfirmationHtml(name, subject, message),
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        console.log(`お問い合わせ確認メール送信完了: ${email}`);
      } catch (emailError) {
        console.error("メール送信エラー:", emailError);
        // メール送信失敗はお問い合わせ保存に影響させない
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("お問い合わせ処理エラー:", error);
    return NextResponse.json(
      { error: "お問い合わせの処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

function buildContactConfirmationHtml(
  name: string,
  subject: string,
  message: string
): string {
  const truncatedMessage =
    message.length > 200 ? message.substring(0, 200) + "..." : message;

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
      <p style="font-size:15px;line-height:1.8;margin:0 0 8px;color:#1A1A1A;">
        ${name} 様
      </p>
      <p style="font-size:14px;line-height:1.8;color:#1A1A1A99;margin:0 0 28px;">
        この度はSÉRAINEへお問い合わせいただき、誠にありがとうございます。<br/>
        以下の内容でお問い合わせを承りました。
      </p>

      <!-- お問い合わせ内容 -->
      <div style="background:#FAFAF8;border-radius:8px;padding:24px;margin:0 0 28px;">
        <div style="margin:0 0 16px;">
          <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#1A1A1A60;margin:0 0 4px;">件名</p>
          <p style="font-size:14px;margin:0;color:#1A1A1A;">${subject}</p>
        </div>
        <div>
          <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#1A1A1A60;margin:0 0 4px;">お問い合わせ内容</p>
          <p style="font-size:14px;margin:0;color:#1A1A1A;line-height:1.7;">${truncatedMessage}</p>
        </div>
      </div>

      <div style="border-left:3px solid #C9A96E;padding-left:16px;margin:0 0 28px;">
        <p style="font-size:13px;line-height:1.7;color:#1A1A1A80;margin:0;">
          内容を確認の上、通常2〜3営業日以内にご返信いたします。<br/>
          今しばらくお待ちくださいませ。
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

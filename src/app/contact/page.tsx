"use client";

import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "送信に失敗しました");
      }

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "送信中にエラーが発生しました"
      );
    }
  };

  return (
    <main className="bg-soft-white min-h-[calc(100dvh-160px)]">
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] tracking-[0.25em] text-champagne-gold uppercase mb-4 text-center">
            Contact
          </p>
          <h1 className="font-heading text-[28px] md:text-[36px] leading-snug tracking-wide text-deep-charcoal text-center mb-12">
            お問い合わせ
          </h1>

          {status === "success" ? (
            <div className="bg-white border border-green-200 rounded-lg p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-[18px] font-medium text-deep-charcoal mb-2">
                送信完了
              </h2>
              <p className="text-[14px] text-deep-charcoal/60 mb-6 leading-relaxed">
                お問い合わせを受け付けました。<br />
                確認メールをお送りしましたのでご確認ください。<br />
                通常2〜3営業日以内にご返信いたします。
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="inline-block px-8 py-3 bg-deep-charcoal text-white text-[13px] tracking-[0.1em] rounded-md hover:bg-deep-charcoal/85 transition-colors"
              >
                新しいお問い合わせ
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === "error" && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 text-[13px] text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="name"
                    className="text-[12px] tracking-wide text-deep-charcoal/60 uppercase"
                  >
                    お名前
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="h-12 px-4 border border-border-light rounded-md bg-white text-[14px] outline-none focus:border-champagne-gold transition-colors"
                    placeholder="山田 花子"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-[12px] tracking-wide text-deep-charcoal/60 uppercase"
                  >
                    メールアドレス
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="h-12 px-4 border border-border-light rounded-md bg-white text-[14px] outline-none focus:border-champagne-gold transition-colors"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="subject"
                  className="text-[12px] tracking-wide text-deep-charcoal/60 uppercase"
                >
                  件名
                </label>
                <input
                  id="subject"
                  type="text"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="h-12 px-4 border border-border-light rounded-md bg-white text-[14px] outline-none focus:border-champagne-gold transition-colors"
                  placeholder="お問い合わせの件名"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="message"
                  className="text-[12px] tracking-wide text-deep-charcoal/60 uppercase"
                >
                  メッセージ
                </label>
                <textarea
                  id="message"
                  rows={6}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="px-4 py-3 border border-border-light rounded-md bg-white text-[14px] outline-none focus:border-champagne-gold transition-colors resize-none"
                  placeholder="お問い合わせ内容をご記入ください"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full h-12 bg-deep-charcoal text-white text-[13px] tracking-wider rounded-md hover:bg-deep-charcoal/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "送信中..." : "送信する"}
              </button>
            </form>
          )}

          <div className="mt-16 pt-10 border-t border-border-light text-center">
            <p className="text-[13px] text-deep-charcoal/50 mb-2">
              その他のお問い合わせ
            </p>
            <p className="text-[14px] text-deep-charcoal/70">
              contact@seraine.jp
            </p>
            <p className="text-[13px] text-deep-charcoal/50 mt-4">
              東京都港区南青山 x-x-x
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("メールアドレスまたはパスワードが正しくありません。");
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="font-heading text-3xl md:text-4xl text-center tracking-wide mb-2">
        ログイン
      </h1>
      <p className="text-[13px] text-deep-charcoal/50 text-center mb-10">
        アカウントにログインしてください
      </p>

      {error && (
        <div className="bg-error/5 border border-error/20 text-error text-[13px] px-4 py-3 rounded-md mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[12px] tracking-wide text-deep-charcoal/60 uppercase">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-12 px-4 border border-border-light rounded-md bg-white text-[14px] outline-none focus:border-champagne-gold transition-colors placeholder:text-deep-charcoal/30"
            placeholder="example@email.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[12px] tracking-wide text-deep-charcoal/60 uppercase">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            minLength={8}
            className="h-12 px-4 border border-border-light rounded-md bg-white text-[14px] outline-none focus:border-champagne-gold transition-colors placeholder:text-deep-charcoal/30"
            placeholder="8文字以上"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-12 mt-2 bg-deep-charcoal text-white text-[13px] tracking-wider rounded-md hover:bg-deep-charcoal/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-deep-charcoal/50">
        アカウントをお持ちでない方は{" "}
        <Link href="/register" className="text-champagne-gold hover:text-champagne-gold-dark transition-colors">
          新規登録
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100dvh-160px)] px-5 py-16">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

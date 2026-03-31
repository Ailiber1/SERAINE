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

  async function handleGitHubLogin() {
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });

    if (authError) {
      setError("GitHubログインに失敗しました。");
    }
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

      <button
        onClick={handleGitHubLogin}
        className="w-full h-12 flex items-center justify-center gap-3 border border-border-light rounded-md text-[13px] tracking-wide text-deep-charcoal hover:bg-deep-charcoal/5 transition-colors mb-6"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        GitHubでログイン
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-[1px] bg-border-light" />
        <span className="text-[12px] text-deep-charcoal/40">または</span>
        <div className="flex-1 h-[1px] bg-border-light" />
      </div>

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

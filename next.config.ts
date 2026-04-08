import type { NextConfig } from "next";

// NEXT_PUBLIC_ 変数はクライアントサイドで使用する公開キー（RLS/Stripeで保護済み）
// 秘密キー（STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY等）はCloudflare環境変数で管理
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "https://seraine.pages.dev",
  },
};

export default nextConfig;

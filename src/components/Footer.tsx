"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // 管理画面ではフッターを非表示
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="bg-deep-charcoal text-white/90 mt-auto">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-14 md:py-20">
        {/* 上部: ロゴ + ナビ + SNS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {/* ブランド */}
          <div>
            <span className="font-heading text-2xl tracking-[0.15em] font-semibold text-white">
              SERAINE
            </span>
            <p className="mt-4 text-[13px] leading-relaxed text-white/50 max-w-[280px]">
              穏やかな輝き、あなただけのユニークな美しさ。
              自然の恵みと先進のサイエンスが織りなすスキンケア。
            </p>
          </div>

          {/* ナビゲーション */}
          <div>
            <h3 className="text-[11px] tracking-[0.2em] uppercase text-white/40 mb-5 font-sans">
              ナビゲーション
            </h3>
            <nav className="flex flex-col gap-3">
              <Link href="/" className="text-[13px] text-white/60 hover:text-white transition-colors">
                ホーム
              </Link>
              <Link href="/products" className="text-[13px] text-white/60 hover:text-white transition-colors">
                製品
              </Link>
              <Link href="/about" className="text-[13px] text-white/60 hover:text-white transition-colors">
                私たちについて
              </Link>
              <Link href="/contact" className="text-[13px] text-white/60 hover:text-white transition-colors">
                お問い合わせ
              </Link>
              <Link href="/privacy" className="text-[13px] text-white/60 hover:text-white transition-colors">
                プライバシーポリシー
              </Link>
            </nav>
          </div>

          {/* SNS */}
          <div>
            <h3 className="text-[11px] tracking-[0.2em] uppercase text-white/40 mb-5 font-sans">
              ソーシャル
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-white/60 hover:text-white transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-white/60 hover:text-white transition-colors"
              >
                X (Twitter)
              </a>
              <a
                href="https://line.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-white/60 hover:text-white transition-colors"
              >
                LINE
              </a>
            </div>
          </div>
        </div>

        {/* 下部: コピーライト */}
        <div className="mt-14 pt-6 border-t border-white/10">
          <p className="text-[11px] text-white/30 tracking-wide">
            &copy; {new Date().getFullYear()} SERAINE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

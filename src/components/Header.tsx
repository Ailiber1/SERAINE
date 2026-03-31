"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <header className="w-full border-b border-border-light bg-soft-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10">
        {/* メインヘッダー */}
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* 左: ハンバーガー（モバイル）/ ナビ（デスクトップ） */}
          <div className="flex items-center gap-8 w-[120px] md:w-auto">
            <button
              className="md:hidden p-1"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="メニュー"
            >
              {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
            </button>
            <nav className="hidden md:flex items-center gap-7 text-[13px] tracking-wide">
              <Link href="/" className="text-deep-charcoal/70 hover:text-deep-charcoal transition-colors">
                ホーム
              </Link>
              <Link href="/products" className="text-deep-charcoal/70 hover:text-deep-charcoal transition-colors">
                製品
              </Link>
              <Link href="/about" className="text-deep-charcoal/70 hover:text-deep-charcoal transition-colors">
                私たちについて
              </Link>
            </nav>
          </div>

          {/* 中央: ロゴ */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <span className="font-heading text-2xl md:text-[28px] tracking-[0.15em] font-semibold text-deep-charcoal">
              SERAINE
            </span>
          </Link>

          {/* 右: アイコン */}
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-[13px] tracking-wide text-deep-charcoal/70 hover:text-deep-charcoal transition-colors"
            >
              <User size={18} strokeWidth={1.5} />
              <span className="hidden sm:inline">ログイン</span>
            </Link>
            <Link
              href="/cart"
              className="relative p-1 text-deep-charcoal/70 hover:text-deep-charcoal transition-colors"
              aria-label="カート"
            >
              <ShoppingBag size={19} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-champagne-gold text-white text-[10px] font-medium font-price leading-none px-1">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* モバイルメニュー */}
      {menuOpen && (
        <div className="md:hidden border-t border-border-light bg-soft-white">
          <nav className="flex flex-col py-4 px-5">
            <Link
              href="/"
              className="py-3 text-[14px] tracking-wide text-deep-charcoal/70 hover:text-deep-charcoal transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              ホーム
            </Link>
            <Link
              href="/products"
              className="py-3 text-[14px] tracking-wide text-deep-charcoal/70 hover:text-deep-charcoal transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              製品
            </Link>
            <Link
              href="/about"
              className="py-3 text-[14px] tracking-wide text-deep-charcoal/70 hover:text-deep-charcoal transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              私たちについて
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

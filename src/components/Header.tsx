"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, User, Menu, X, LogOut } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", authUser.id)
          .single();
        setUser({
          email: authUser.email || "",
          name: profile?.full_name || authUser.email?.split("@")[0] || "",
        });
      } else {
        setUser(null);
      }
    }

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  // 管理画面ではヘッダーを非表示
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="w-full border-b border-border-light bg-soft-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10">
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

          {/* 右: ユーザー情報 + カート */}
          <div className="flex items-center gap-5">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 text-[13px] tracking-wide text-deep-charcoal/70 hover:text-deep-charcoal transition-colors"
                >
                  <User size={18} strokeWidth={1.5} />
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-border-light rounded-lg shadow-lg z-50 py-2">
                      <div className="px-4 py-2 border-b border-border-light">
                        <p className="text-[12px] text-deep-charcoal/50 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/mypage"
                        className="block px-4 py-2.5 text-[13px] text-deep-charcoal/70 hover:bg-soft-white hover:text-deep-charcoal transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        マイページ
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-[13px] text-deep-charcoal/70 hover:bg-soft-white hover:text-deep-charcoal transition-colors flex items-center gap-2"
                      >
                        <LogOut size={14} strokeWidth={1.5} />
                        ログアウト
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/register"
                  className="hidden sm:inline text-[12px] tracking-wide text-champagne-gold hover:text-champagne-gold-dark transition-colors"
                >
                  新規会員登録
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-[13px] tracking-wide text-deep-charcoal/70 hover:text-deep-charcoal transition-colors"
                >
                  <User size={18} strokeWidth={1.5} />
                  <span className="hidden sm:inline">ログイン</span>
                </Link>
              </div>
            )}
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
            <Link href="/" className="py-3 text-[14px] tracking-wide text-deep-charcoal/70 hover:text-deep-charcoal transition-colors" onClick={() => setMenuOpen(false)}>
              ホーム
            </Link>
            <Link href="/products" className="py-3 text-[14px] tracking-wide text-deep-charcoal/70 hover:text-deep-charcoal transition-colors" onClick={() => setMenuOpen(false)}>
              製品
            </Link>
            <Link href="/about" className="py-3 text-[14px] tracking-wide text-deep-charcoal/70 hover:text-deep-charcoal transition-colors" onClick={() => setMenuOpen(false)}>
              私たちについて
            </Link>
            <div className="border-t border-border-light my-2" />
            {user ? (
              <>
                <Link href="/mypage" className="py-3 text-[14px] tracking-wide text-deep-charcoal/70 hover:text-deep-charcoal transition-colors" onClick={() => setMenuOpen(false)}>
                  マイページ
                </Link>
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="py-3 text-left text-[14px] tracking-wide text-deep-charcoal/70 hover:text-deep-charcoal transition-colors"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="py-3 text-[14px] tracking-wide text-deep-charcoal/70 hover:text-deep-charcoal transition-colors" onClick={() => setMenuOpen(false)}>
                  ログイン
                </Link>
                <Link href="/register" className="py-3 text-[14px] tracking-wide text-champagne-gold hover:text-champagne-gold-dark transition-colors" onClick={() => setMenuOpen(false)}>
                  新規会員登録
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/admin/products", label: "商品管理", icon: Package },
  { href: "/admin/orders", label: "注文管理", icon: ShoppingBag },
  { href: "/admin/customers", label: "顧客管理", icon: Users },
  { href: "/admin/reports", label: "売上レポート", icon: BarChart3 },
  { href: "/admin/settings", label: "設定", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const navContent = (
    <nav className="flex flex-col gap-1 mt-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 text-[13px] tracking-wide transition-colors rounded-md ${
              active
                ? "bg-champagne-gold/20 text-champagne-gold"
                : "text-white/60 hover:text-white/90 hover:bg-white/5"
            }`}
          >
            <Icon size={18} strokeWidth={1.5} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* モバイルハンバーガー */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-deep-charcoal text-white rounded-md"
        aria-label="メニューを開く"
      >
        <Menu size={20} />
      </button>

      {/* モバイルオーバーレイ */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* モバイルサイドバー */}
      <aside
        className={`md:hidden fixed top-0 left-0 bottom-0 w-[240px] bg-deep-charcoal z-50 transform transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <span className="font-heading text-lg text-champagne-gold tracking-widest">
            SERAINE
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-white/60 hover:text-white"
            aria-label="メニューを閉じる"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-[11px] text-white/40 px-4 mb-2 tracking-wider uppercase">
          管理メニュー
        </div>
        {navContent}
      </aside>

      {/* デスクトップサイドバー */}
      <aside className="hidden md:flex flex-col w-[220px] bg-deep-charcoal flex-shrink-0">
        <div className="px-4 h-14 flex items-center">
          <Link href="/admin" className="font-heading text-lg text-champagne-gold tracking-widest">
            SERAINE
          </Link>
        </div>
        <div className="text-[11px] text-white/40 px-4 mb-2 tracking-wider uppercase">
          管理メニュー
        </div>
        {navContent}
      </aside>
    </>
  );
}

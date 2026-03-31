"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search } from "lucide-react";

interface CustomerRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  email?: string;
  order_count: number;
  ltv: number;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const sb = createClient();

    // プロファイル取得
    const { data: profiles } = await sb
      .from("profiles")
      .select("id, full_name, phone, created_at")
      .eq("role", "customer")
      .order("created_at", { ascending: false });

    if (!profiles || profiles.length === 0) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    // 注文情報を取得して LTV と注文数を計算
    const { data: orders } = await sb
      .from("orders")
      .select("user_id, total, status")
      .in("status", ["confirmed", "shipped", "delivered"]);

    const orderMap = new Map<string, { count: number; total: number }>();
    orders?.forEach((o) => {
      const entry = orderMap.get(o.user_id) ?? { count: 0, total: 0 };
      entry.count += 1;
      entry.total += o.total;
      orderMap.set(o.user_id, entry);
    });

    const rows: CustomerRow[] = profiles.map((p) => {
      const entry = orderMap.get(p.id) ?? { count: 0, total: 0 };
      return {
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        created_at: p.created_at,
        order_count: entry.count,
        ltv: entry.total,
      };
    });

    setCustomers(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filtered = customers.filter((c) => {
    const name = c.full_name?.toLowerCase() ?? "";
    const q = search.toLowerCase();
    return name.includes(q) || c.id.toLowerCase().includes(q);
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <h1 className="font-heading text-2xl md:text-3xl tracking-wide mb-6">
        顧客管理
      </h1>

      {/* 検索 */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-charcoal/40"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="顧客名で検索..."
          className="w-full sm:w-[300px] pl-9 pr-4 py-2 text-[13px] bg-white border border-border-light rounded-md focus:outline-none focus:border-champagne-gold"
        />
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-border-light p-4">
          <p className="text-[12px] text-deep-charcoal/50 mb-1">総顧客数</p>
          <p className="font-price text-xl font-medium">{customers.length}人</p>
        </div>
        <div className="bg-white rounded-lg border border-border-light p-4">
          <p className="text-[12px] text-deep-charcoal/50 mb-1">平均LTV</p>
          <p className="font-price text-xl font-medium">
            ¥{customers.length > 0
              ? Math.round(customers.reduce((s, c) => s + c.ltv, 0) / customers.length).toLocaleString()
              : "0"}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-border-light p-4 hidden sm:block">
          <p className="text-[12px] text-deep-charcoal/50 mb-1">購入者率</p>
          <p className="font-price text-xl font-medium">
            {customers.length > 0
              ? Math.round(
                  (customers.filter((c) => c.order_count > 0).length /
                    customers.length) *
                    100
                )
              : 0}
            %
          </p>
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg border border-border-light overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[13px] text-deep-charcoal/40">
            読み込み中...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-deep-charcoal/40">
            顧客がいません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-deep-charcoal/50 border-b border-border-light bg-[#F9F9F7]">
                  <th className="px-4 py-3 font-normal">顧客名</th>
                  <th className="px-4 py-3 font-normal hidden md:table-cell">電話番号</th>
                  <th className="px-4 py-3 font-normal">注文数</th>
                  <th className="px-4 py-3 font-normal">LTV</th>
                  <th className="px-4 py-3 font-normal hidden sm:table-cell">登録日</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border-light last:border-0 hover:bg-[#FAFAF8]"
                  >
                    <td className="px-4 py-3 font-medium">
                      {c.full_name || "未設定"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-deep-charcoal/60 font-price text-[12px]">
                      {c.phone || "—"}
                    </td>
                    <td className="px-4 py-3 font-price">{c.order_count}件</td>
                    <td className="px-4 py-3 font-price">
                      ¥{c.ltv.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-deep-charcoal/60 font-price text-[12px]">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

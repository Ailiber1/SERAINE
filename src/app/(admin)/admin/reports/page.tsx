"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download } from "lucide-react";
import RevenueChart from "@/components/admin/RevenueChart";
import ProductSalesChart from "@/components/admin/ProductSalesChart";

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

interface ProductSalesData {
  name: string;
  revenue: number;
  quantity: number;
}

export default function AdminReports() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [productData, setProductData] = useState<ProductSalesData[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sb = createClient();

    // 全注文（確認済み以上）
    const { data: orders } = await sb
      .from("orders")
      .select("id, total, status, created_at")
      .in("status", ["confirmed", "shipped", "delivered"]);

    // 月別集計
    const monthMap = new Map<string, { revenue: number; orders: number }>();
    orders?.forEach((o) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      const entry = monthMap.get(key) ?? { revenue: 0, orders: 0 };
      entry.revenue += o.total;
      entry.orders += 1;
      monthMap.set(key, entry);
    });

    // 最近12ヶ月分を用意（データがない月も0で表示）
    const now = new Date();
    const months: MonthlyData[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      const entry = monthMap.get(key);
      months.push({
        month: `${d.getMonth() + 1}月`,
        revenue: entry?.revenue ?? 0,
        orders: entry?.orders ?? 0,
      });
    }
    setMonthlyData(months);

    // 商品別売上
    const orderIds = orders?.map((o) => o.id) ?? [];
    if (orderIds.length > 0) {
      const { data: items } = await sb
        .from("order_items")
        .select("product_id, quantity, price, product:products(name)")
        .in("order_id", orderIds);

      const prodMap = new Map<string, ProductSalesData>();
      items?.forEach((item) => {
        const name = (item.product as unknown as { name: string })?.name ?? "不明";
        const entry = prodMap.get(item.product_id) ?? {
          name,
          revenue: 0,
          quantity: 0,
        };
        entry.revenue += item.price * item.quantity;
        entry.quantity += item.quantity;
        prodMap.set(item.product_id, entry);
      });

      const sorted = Array.from(prodMap.values()).sort(
        (a, b) => b.revenue - a.revenue
      );
      setProductData(sorted.slice(0, 10));
    } else {
      setProductData([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const downloadCSV = () => {
    const headers = ["月", "売上（円）", "注文数"];
    const rows = monthlyData.map((m) => [m.month, m.revenue, m.orders]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seraine-sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadProductCSV = () => {
    const headers = ["商品名", "売上（円）", "販売数"];
    const rows = productData.map((p) => [p.name, p.revenue, p.quantity]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seraine-product-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const totalOrders = monthlyData.reduce((s, m) => s + m.orders, 0);

  return (
    <div>
      <h1 className="font-heading text-2xl md:text-3xl tracking-wide mb-6">
        売上レポート
      </h1>

      {loading ? (
        <div className="p-8 text-center text-[13px] text-deep-charcoal/40">
          読み込み中...
        </div>
      ) : (
        <>
          {/* サマリー */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-border-light p-4">
              <p className="text-[12px] text-deep-charcoal/50 mb-1">
                過去12ヶ月の売上
              </p>
              <p className="font-price text-xl font-medium">
                ¥{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-border-light p-4">
              <p className="text-[12px] text-deep-charcoal/50 mb-1">
                過去12ヶ月の注文数
              </p>
              <p className="font-price text-xl font-medium">
                {totalOrders}件
              </p>
            </div>
          </div>

          {/* 月別売上グラフ */}
          <div className="bg-white rounded-lg border border-border-light p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-medium">月別売上推移</h2>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-1.5 text-[12px] text-champagne-gold hover:text-champagne-gold-dark transition-colors"
              >
                <Download size={14} />
                CSV出力
              </button>
            </div>
            {monthlyData.some((m) => m.revenue > 0) ? (
              <RevenueChart data={monthlyData} />
            ) : (
              <p className="text-[13px] text-deep-charcoal/40 py-12 text-center">
                売上データがありません
              </p>
            )}
          </div>

          {/* 商品別売上グラフ */}
          <div className="bg-white rounded-lg border border-border-light p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-medium">商品別売上（Top 10）</h2>
              <button
                onClick={downloadProductCSV}
                className="flex items-center gap-1.5 text-[12px] text-champagne-gold hover:text-champagne-gold-dark transition-colors"
              >
                <Download size={14} />
                CSV出力
              </button>
            </div>
            {productData.length > 0 ? (
              <ProductSalesChart data={productData} />
            ) : (
              <p className="text-[13px] text-deep-charcoal/40 py-12 text-center">
                売上データがありません
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

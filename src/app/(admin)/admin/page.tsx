import { createClient } from "@/lib/supabase/server";
import {
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Users,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // 今日の日付範囲
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // 今日の注文
  const { data: todayOrders } = await supabase
    .from("orders")
    .select("id, total, status, created_at")
    .gte("created_at", todayStart.toISOString())
    .lte("created_at", todayEnd.toISOString());

  // 全注文数
  const { count: totalOrderCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true });

  // 今月の売上
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { data: monthOrders } = await supabase
    .from("orders")
    .select("total")
    .gte("created_at", monthStart.toISOString())
    .in("status", ["confirmed", "shipped", "delivered"]);

  const monthRevenue = monthOrders?.reduce((sum, o) => sum + o.total, 0) ?? 0;

  // 在庫アラート（stock < 10）
  const { data: lowStockProducts } = await supabase
    .from("products")
    .select("id, name, stock, price")
    .lt("stock", 10)
    .eq("is_active", true)
    .order("stock", { ascending: true });

  // 最近の注文5件
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, total, status, shipping_name, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // 顧客数
  const { count: customerCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "customer");

  const todayRevenue = todayOrders
    ?.filter((o) => ["confirmed", "shipped", "delivered"].includes(o.status))
    .reduce((sum, o) => sum + o.total, 0) ?? 0;

  const todayOrderCount = todayOrders?.length ?? 0;

  return (
    <div>
      <h1 className="font-heading text-2xl md:text-3xl tracking-wide mb-6">
        ダッシュボード
      </h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          icon={<ShoppingBag size={20} strokeWidth={1.5} />}
          label="今日の注文"
          value={`${todayOrderCount}件`}
          sub={`全${totalOrderCount ?? 0}件`}
        />
        <SummaryCard
          icon={<TrendingUp size={20} strokeWidth={1.5} />}
          label="今日の売上"
          value={`¥${todayRevenue.toLocaleString()}`}
          sub={`今月 ¥${monthRevenue.toLocaleString()}`}
        />
        <SummaryCard
          icon={<Users size={20} strokeWidth={1.5} />}
          label="顧客数"
          value={`${customerCount ?? 0}人`}
          sub=""
        />
        <SummaryCard
          icon={<AlertTriangle size={20} strokeWidth={1.5} />}
          label="在庫アラート"
          value={`${lowStockProducts?.length ?? 0}件`}
          sub="10個未満"
          alert={!!lowStockProducts?.length}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 最近の注文 */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-border-light p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-medium">最近の注文</h2>
            <Link
              href="/admin/orders"
              className="text-[12px] text-champagne-gold hover:underline"
            >
              すべて見る →
            </Link>
          </div>
          {recentOrders && recentOrders.length > 0 ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-deep-charcoal/50 border-b border-border-light">
                  <th className="pb-2 font-normal">注文ID</th>
                  <th className="pb-2 font-normal hidden sm:table-cell">顧客名</th>
                  <th className="pb-2 font-normal">金額</th>
                  <th className="pb-2 font-normal">状態</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border-light last:border-0">
                    <td className="py-2.5 font-price text-[12px]">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="py-2.5 hidden sm:table-cell">{order.shipping_name}</td>
                    <td className="py-2.5 font-price">
                      ¥{order.total.toLocaleString()}
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[13px] text-deep-charcoal/40 py-8 text-center">
              注文はまだありません
            </p>
          )}
        </div>

        {/* 在庫アラート */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-border-light p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-medium">在庫アラート</h2>
            <Link
              href="/admin/products"
              className="text-[12px] text-champagne-gold hover:underline"
            >
              商品管理 →
            </Link>
          </div>
          {lowStockProducts && lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-[13px] py-2 border-b border-border-light last:border-0"
                >
                  <span className="truncate mr-3">{p.name}</span>
                  <span
                    className={`flex-shrink-0 font-price text-[12px] px-2 py-0.5 rounded ${
                      p.stock === 0
                        ? "bg-error/10 text-error"
                        : "bg-champagne-gold/10 text-champagne-gold-dark"
                    }`}
                  >
                    残{p.stock}個
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-deep-charcoal/40 py-8 text-center">
              在庫アラートなし
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-border-light p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={alert ? "text-error" : "text-champagne-gold"}>{icon}</span>
        <span className="text-[12px] text-deep-charcoal/50">{label}</span>
      </div>
      <p className="font-price text-xl font-medium">{value}</p>
      {sub && (
        <p className="text-[11px] text-deep-charcoal/40 mt-1">{sub}</p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-[#FFF3E0] text-[#E65100]",
    confirmed: "bg-[#E3F2FD] text-[#1565C0]",
    shipped: "bg-[#F3E5F5] text-[#7B1FA2]",
    delivered: "bg-[#E8F5E9] text-[#2E7D32]",
    cancelled: "bg-[#FAFAFA] text-[#757575]",
  };
  const labels: Record<string, string> = {
    pending: "未確認",
    confirmed: "確認済",
    shipped: "発送済",
    delivered: "配送完了",
    cancelled: "キャンセル",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
        styles[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

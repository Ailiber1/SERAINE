"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/types/database";
import { Search, ChevronDown } from "lucide-react";
import { Fragment } from "react";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "未確認" },
  { value: "confirmed", label: "確認済" },
  { value: "shipped", label: "発送済" },
  { value: "delivered", label: "配送完了" },
  { value: "cancelled", label: "キャンセル" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-status-pending-bg text-status-pending-text",
  confirmed: "bg-status-confirmed-bg text-status-confirmed-text",
  shipped: "bg-status-shipped-bg text-status-shipped-text",
  delivered: "bg-status-delivered-bg text-status-delivered-text",
  cancelled: "bg-status-cancelled-bg text-status-cancelled-text",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const { data } = await sb
      .from("orders")
      .select("*, order_items(*, product:products(name)), profile:profiles(full_name, phone)")
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    if (error) {
      alert("ステータス更新に失敗しました: " + error.message);
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.shipping_name.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <h1 className="font-heading text-2xl md:text-3xl tracking-wide mb-6">
        注文管理
      </h1>

      {/* フィルター */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-charcoal/40"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="注文ID・顧客名で検索..."
            className="w-full sm:w-[260px] pl-9 pr-4 py-2 text-[13px] bg-white border border-border-light rounded-md focus:outline-none focus:border-champagne-gold"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-[13px] bg-white border border-border-light rounded-md focus:outline-none focus:border-champagne-gold"
        >
          <option value="all">すべてのステータス</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg border border-border-light overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[13px] text-deep-charcoal/40">
            読み込み中...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-deep-charcoal/40">
            注文がありません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-deep-charcoal/50 border-b border-border-light bg-[#F9F9F7]">
                  <th className="px-4 py-3 font-normal w-8"></th>
                  <th className="px-4 py-3 font-normal">注文ID</th>
                  <th className="px-4 py-3 font-normal">顧客名</th>
                  <th className="px-4 py-3 font-normal hidden md:table-cell">日時</th>
                  <th className="px-4 py-3 font-normal">金額</th>
                  <th className="px-4 py-3 font-normal">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <Fragment key={order.id}>
                    <tr
                      className="border-b border-border-light hover:bg-[#FAFAF8] cursor-pointer"
                      onClick={() =>
                        setExpandedId(expandedId === order.id ? null : order.id)
                      }
                    >
                      <td className="px-4 py-3">
                        <ChevronDown
                          size={14}
                          className={`text-deep-charcoal/40 transition-transform ${
                            expandedId === order.id ? "rotate-180" : ""
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3 font-price text-[12px]">
                        {order.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3">{order.shipping_name}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-deep-charcoal/60 font-price text-[12px]">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3 font-price">
                        ¥{order.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(
                              order.id,
                              e.target.value as OrderStatus
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-[11px] font-medium px-2 py-1 rounded border-0 cursor-pointer ${
                            STATUS_STYLES[order.status] ?? ""
                          }`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {expandedId === order.id && (
                      <tr className="border-b border-border-light bg-[#FAFAF8]">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
                            <div>
                              <p className="text-deep-charcoal/50 mb-1">配送先</p>
                              <p>〒{order.shipping_postal_code}</p>
                              <p>{order.shipping_address}</p>
                              <p>{order.shipping_name} / {order.shipping_phone}</p>
                            </div>
                            <div>
                              <p className="text-deep-charcoal/50 mb-1">注文内容</p>
                              {order.order_items && order.order_items.length > 0 ? (
                                <ul className="space-y-1">
                                  {order.order_items.map((item) => (
                                    <li key={item.id} className="flex justify-between">
                                      <span>
                                        {item.product?.name ?? "不明"} × {item.quantity}
                                      </span>
                                      <span className="font-price">
                                        ¥{(item.price * item.quantity).toLocaleString()}
                                      </span>
                                    </li>
                                  ))}
                                  <li className="flex justify-between pt-1 border-t border-border-light">
                                    <span>送料</span>
                                    <span className="font-price">
                                      ¥{order.shipping_fee.toLocaleString()}
                                    </span>
                                  </li>
                                </ul>
                              ) : (
                                <p className="text-deep-charcoal/40">明細なし</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils/format";
import Link from "next/link";
import { Package, ChevronRight, User as UserIcon } from "lucide-react";
import type { Order, OrderItem, Product } from "@/types/database";
import CancelOrderButton from "@/components/CancelOrderButton";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "決済待ち", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "確定", color: "bg-green-100 text-green-800" },
  shipped: { label: "発送済み", color: "bg-blue-100 text-blue-800" },
  delivered: { label: "配達完了", color: "bg-deep-charcoal/10 text-deep-charcoal" },
  cancelled: { label: "キャンセル", color: "bg-red-100 text-red-800" },
};

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/mypage");
  }

  // プロフィール取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  // 注文履歴を取得
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "*, order_items(*, product:products(id, name, price, image_urls)), order_payments(*)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const typedOrders = (orders || []) as (Order & {
    order_items: (OrderItem & { product: Product })[];
  })[];

  return (
    <div className="py-10 md:py-16 px-5">
      <div className="max-w-[900px] mx-auto">
        <h1 className="font-heading text-[28px] md:text-[36px] tracking-wide text-deep-charcoal mb-10 md:mb-14">
          マイページ
        </h1>

        {/* アカウント情報 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <UserIcon size={18} strokeWidth={1.5} className="text-champagne-gold" />
            <h2 className="text-[15px] tracking-wide font-medium text-deep-charcoal">
              アカウント情報
            </h2>
          </div>
          <div className="bg-white border border-border-light rounded-lg p-5 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[14px]">
              <div>
                <p className="text-[12px] text-deep-charcoal/50 mb-0.5">メールアドレス</p>
                <p className="text-deep-charcoal">{user.email}</p>
              </div>
              {profile?.full_name && (
                <div>
                  <p className="text-[12px] text-deep-charcoal/50 mb-0.5">お名前</p>
                  <p className="text-deep-charcoal">{profile.full_name}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 注文履歴 */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Package size={18} strokeWidth={1.5} className="text-champagne-gold" />
            <h2 className="text-[15px] tracking-wide font-medium text-deep-charcoal">
              注文履歴
            </h2>
          </div>

          {typedOrders.length === 0 ? (
            <div className="bg-white border border-border-light rounded-lg p-10 text-center">
              <Package
                size={36}
                strokeWidth={1}
                className="mx-auto text-deep-charcoal/15 mb-4"
              />
              <p className="text-[14px] text-deep-charcoal/50 mb-6">
                まだ注文履歴がありません
              </p>
              <Link
                href="/products"
                className="inline-block px-8 py-3 bg-deep-charcoal text-white text-[13px] tracking-[0.1em] rounded-md hover:bg-deep-charcoal/85 transition-colors"
              >
                製品を見る
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {typedOrders.map((order) => {
                const statusInfo =
                  STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                const date = new Date(order.created_at);
                const formattedDate = `${date.getFullYear()}/${String(
                  date.getMonth() + 1
                ).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-border-light rounded-lg overflow-hidden"
                  >
                    {/* ヘッダー */}
                    <div className="p-4 md:p-5 border-b border-border-light">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3 md:gap-5">
                          <div>
                            <p className="text-[11px] text-deep-charcoal/50 mb-0.5">
                              注文番号
                            </p>
                            <p className="font-price text-[14px] font-medium tracking-wide text-deep-charcoal">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-deep-charcoal/50 mb-0.5">
                              注文日
                            </p>
                            <p className="font-price text-[13px] text-deep-charcoal">
                              {formattedDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-block px-2.5 py-1 text-[11px] font-medium rounded-md ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                          <span className="font-price text-[16px] tracking-wide font-medium text-deep-charcoal">
                            {formatPrice(order.total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 商品一覧 */}
                    <div className="p-4 md:p-5">
                      <div className="flex flex-col gap-2.5">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-[13px]"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <ChevronRight
                                size={12}
                                className="text-deep-charcoal/30 flex-shrink-0"
                              />
                              <span className="text-deep-charcoal truncate">
                                {item.product?.name || "商品"}
                              </span>
                              <span className="text-deep-charcoal/40 flex-shrink-0">
                                x{item.quantity}
                              </span>
                            </div>
                            <span className="font-price text-deep-charcoal/70 flex-shrink-0 ml-3">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* 送料表示 */}
                      <div className="mt-3 pt-3 border-t border-border-light flex items-center justify-between text-[12px] text-deep-charcoal/50">
                        <span>送料</span>
                        <span className="font-price">
                          {order.shipping_fee === 0
                            ? "無料"
                            : formatPrice(order.shipping_fee)}
                        </span>
                      </div>

                      {/* キャンセルボタン（pending/confirmedのみ） */}
                      {(order.status === "pending" || order.status === "confirmed") && (
                        <CancelOrderButton
                          orderId={order.id}
                          orderNumber={order.id.slice(0, 8).toUpperCase()}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

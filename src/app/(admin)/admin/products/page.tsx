"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product, Category } from "@/types/database";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import ProductFormModal from "@/components/admin/ProductFormModal";

export default function AdminProducts() {
  const [products, setProducts] = useState<(Product & { category?: Category })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const supabase = createClient();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const { data } = await sb
      .from("products")
      .select("*, category:categories(*)")
      .order("created_at", { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  }, []);

  const fetchCategories = useCallback(async () => {
    const sb = createClient();
    const { data } = await sb
      .from("categories")
      .select("*")
      .order("sort_order");
    setCategories(data ?? []);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("削除に失敗しました: " + error.message);
      return;
    }
    fetchProducts();
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide">
          商品管理
        </h1>
        <button
          onClick={() => {
            setEditProduct(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-deep-charcoal text-white px-4 py-2 text-[13px] rounded-md hover:bg-deep-charcoal/90 transition-colors"
        >
          <Plus size={16} />
          商品を追加
        </button>
      </div>

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
          placeholder="商品名で検索..."
          className="w-full sm:w-[300px] pl-9 pr-4 py-2 text-[13px] bg-white border border-border-light rounded-md focus:outline-none focus:border-champagne-gold"
        />
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg border border-border-light overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[13px] text-deep-charcoal/40">
            読み込み中...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-deep-charcoal/40">
            商品がありません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-deep-charcoal/50 border-b border-border-light bg-[#F9F9F7]">
                  <th className="px-4 py-3 font-normal">商品名</th>
                  <th className="px-4 py-3 font-normal hidden md:table-cell">カテゴリ</th>
                  <th className="px-4 py-3 font-normal">価格</th>
                  <th className="px-4 py-3 font-normal">在庫</th>
                  <th className="px-4 py-3 font-normal hidden sm:table-cell">状態</th>
                  <th className="px-4 py-3 font-normal w-[100px]">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-border-light last:border-0 hover:bg-[#FAFAF8]"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium">{product.name}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-deep-charcoal/60">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-price">
                      ¥{product.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-price ${
                          product.stock < 10
                            ? product.stock === 0
                              ? "text-error font-medium"
                              : "text-champagne-gold-dark"
                            : ""
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                          product.is_active
                            ? "bg-status-delivered-bg text-status-delivered-text"
                            : "bg-status-cancelled-bg text-status-cancelled-text"
                        }`}
                      >
                        {product.is_active ? "公開中" : "非公開"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditProduct(product);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-deep-charcoal/50 hover:text-champagne-gold transition-colors"
                          aria-label="編集"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-1.5 text-deep-charcoal/50 hover:text-error transition-colors"
                          aria-label="削除"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* モーダル */}
      {showModal && (
        <ProductFormModal
          product={editProduct}
          categories={categories}
          onClose={() => {
            setShowModal(false);
            setEditProduct(null);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditProduct(null);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}

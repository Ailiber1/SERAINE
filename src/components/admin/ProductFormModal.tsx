"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product, Category } from "@/types/database";
import { X } from "lucide-react";

interface Props {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductFormModal({
  product,
  categories,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name ?? "",
    price: product?.price?.toString() ?? "",
    description: product?.description ?? "",
    ingredients: product?.ingredients ?? "",
    image_urls: product?.image_urls?.join("\n") ?? "",
    stock: product?.stock?.toString() ?? "0",
    category_id: product?.category_id ?? "",
    is_active: product?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("商品名は必須です");
      return;
    }
    const price = parseInt(form.price, 10);
    if (isNaN(price) || price < 0) {
      setError("価格は0以上の整数を入力してください");
      return;
    }
    const stock = parseInt(form.stock, 10);
    if (isNaN(stock) || stock < 0) {
      setError("在庫数は0以上の整数を入力してください");
      return;
    }

    setSaving(true);

    const imageUrls = form.image_urls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      price,
      description: form.description.trim() || null,
      ingredients: form.ingredients.trim() || null,
      image_urls: imageUrls,
      stock,
      category_id: form.category_id || null,
      is_active: form.is_active,
    };

    if (isEdit && product) {
      const { error: err } = await supabase
        .from("products")
        .update(payload)
        .eq("id", product.id);
      if (err) {
        setError("更新に失敗しました: " + err.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: err } = await supabase.from("products").insert(payload);
      if (err) {
        setError("追加に失敗しました: " + err.message);
        setSaving(false);
        return;
      }
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-lg w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <h2 className="text-[15px] font-medium">
            {isEdit ? "商品を編集" : "商品を追加"}
          </h2>
          <button
            onClick={onClose}
            className="text-deep-charcoal/40 hover:text-deep-charcoal"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-[13px] text-error bg-error/5 px-3 py-2 rounded">
              {error}
            </p>
          )}

          <Field label="商品名" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-[13px] border border-border-light rounded-md focus:outline-none focus:border-champagne-gold"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="価格（円）" required>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 text-[13px] border border-border-light rounded-md focus:outline-none focus:border-champagne-gold font-price"
              />
            </Field>
            <Field label="在庫数" required>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full px-3 py-2 text-[13px] border border-border-light rounded-md focus:outline-none focus:border-champagne-gold font-price"
              />
            </Field>
          </div>

          <Field label="カテゴリ">
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full px-3 py-2 text-[13px] border border-border-light rounded-md focus:outline-none focus:border-champagne-gold bg-white"
            >
              <option value="">未設定</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="説明">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-[13px] border border-border-light rounded-md focus:outline-none focus:border-champagne-gold resize-y"
            />
          </Field>

          <Field label="成分">
            <textarea
              value={form.ingredients}
              onChange={(e) =>
                setForm({ ...form, ingredients: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 text-[13px] border border-border-light rounded-md focus:outline-none focus:border-champagne-gold resize-y"
            />
          </Field>

          <Field label="画像URL（1行に1つ）">
            <textarea
              value={form.image_urls}
              onChange={(e) =>
                setForm({ ...form, image_urls: e.target.value })
              }
              rows={2}
              placeholder="https://example.com/image1.jpg"
              className="w-full px-3 py-2 text-[13px] border border-border-light rounded-md focus:outline-none focus:border-champagne-gold resize-y"
            />
          </Field>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
              className="accent-champagne-gold"
            />
            <label htmlFor="is_active" className="text-[13px]">
              公開する
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] text-deep-charcoal/60 hover:text-deep-charcoal transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-[13px] bg-deep-charcoal text-white rounded-md hover:bg-deep-charcoal/90 transition-colors disabled:opacity-50"
            >
              {saving ? "保存中..." : isEdit ? "更新" : "追加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12px] text-deep-charcoal/60 mb-1">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

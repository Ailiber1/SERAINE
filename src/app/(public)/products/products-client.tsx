"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product, Category } from "@/types/database";
import { formatPrice } from "@/lib/utils/format";
import { getProductImage } from "@/lib/utils/product-image";
import { Search } from "lucide-react";

type SortKey = "newest" | "price_asc" | "price_desc" | "name";

interface Props {
  products: Product[];
  categories: Category[];
}

export default function ProductsClient({ products, categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");

  const { matched, unmatched } = useMemo(() => {
    let result = [...products];

    // キーワード検索
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // 並び替え
    const sortFn = (a: Product, b: Product) => {
      switch (sortBy) {
        case "price_asc": return a.price - b.price;
        case "price_desc": return b.price - a.price;
        case "name": return a.name.localeCompare(b.name, "ja");
        default: return 0;
      }
    };
    result.sort(sortFn);

    // カテゴリフィルター: 該当商品と非該当商品に分ける
    if (selectedCategory !== "all") {
      const m = result.filter((p) => p.category_id === selectedCategory);
      const u = result.filter((p) => p.category_id !== selectedCategory);
      return { matched: m, unmatched: u };
    }

    return { matched: result, unmatched: [] };
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="py-12 md:py-20 px-5">
      <div className="max-w-[1200px] mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[11px] tracking-[0.25em] text-champagne-gold uppercase mb-3">
            Products
          </p>
          <h1 className="font-heading text-[32px] md:text-[42px] tracking-wide text-deep-charcoal">
            製品一覧
          </h1>
        </div>

        {/* フィルター + 検索 + 並び替え */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10 md:mb-12">
          {/* カテゴリフィルター */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 text-[12px] tracking-wide rounded-md border transition-colors ${
                selectedCategory === "all"
                  ? "bg-deep-charcoal text-white border-deep-charcoal"
                  : "bg-white text-deep-charcoal/70 border-border-light hover:border-deep-charcoal/30"
              }`}
            >
              すべて
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 text-[12px] tracking-wide rounded-md border transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-deep-charcoal text-white border-deep-charcoal"
                    : "bg-white text-deep-charcoal/70 border-border-light hover:border-deep-charcoal/30"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 検索 + 並び替え */}
          <div className="flex gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-charcoal/30"
              />
              <input
                type="text"
                placeholder="キーワードで検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 pr-4 border border-border-light rounded-md bg-white text-[13px] outline-none focus:border-champagne-gold transition-colors w-[180px] md:w-[200px] placeholder:text-deep-charcoal/30"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="h-10 px-3 border border-border-light rounded-md bg-white text-[13px] text-deep-charcoal/70 outline-none focus:border-champagne-gold transition-colors"
            >
              <option value="newest">新着順</option>
              <option value="price_asc">価格が安い順</option>
              <option value="price_desc">価格が高い順</option>
              <option value="name">名前順</option>
            </select>
          </div>
        </div>

        {/* 商品グリッド */}
        {matched.length === 0 && unmatched.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[14px] text-deep-charcoal/50">
              該当する商品が見つかりませんでした。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10 md:gap-x-7 md:gap-y-14">
            {/* 該当商品: 明るく先頭に表示 */}
            {matched.map((product, i) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className={`group block transition-all duration-300 ${i % 3 === 1 ? "md:mt-6" : ""}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-blush-pink/20">
                  <Image
                    src={getProductImage(product)}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-4 px-1">
                  <h3 className="text-[13px] md:text-[14px] tracking-wide text-deep-charcoal/80 group-hover:text-deep-charcoal transition-colors">
                    {product.name}
                  </h3>
                  {product.category && (
                    <p className="mt-1 text-[11px] text-deep-charcoal/40">
                      {product.category.name}
                    </p>
                  )}
                  <p className="mt-1.5 font-price text-[14px] md:text-[15px] tracking-wide text-deep-charcoal">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            ))}

            {/* 非該当商品: 薄く影をかけて表示 */}
            {unmatched.map((product, i) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className={`group block opacity-30 hover:opacity-60 transition-all duration-300 ${(matched.length + i) % 3 === 1 ? "md:mt-6" : ""}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-blush-pink/10">
                  <Image
                    src={getProductImage(product)}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover grayscale-[30%]"
                  />
                </div>
                <div className="mt-4 px-1">
                  <h3 className="text-[13px] md:text-[14px] tracking-wide text-deep-charcoal/50">
                    {product.name}
                  </h3>
                  {product.category && (
                    <p className="mt-1 text-[11px] text-deep-charcoal/30">
                      {product.category.name}
                    </p>
                  )}
                  <p className="mt-1.5 font-price text-[14px] md:text-[15px] tracking-wide text-deep-charcoal/50">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Product } from "@/types/database";
import ProductDetailClient from "./product-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, description")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!product) {
    return { title: "商品が見つかりません | SERAINE" };
  }

  return {
    title: `${product.name} | SERAINE`,
    description: product.description || `SERAINE ${product.name}`,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!product) {
    notFound();
  }

  // 関連商品（同カテゴリの別商品、最大4件）
  let relatedProducts: Product[] = [];
  if (product.category_id) {
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .eq("category_id", product.category_id)
      .neq("id", id)
      .limit(4);
    relatedProducts = (data || []) as Product[];
  }

  return (
    <ProductDetailClient
      product={product as Product}
      relatedProducts={relatedProducts}
    />
  );
}

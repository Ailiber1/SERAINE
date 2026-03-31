export const runtime = 'edge';

import { createClient } from "@/lib/supabase/server";
import type { Product, Category } from "@/types/database";
import ProductsClient from "./products-client";

export const metadata = {
  title: "製品一覧 | SERAINE",
  description: "SÉRAINEの全製品をご覧ください。",
};

export default async function ProductsPage() {
  const supabase = await createClient();

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
  ]);

  const products = (productsRes.data || []) as Product[];
  const categories = (categoriesRes.data || []) as Category[];

  return <ProductsClient products={products} categories={categories} />;
}

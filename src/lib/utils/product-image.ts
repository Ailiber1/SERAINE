import type { Product } from "@/types/database";

// 商品名→画像ファイル名のマッピング
const imageMap: Record<string, string> = {
  "リュミエール セラム": "/images/product-serum.jpg",
  "ヴェルール クリーム": "/images/product-cream.jpg",
  "ロゼ トーナー": "/images/product-toner.jpg",
  "ペタル クレンジング": "/images/product-cleansing.jpg",
  "エクロール アイクリーム": "/images/product-eyecream.jpg",
  "シエル UV プロテクト": "/images/product-sunscreen.jpg",
  "ノクテイユ ナイトマスク": "/images/product-nightmask.jpg",
  "セレーヌ コフレセット": "/images/product-coffret.jpg",
};

export function getProductImage(product: Product | null | undefined): string {
  if (!product) return "/images/product-serum.jpg";
  // 名前ベースのマッピングを優先（DB内のpngパスが残っている場合の対策）
  if (imageMap[product.name]) {
    return imageMap[product.name];
  }
  if (
    Array.isArray(product.image_urls) &&
    product.image_urls.length > 0 &&
    typeof product.image_urls[0] === "string" &&
    product.image_urls[0].trim() !== ""
  ) {
    return product.image_urls[0];
  }
  return "/images/product-serum.jpg";
}

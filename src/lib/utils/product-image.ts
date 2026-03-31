import type { Product } from "@/types/database";

// 商品名→画像ファイル名のマッピング
const imageMap: Record<string, string> = {
  "リュミエール セラム": "/images/product-serum.jpg",
  "ヴェルール クリーム": "/images/product-cream.jpg",
  "ロゼ トーナー": "/images/product-toner.jpg",
  "ペタル クレンジング": "/images/product-cleansing.png",
  "エクロール アイクリーム": "/images/product-eyecream.png",
  "シエル UV プロテクト": "/images/product-sunscreen.png",
  "ノクテイユ ナイトマスク": "/images/product-nightmask.png",
  "セレーヌ コフレセット": "/images/product-coffret.png",
};

export function getProductImage(product: Product): string {
  if (product.image_urls && product.image_urls.length > 0 && product.image_urls[0]) {
    return product.image_urls[0];
  }
  return imageMap[product.name] || "/images/product-serum.jpg";
}

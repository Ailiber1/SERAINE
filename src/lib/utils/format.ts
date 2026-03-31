/**
 * 価格をカンマ区切りで表示
 */
export function formatPrice(price: number): string {
  return `¥${price.toLocaleString("ja-JP")}`;
}

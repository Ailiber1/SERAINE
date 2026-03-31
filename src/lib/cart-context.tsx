"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types/database";

export interface LocalCartItem {
  product_id: string;
  quantity: number;
  product?: Product;
}

interface CartContextType {
  items: LocalCartItem[];
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  isAdding: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "seraine_cart";

// --- localStorage helpers ---
function getStoredCart(): LocalCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function storeCart(items: LocalCartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    CART_KEY,
    JSON.stringify(items.map(({ product_id, quantity }) => ({ product_id, quantity })))
  );
}

function clearStoredCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
}

// --- 商品情報を付与するヘルパー ---
async function enrichItems(
  rawItems: { product_id: string; quantity: number }[]
): Promise<LocalCartItem[]> {
  if (rawItems.length === 0) return [];
  const supabase = createClient();
  const ids = rawItems.map((i) => i.product_id);
  const { data } = await supabase
    .from("products")
    .select("*")
    .in("id", ids)
    .eq("is_active", true);
  if (!data) return [];
  return rawItems
    .map((item) => ({
      ...item,
      product: data.find((p) => p.id === item.product_id) as Product | undefined,
    }))
    .filter((item) => item.product);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  // userIdRef を常に最新に保つ
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // --- Supabase からカートを読み込む ---
  const loadServerCart = useCallback(async (uid: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cart_items")
      .select("product_id, quantity")
      .eq("user_id", uid);

    if (error) {
      console.error("カート読み込みエラー:", error);
      return;
    }

    if (data && data.length > 0) {
      const enriched = await enrichItems(data);
      setItems(enriched);
    } else {
      setItems([]);
    }
  }, []);

  // --- ログイン時: localStorage → cart_items にマージ ---
  const mergeLocalCartToServer = useCallback(async (uid: string) => {
    const localItems = getStoredCart();
    if (localItems.length === 0) return;

    const supabase = createClient();

    // 既存のサーバーカートを取得
    const { data: serverItems } = await supabase
      .from("cart_items")
      .select("product_id, quantity")
      .eq("user_id", uid);

    const serverMap = new Map<string, number>();
    if (serverItems) {
      for (const si of serverItems) {
        serverMap.set(si.product_id, si.quantity);
      }
    }

    // マージ: 既存商品は数量加算、新規商品は追加
    const upsertRows = localItems.map((item) => ({
      user_id: uid,
      product_id: item.product_id,
      quantity: item.quantity + (serverMap.get(item.product_id) || 0),
    }));

    if (upsertRows.length > 0) {
      await supabase
        .from("cart_items")
        .upsert(upsertRows, { onConflict: "user_id,product_id" });
    }

    // localStorage 削除
    clearStoredCart();
  }, []);

  // --- 初期化: 認証状態に応じてカートをロード ---
  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (user) {
        setUserId(user.id);
        userIdRef.current = user.id;
        await loadServerCart(user.id);
      } else {
        setUserId(null);
        userIdRef.current = null;
        const stored = getStoredCart();
        if (stored.length > 0) {
          const enriched = await enrichItems(stored);
          if (isMounted) {
            setItems(enriched);
            storeCart(enriched);
          }
        }
      }
      if (isMounted) setHydrated(true);
    }

    init();

    // --- 認証状態の変化を監視 ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === "SIGNED_IN" && session?.user) {
          const uid = session.user.id;
          setUserId(uid);
          userIdRef.current = uid;
          // localStorage → サーバーにマージ
          await mergeLocalCartToServer(uid);
          // サーバーカートを再読み込み
          await loadServerCart(uid);
        } else if (event === "SIGNED_OUT") {
          setUserId(null);
          userIdRef.current = null;
          setItems([]);
          clearStoredCart();
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadServerCart, mergeLocalCartToServer]);

  // --- 他のタブでのlocalStorage変更を同期（未ログイン時のみ） ---
  useEffect(() => {
    const handleStorage = () => {
      if (userIdRef.current) return; // ログイン中はスキップ
      const stored = getStoredCart();
      if (stored.length === 0) {
        setItems([]);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // --- addItem ---
  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      setIsAdding(productId);
      const currentUserId = userIdRef.current;

      if (currentUserId) {
        // ログイン済み → Supabase
        const supabase = createClient();
        // 既存の数量を取得
        const { data: existing } = await supabase
          .from("cart_items")
          .select("quantity")
          .eq("user_id", currentUserId)
          .eq("product_id", productId)
          .maybeSingle();

        const newQty = (existing?.quantity || 0) + quantity;
        await supabase
          .from("cart_items")
          .upsert(
            { user_id: currentUserId, product_id: productId, quantity: newQty },
            { onConflict: "user_id,product_id" }
          );
        await loadServerCart(currentUserId);
      } else {
        // 未ログイン → localStorage
        setItems((prev) => {
          const existingItem = prev.find((i) => i.product_id === productId);
          let updated: LocalCartItem[];
          if (existingItem) {
            updated = prev.map((i) =>
              i.product_id === productId
                ? { ...i, quantity: i.quantity + quantity }
                : i
            );
          } else {
            // 商品情報を非同期で取得
            const supabase = createClient();
            supabase
              .from("products")
              .select("*")
              .eq("id", productId)
              .single()
              .then(({ data }) => {
                if (data) {
                  setItems((current) =>
                    current.map((i) =>
                      i.product_id === productId
                        ? { ...i, product: data as Product }
                        : i
                    )
                  );
                }
              });
            updated = [...prev, { product_id: productId, quantity }];
          }
          storeCart(updated);
          return updated;
        });
      }
      setTimeout(() => setIsAdding(null), 800);
    },
    [loadServerCart]
  );

  // --- removeItem ---
  const removeItem = useCallback(
    async (productId: string) => {
      const currentUserId = userIdRef.current;

      if (currentUserId) {
        const supabase = createClient();
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", currentUserId)
          .eq("product_id", productId);
        await loadServerCart(currentUserId);
      } else {
        setItems((prev) => {
          const updated = prev.filter((i) => i.product_id !== productId);
          storeCart(updated);
          return updated;
        });
      }
    },
    [loadServerCart]
  );

  // --- updateQuantity ---
  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity < 1) return;
      const currentUserId = userIdRef.current;

      if (currentUserId) {
        const supabase = createClient();
        await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("user_id", currentUserId)
          .eq("product_id", productId);
        await loadServerCart(currentUserId);
      } else {
        setItems((prev) => {
          const updated = prev.map((i) =>
            i.product_id === productId ? { ...i, quantity } : i
          );
          storeCart(updated);
          return updated;
        });
      }
    },
    [loadServerCart]
  );

  // --- clearCart ---
  const clearCart = useCallback(async () => {
    const currentUserId = userIdRef.current;
    setItems([]);
    clearStoredCart();

    if (currentUserId) {
      const supabase = createClient();
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", currentUserId);
    }
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  if (!hydrated) {
    return (
      <CartContext.Provider
        value={{
          items: [],
          addItem: () => {},
          removeItem: () => {},
          updateQuantity: () => {},
          clearCart: () => {},
          totalItems: 0,
          isAdding: null,
        }}
      >
        {children}
      </CartContext.Provider>
    );
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        isAdding,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

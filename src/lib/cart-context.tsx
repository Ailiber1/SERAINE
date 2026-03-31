"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // localStorageから復元 + 商品情報を取得
  useEffect(() => {
    const stored = getStoredCart();
    if (stored.length === 0) {
      setHydrated(true);
      return;
    }

    const supabase = createClient();
    const ids = stored.map((i) => i.product_id);

    supabase
      .from("products")
      .select("*")
      .in("id", ids)
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) {
          const enriched = stored
            .map((item) => ({
              ...item,
              product: data.find((p) => p.id === item.product_id) as Product | undefined,
            }))
            .filter((item) => item.product);
          setItems(enriched);
          storeCart(enriched);
        }
        setHydrated(true);
      });
  }, []);

  const addItem = useCallback(
    (productId: string, quantity = 1) => {
      setIsAdding(productId);
      setItems((prev) => {
        const existing = prev.find((i) => i.product_id === productId);
        let updated: LocalCartItem[];
        if (existing) {
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
      setTimeout(() => setIsAdding(null), 800);
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.product_id !== productId);
      storeCart(updated);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) => {
      const updated = prev.map((i) =>
        i.product_id === productId ? { ...i, quantity } : i
      );
      storeCart(updated);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    storeCart([]);
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

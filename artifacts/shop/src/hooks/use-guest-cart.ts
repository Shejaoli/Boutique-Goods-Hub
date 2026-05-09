import { useState, useEffect, useCallback } from "react";

export interface GuestCartItem {
  productId: number;
  name: string;
  price: number;
  unit: string;
  imageUrl?: string | null;
  quantity: number;
}

const STORAGE_KEY = "greenbasket_guest_cart";

function readStorage(): GuestCartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(items: GuestCartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* ignore */ }
}

// Global listeners so all hooks sync on storage changes
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

export function useGuestCart() {
  const [items, setItems] = useState<GuestCartItem[]>(readStorage);

  useEffect(() => {
    const sync = () => setItems(readStorage());
    listeners.add(sync);
    return () => { listeners.delete(sync); };
  }, []);

  const save = useCallback((next: GuestCartItem[]) => {
    writeStorage(next);
    setItems(next);
    notify();
  }, []);

  const addItem = useCallback((product: Omit<GuestCartItem, "quantity">) => {
    const current = readStorage();
    const idx = current.findIndex(i => i.productId === product.productId);
    if (idx >= 0) {
      const next = current.map((i, j) => j === idx ? { ...i, quantity: i.quantity + 1 } : i);
      save(next);
    } else {
      save([...current, { ...product, quantity: 1 }]);
    }
  }, [save]);

  const updateQty = useCallback((productId: number, quantity: number) => {
    const current = readStorage();
    const next = quantity <= 0
      ? current.filter(i => i.productId !== productId)
      : current.map(i => i.productId === productId ? { ...i, quantity } : i);
    save(next);
  }, [save]);

  const removeItem = useCallback((productId: number) => {
    save(readStorage().filter(i => i.productId !== productId));
  }, [save]);

  const clearCart = useCallback(() => {
    save([]);
  }, [save]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return { items, count, subtotal, addItem, updateQty, removeItem, clearCart };
}

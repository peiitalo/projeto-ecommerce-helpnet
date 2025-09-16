import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'helpnet_cart_v1';

// Utilitário para ler/gravar no localStorage com segurança
function safeStorageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}
function safeStorageSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => safeStorageGet(STORAGE_KEY, []));

  // Persiste mudanças
  useEffect(() => {
    safeStorageSet(STORAGE_KEY, items);
  }, [items]);

  // Adiciona item (soma quantidade se já existir)
  const addItem = (product, quantity = 1) => {
    if (!product || !product.id) return;
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        const newQty = Math.min((next[idx].quantity || 0) + quantity, product.estoque ?? 9999);
        next[idx] = { ...next[idx], quantity: newQty };
        return next;
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          image: product.image || null,
          sku: product.sku || '',
          estoque: product.estoque ?? 0,
          quantity: Math.min(quantity, product.estoque ?? quantity),
        },
      ];
    });
  };

  const removeItem = (id) => setItems((prev) => prev.filter((p) => p.id !== id));

  const updateQuantity = (id, quantity) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, Math.min(quantity, p.estoque ?? 9999)) } : p)));
  };

  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((sum, i) => sum + (i.quantity || 0), 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + (i.price * (i.quantity || 0)), 0), [items]);

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    count,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider');
  return ctx;
}
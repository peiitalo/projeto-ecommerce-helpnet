import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { carrinhoService } from '../services/api.js';

const CartContext = createContext(null);

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
  const { user } = useAuth();
  const STORAGE_KEY = user ? `helpnet_cart_${user.id}` : 'helpnet_cart_guest';

  const [items, setItems] = useState(() => safeStorageGet(STORAGE_KEY, []));

  // Persiste mudanças
  useEffect(() => {
    safeStorageSet(STORAGE_KEY, items);
  }, [items, STORAGE_KEY]);

  // Sync cart when user logs in
  useEffect(() => {
    if (user) {
      const guestKey = 'helpnet_cart_guest';
      const guestItems = safeStorageGet(guestKey, []);
      if (guestItems.length > 0) {
        // Add guest items to backend
        Promise.all(guestItems.map(item => carrinhoService.adicionar(item.id, item.quantity))).then(() => {
          // Clear guest cart
          safeStorageSet(guestKey, []);
          // Fetch updated cart
          return carrinhoService.listar();
        }).then(data => {
          const backendItems = data.itens.map(item => ({
            id: item.produto.ProdutoID,
            name: item.produto.Nome,
            price: item.produto.Preco,
            image: item.produto.Imagens?.[0] || null,
            sku: item.produto.SKU,
            estoque: item.produto.Estoque,
            quantity: item.Quantidade,
          }));
          setItems(backendItems);
        }).catch(error => {
          console.error('Erro ao sync carrinho:', error);
          setItems([]);
        });
      } else {
        // Fetch cart from backend
        carrinhoService.listar().then(data => {
          const backendItems = data.itens.map(item => ({
            id: item.produto.ProdutoID,
            name: item.produto.Nome,
            price: item.produto.Preco,
            image: item.produto.Imagens?.[0] || null,
            sku: item.produto.SKU,
            estoque: item.produto.Estoque,
            quantity: item.Quantidade,
          }));
          setItems(backendItems);
        }).catch(error => {
          console.error('Erro ao carregar carrinho:', error);
          setItems([]);
        });
      }
    }
  }, [user]);

  // Adiciona item (soma quantidade se já existir)
  const addItem = async (product, quantity = 1) => {
    if (!product || !product.id) return;
    if (user) {
      try {
        await carrinhoService.adicionar(product.id, quantity);
        // Update local state
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
      } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
      }
    } else {
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
    }
  };

  const removeItem = async (id) => {
    if (user) {
      try {
        await carrinhoService.remover(id);
        setItems((prev) => prev.filter((p) => p.id !== id));
      } catch (error) {
        console.error('Erro ao remover do carrinho:', error);
      }
    } else {
      setItems((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const updateQuantity = async (id, quantity) => {
    if (user) {
      try {
        await carrinhoService.atualizar(id, quantity);
        setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, Math.min(quantity, p.estoque ?? 9999)) } : p)));
      } catch (error) {
        console.error('Erro ao atualizar quantidade:', error);
      }
    } else {
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, Math.min(quantity, p.estoque ?? 9999)) } : p)));
    }
  };

  const clear = async () => {
    if (user) {
      try {
        await carrinhoService.limpar();
        setItems([]);
      } catch (error) {
        console.error('Erro ao limpar carrinho:', error);
      }
    } else {
      setItems([]);
    }
  };

  const count = useMemo(() => items.length, [items]); // Conta itens únicos
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

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { carrinhoService, freteService } from '../services/api.js';

// Utility function to get full image URL
const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; // Already full URL

  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `/api/${cleanPath}`;
};

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

  const [items, setItems] = useState([]);
  const [freightOptions, setFreightOptions] = useState([]);
  const [selectedFreight, setSelectedFreight] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [freightLoading, setFreightLoading] = useState(false);
  const [freightError, setFreightError] = useState(null);

  // Persiste mudanças
  useEffect(() => {
    safeStorageSet(STORAGE_KEY, items);
  }, [items, STORAGE_KEY]);

  // Limpa carrinho quando usuário muda (logout/login com outra conta)
  useEffect(() => {
    const prevUserId = localStorage.getItem('cart_prev_user_id');
    const currentUserId = user?.id || null;

    if (prevUserId !== currentUserId?.toString()) {
      // Usuário mudou, limpa carrinho local
      setItems([]);
      localStorage.setItem('cart_prev_user_id', currentUserId || '');
    }
  }, [user?.id]);

  // Sync cart when user logs in
  useEffect(() => {
    if (user) {
      // Sempre carrega do backend quando usuário está logado
      carrinhoService.listar().then(data => {
        const backendItems = (data.itens || []).map(item => ({
          id: item.produto.ProdutoID,
          name: item.produto.Nome,
          price: item.produto.Preco,
          image: getFullImageUrl(item.produto.Imagens?.[0]) || null,
          sku: item.produto.SKU,
          estoque: item.produto.Estoque,
          quantity: item.Quantidade,
        }));
        setItems(backendItems);
      }).catch(error => {
        console.error('Erro ao carregar carrinho:', error);
        setItems([]);
      });
    } else {
      // Usuário não logado, carrega do localStorage guest
      const guestItems = safeStorageGet('helpnet_cart_guest', []);
      setItems(guestItems);
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

  // Calcular frete baseado no endereço selecionado e produtos específicos
  const calculateFreight = async (enderecoId, produtoIds = null) => {
    if (!user || !enderecoId) {
      setFreightOptions([]);
      setSelectedFreight(null);
      return;
    }

    // Usar produtoIds fornecidos ou todos os itens do carrinho
    const idsParaCalculo = produtoIds || items.map(item => item.id);

    if (idsParaCalculo.length === 0) {
      setFreightOptions([]);
      setSelectedFreight(null);
      return;
    }

    setFreightLoading(true);
    setFreightError(null);

    try {
      const freteResult = await freteService.calcular(user.id, enderecoId, idsParaCalculo);

      const options = freteResult.opcoes || [];
      setFreightOptions(options);

      // Selecionar primeira opção como padrão se disponível
      if (options.length > 0) {
        setSelectedFreight(options[0]);
      } else {
        setSelectedFreight(null);
      }
    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      setFreightError(error.message || 'Erro ao calcular frete');
      setFreightOptions([]);
      setSelectedFreight(null);
    } finally {
      setFreightLoading(false);
    }
  };

  const count = useMemo(() => items.length, [items]); // Conta itens únicos
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + (i.price * (i.quantity || 0)), 0), [items]);
  const freight = useMemo(() => selectedFreight || { valor: 0, prazo: '', nome: '' }, [selectedFreight]);
  const total = useMemo(() => subtotal + freight.valor, [subtotal, freight.valor]);

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    count,
    subtotal,
    total,
    freight,
    freightOptions,
    selectedFreight,
    setSelectedFreight,
    selectedAddress,
    setSelectedAddress,
    calculateFreight,
    freightLoading,
    freightError,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider');
  return ctx;
}

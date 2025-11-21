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
  const COUPON_STORAGE_KEY = user ? `helpnet_coupon_${user.id}` : 'helpnet_coupon_guest';

  const [items, setItems] = useState([]);
  const [freightOptions, setFreightOptions] = useState([]);
  const [selectedFreight, setSelectedFreight] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [freightLoading, setFreightLoading] = useState(false);
  const [freightError, setFreightError] = useState(null);
  const [appliedCoupons, setAppliedCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  // Persiste mudanças
  useEffect(() => {
    safeStorageSet(STORAGE_KEY, items);
  }, [items, STORAGE_KEY]);

  // Persiste cupons aplicados
  useEffect(() => {
    safeStorageSet(COUPON_STORAGE_KEY, appliedCoupons);
  }, [appliedCoupons, COUPON_STORAGE_KEY]);

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
          originalPrice: item.produto.PrecoOriginal || item.produto.Preco,
          discount: item.produto.Desconto || 0,
          freeShipping: item.produto.FreteGratis || false,
          deliveryTime: item.produto.PrazoEntrega || null,
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

      // Carrega cupons aplicados do localStorage
      const savedCoupons = safeStorageGet(COUPON_STORAGE_KEY, []);
      setAppliedCoupons(Array.isArray(savedCoupons) ? savedCoupons : []);
    } else {
      // Usuário não logado, carrega do localStorage guest
      const guestItems = safeStorageGet('helpnet_cart_guest', []);
      setItems(guestItems);

      // Carrega cupons aplicados do localStorage guest
      const guestCoupons = safeStorageGet('helpnet_coupon_guest', []);
      setAppliedCoupons(Array.isArray(guestCoupons) ? guestCoupons : []);
    }
  }, [user, COUPON_STORAGE_KEY]);

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
              originalPrice: Number(product.originalPrice || product.price) || 0,
              discount: product.discount || 0,
              freeShipping: product.freeShipping || false,
              deliveryTime: product.deliveryTime || null,
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
            originalPrice: Number(product.originalPrice || product.price) || 0,
            discount: product.discount || 0,
            freeShipping: product.freeShipping || false,
            deliveryTime: product.deliveryTime || null,
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

  const clear = async (itemIds = null) => {
    if (user) {
      try {
        if (itemIds && itemIds.length > 0) {
          // Remove only specific items
          await Promise.all(itemIds.map(id => carrinhoService.remover(id)));
          setItems((prev) => prev.filter((p) => !itemIds.includes(p.id)));
        } else {
          // Clear all items
          await carrinhoService.limpar();
          setItems([]);
        }
      } catch (error) {
        console.error('Erro ao limpar carrinho:', error);
      }
    } else {
      if (itemIds && itemIds.length > 0) {
        // Remove only specific items from localStorage
        setItems((prev) => prev.filter((p) => !itemIds.includes(p.id)));
      } else {
        // Clear all items
        setItems([]);
      }
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
    const itemsParaCalculo = items.filter(item => idsParaCalculo.includes(item.id));

    if (idsParaCalculo.length === 0) {
      setFreightOptions([]);
      setSelectedFreight(null);
      return;
    }

    // Filtrar apenas produtos que NÃO têm frete grátis para cálculo
    const produtosQuePagamFrete = itemsParaCalculo.filter(item => !item.freeShipping);
    const idsProdutosQuePagamFrete = produtosQuePagamFrete.map(item => item.id);

    // Se nenhum produto paga frete (todos têm frete grátis), mostrar frete grátis
    if (produtosQuePagamFrete.length === 0) {
      const freteGratisOption = {
        id: 'frete-gratis',
        nome: 'Frete Grátis',
        transportadora: 'HelpNet',
        valor: 0,
        prazo: '3-5 dias úteis',
        descricao: 'Todos os produtos selecionados têm frete grátis',
        ativo: true
      };
      setFreightOptions([freteGratisOption]);
      setSelectedFreight(freteGratisOption);
      setFreightLoading(false);
      return;
    }

    // Se alguns produtos têm frete grátis, calcular apenas para os que pagam
    setFreightLoading(true);
    setFreightError(null);

    try {
      const freteResult = await freteService.calcular(user.id, enderecoId, idsProdutosQuePagamFrete);

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

  // Calcular subtotal usando preços já com desconto aplicado
  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => {
      return sum + (i.price * (i.quantity || 0));
    }, 0);
  }, [items]);

  const freight = useMemo(() => selectedFreight || { valor: 0, prazo: '', nome: '' }, [selectedFreight]);
  
  // Aplicar cupom (adicionar à lista de cupons aplicados)
  const applyCoupon = async (couponCode, selectedItems = null) => {
    // Improved validation
    const trimmedCode = couponCode.trim().toUpperCase();

    if (!trimmedCode) {
      setCouponError('Digite o código do cupom');
      return false;
    }

    // Validate format: only letters, numbers, underscores, hyphens
    const codeRegex = /^[A-Z0-9_-]+$/;
    if (!codeRegex.test(trimmedCode)) {
      setCouponError('Código do cupom contém caracteres inválidos. Use apenas letras, números, traços (-) e underscores (_)');
      return false;
    }

    // Validate length
    if (trimmedCode.length < 3 || trimmedCode.length > 20) {
      setCouponError('Código do cupom deve ter entre 3 e 20 caracteres');
      return false;
    }

    setCouponLoading(true);
    setCouponError(null);

    const itemsToUse = selectedItems || items;
    const itemsTotal = selectedItems ? selectedItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0) : subtotal;

    try {
      const response = await fetch('/api/cupons/validar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          codigo: trimmedCode,
          itensCarrinho: itemsToUse.map(item => item.id), // Send just product IDs for validation
          valorTotal: itemsTotal
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao validar cupom');
      }

      if (!data.valido) {
        throw new Error(data.error || 'Cupom inválido');
      }

      // Verificar se o cupom já está aplicado
      const isAlreadyApplied = appliedCoupons.some(coupon => coupon.Codigo === data.cupom.Codigo);
      if (isAlreadyApplied) {
        throw new Error('Este cupom já está aplicado');
      }

      // Transform API response to match expected format
      const transformedCoupon = {
        ...data.cupom,
        TipoDesconto: data.cupom.DescontoTipo,
        ValorDesconto: data.cupom.DescontoValor,
        ValorMinimo: data.cupom.Restricoes?.valorMinimo || 0,
        Codigo: data.cupom.Codigo,
        Nome: data.cupom.Nome,
        descontoAplicado: data.desconto,
        valorFinal: data.valorFinal
      };

      setAppliedCoupons(prev => [...prev, transformedCoupon]);
      return true;
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      setCouponError(error.message);
      return false;
    } finally {
      setCouponLoading(false);
    }
  };

  // Remover cupom específico
  const removeCoupon = (couponCode = null) => {
    if (couponCode) {
      // Remove specific coupon
      setAppliedCoupons(prev => prev.filter(coupon => coupon.Codigo !== couponCode));
    } else {
      // Remove all coupons if no code specified
      setAppliedCoupons([]);
    }
    setCouponError(null);
  };

  // Calcular desconto total dos cupons aplicados
  const couponDiscount = useMemo(() => {
    if (!appliedCoupons || appliedCoupons.length === 0) return 0;

    let totalDiscount = 0;
    let currentSubtotal = subtotal;

    // Process discount coupons first (percentage and fixed value)
    const discountCoupons = appliedCoupons.filter(coupon =>
      coupon.TipoDesconto === 'porcentagem' || coupon.TipoDesconto === 'valor_fixo'
    );

    for (const coupon of discountCoupons) {
      if (currentSubtotal < (coupon.ValorMinimo || 0)) continue;

      if (coupon.TipoDesconto === 'porcentagem') {
        const discount = (currentSubtotal * coupon.ValorDesconto) / 100;
        totalDiscount += discount;
        currentSubtotal -= discount; // Reduce subtotal for next coupon calculation
      } else if (coupon.TipoDesconto === 'valor_fixo') {
        const discount = Math.min(coupon.ValorDesconto, currentSubtotal);
        totalDiscount += discount;
        currentSubtotal -= discount;
      }
    }

    return totalDiscount;
  }, [appliedCoupons, subtotal]);
  
  const total = useMemo(() => {
    const hasFreeShipping = appliedCoupons.some(coupon => coupon.TipoDesconto === 'frete_gratis');
    const freightCost = hasFreeShipping ? 0 : freight.valor;
    return Math.max(0, subtotal - couponDiscount + freightCost);
  }, [subtotal, couponDiscount, freight.valor, appliedCoupons]);

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
    appliedCoupons,
    couponDiscount,
    couponLoading,
    couponError,
    applyCoupon,
    removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider');
  return ctx;
}

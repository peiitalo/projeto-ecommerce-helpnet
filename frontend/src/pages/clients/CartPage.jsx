import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { freteService, clienteService } from '../../services/api.js';
import { buildImageUrl } from '../../utils/imageUtils.js';
import { FaTrash, FaArrowLeft, FaTruck, FaMapMarkerAlt, FaShoppingCart } from 'react-icons/fa';

export default function CartPage() {
  const { items, updateQuantity, removeItem, appliedCoupons, applyCoupon, removeCoupon, couponLoading, couponError } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedItems, setSelectedItems] = useState([]);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  // Estados para cálculo de frete
  const [shippingInfo, setShippingInfo] = useState(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState(1); // ID do endereço padrão
  const [isFinalizing, setIsFinalizing] = useState(false); // Estado de carregamento para finalização

  // Estados para endereços
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Buscar endereços do cliente
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;

      setLoadingAddresses(true);
      try {
        const data = await clienteService.listarEnderecos();
        setAddresses(data.enderecos || []);
        if (data.enderecos && data.enderecos.length > 0) {
          setSelectedAddressId(data.enderecos[0].EnderecoID);
        }
      } catch (error) {
        console.error('Erro ao buscar endereços:', error);
        setAddresses([]);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddresses();
    loadAvailableCoupons();
  }, [user]);

  // Carregar cupons disponíveis
  const loadAvailableCoupons = async () => {
    try {
      // Buscar cupons do cliente (resgatados e públicos)
      const response = await fetch('/api/cupons/meus', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filtrar apenas cupons disponíveis para seleção (não expirados e não usados)
          const now = new Date();
          const availableCouponsFiltered = data.data.filter(coupon =>
            (coupon.status === 'available' || coupon.status === 'redeemed') &&
            !coupon.used &&
            new Date(coupon.validUntil) > now
          );

          // Transformar dados da API para o formato esperado
          const coupons = availableCouponsFiltered.map(coupon => ({
            id: coupon.id,
            code: coupon.code,
            discount: coupon.discount,
            type: coupon.type,
            minValue: coupon.minValue,
            description: coupon.description,
            expiryDate: coupon.validUntil,
            restricoes: coupon.restricoes
          }));
          setAvailableCoupons(coupons);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
      // Fallback para dados mock se a API falhar
      const mockCoupons = [
        { code: 'DESCONTO10', discount: 10, type: 'percentage', minValue: 50 },
        { code: 'FRETEGRATIS', discount: 0, type: 'free_shipping', minValue: 100 },
        { code: 'PRIMEIRA15', discount: 15, type: 'percentage', minValue: 0 }
      ];
      setAvailableCoupons(mockCoupons);
    }
  };

  const formatPrice = (n) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const toggleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleQtyChange = (id, delta) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    updateQuantity(id, Math.max(1, (item.quantity || 1) + delta));
  };

  const handleRemoveSelected = () => {
    if (
      window.confirm(
        `Tem certeza que deseja remover ${selectedItems.length} item(s) selecionado(s)?`
      )
    ) {
      selectedItems.forEach((id) => removeItem(id));
      setSelectedItems([]);
    }
  };

  const toggleCoupon = async (code) => {
    const isApplied = appliedCoupons.some(coupon => coupon.Codigo === code);

    if (isApplied) {
      // Removing coupon
      removeCoupon(code);
    } else {
      // Applying new coupon
      const selectedItemsData = selectedItems.map(id => items.find(item => item.id === id)).filter(Boolean);
      const success = await applyCoupon(code, selectedItemsData);
      if (!success && couponError) {
        // Error is already handled by CartContext
        console.log('Coupon application failed:', couponError);
      }
    }
  };


  // Função para calcular frete
  const calculateShipping = async () => {
    if (!user || selectedItems.length === 0) return;

    setCalculatingShipping(true);
    setShippingError('');

    try {
      const produtoIds = selectedItems;
      const result = await freteService.calcular(user.id, selectedAddressId, produtoIds);
      setShippingInfo(result);
    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      setShippingError(error.message || 'Erro ao calcular frete');
      setShippingInfo(null);
    } finally {
      setCalculatingShipping(false);
    }
  };

  // Subtotal baseado em itens selecionados
  const subtotal = useMemo(() => {
    // Filtrar apenas itens selecionados e calcular subtotal com desconto
    return selectedItems.reduce((acc, id) => {
      const item = items.find((i) => i.id === id);
      if (!item) return acc;
      const basePrice = item.originalPrice || item.price || 0;
      const discount = item.discount || 0;
      const discountedPrice = basePrice * (1 - discount / 100);
      return acc + (discountedPrice * (item.quantity || 1));
    }, 0);
  }, [selectedItems, items]);

  // Import discount calculation from CartContext
  const { couponDiscount } = useCart();

  // Verificar se tem frete grátis por cupom
  const hasFreeShippingCoupon = appliedCoupons.some(coupon => coupon.TipoDesconto === 'frete_gratis' && subtotal >= (coupon.ValorMinimo || 0));

  // Total incluindo frete e desconto (usando couponDiscount do CartContext)
  const total = useMemo(() => {
    let totalValue = subtotal - couponDiscount;
    if (shippingInfo && shippingInfo.frete > 0 && !hasFreeShippingCoupon) {
      totalValue += shippingInfo.frete;
    }
    return Math.max(0, totalValue);
  }, [subtotal, couponDiscount, shippingInfo, hasFreeShippingCoupon]);

  const handleFinalizePurchase = () => {
    if (selectedItems.length === 0) return;

    setIsFinalizing(true);
    try {
      // Persistir dados do checkout
      const checkoutData = {
        selectedItems,
        subtotal,
        couponDiscount,
        appliedCoupons,
        shippingInfo,
        selectedAddressId
      };
      sessionStorage.setItem('helpnet_checkout_data', JSON.stringify(checkoutData));
      navigate('/checkout');
    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header fixo */}
      <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => navigate('/home')}
              className="p-2 text-slate-600 hover:text-blue-700 transition-colors"
              aria-label="Voltar"
            >
              <FaArrowLeft className="text-lg" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">Carrinho</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de itens */}
        <section className="lg:col-span-2 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <FaShoppingCart className="text-6xl text-slate-300 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">Seu carrinho está vazio</h2>
              <p className="text-slate-600 mb-6">Adicione produtos ao seu carrinho para vê-los aqui.</p>
              <Link
                to="/home"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Explorar produtos
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`p-4 border rounded-xl flex gap-4 items-center transition ${
                  selectedItems.includes(item.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:shadow'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleSelectItem(item.id)}
                  className="h-5 w-5 text-blue-600"
                />
                {/* Correção: Padronização de URLs de imagem usando buildImageUrl para consistência com outras telas */}
                <div className="w-24 h-24 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                  <img
                    src={buildImageUrl(item.image)}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2
                      className="font-semibold text-slate-900 cursor-pointer hover:text-blue-600 flex-1"
                      onClick={() => navigate(`/produto/${item.id}`)}
                    >
                      {item.name}
                    </h2>
                    <button
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja remover "${item.name}" do carrinho?`)) {
                          removeItem(item.id);
                        }
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                      title="Remover item"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                  {item.sku && (
                    <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    {(() => {
                      const discountValue = Number(item.discount) || 0;
                      const basePrice = item.originalPrice || item.price || 0;

                      if (discountValue > 0) {
                        const discountedPrice = basePrice * (1 - discountValue / 100);
                        return (
                          <div className="flex flex-col">
                            <span className="text-green-700 font-semibold">
                              {formatPrice(discountedPrice)}
                            </span>
                            <span className="text-xs text-slate-400 line-through">
                              {formatPrice(basePrice)}
                            </span>
                          </div>
                        );
                      } else {
                        return (
                          <span className="text-blue-700 font-semibold">
                            {formatPrice(basePrice)}
                          </span>
                        );
                      }
                    })()}
                    {typeof item.estoque === 'number' && (
                      <span className="text-xs text-slate-500">
                        Estoque: {item.estoque}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleQtyChange(item.id, -1)}
                      disabled={item.quantity <= 1}
                      className="px-2 py-1 border rounded disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 border rounded bg-slate-50">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQtyChange(item.id, 1)}
                      className="px-2 py-1 border rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Sidebar fixa */}
        <aside className="lg:col-span-1 sticky top-20 self-start space-y-4">
          <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-3 shadow-sm">

            {/* Cupons */}
            <div className="mt-4">
              <h3 className="font-semibold text-gray-700 mb-2">Seus cupons</h3>

              {availableCoupons.length === 0 ? (
                <div className="p-3 border border-slate-200 rounded-lg text-center text-slate-500 text-sm">
                  Você não tem cupons disponíveis
                  <button
                    onClick={() => navigate('/cupons')}
                    className="block mt-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver meus cupons
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <div className="grid grid-rows-1 grid-flow-col gap-2 min-w-max">
                    {availableCoupons.map((c) => (
                      <label
                        key={c.code}
                        className={`flex justify-between items-center border px-5 py-3 rounded-lg cursor-pointer hover:bg-slate-50 min-h-[3.5rem] w-64 ${
                          appliedCoupons.some(coupon => coupon.Codigo === c.code) ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex-1">
                          <span className="text-slate-900 font-medium">
                            {c.code}
                          </span>
                          {c.description && (
                            <div className="text-xs text-slate-600 mt-1">
                              {c.description}
                            </div>
                          )}
                          <div className="text-xs text-slate-500">
                            {c.type === 'percentage' ? `${c.discount}% OFF` :
                             c.type === 'free_shipping' ? 'Frete grátis' :
                             `R$ ${c.discount} OFF`}
                            {c.minValue > 0 && ` - Mín. R$ ${c.minValue}`}
                          </div>
                          {c.restricoes?.categoriaNome && (
                            <div className="text-xs text-slate-500 mt-1">
                              Válido para: {c.restricoes.categoriaNome}
                            </div>
                          )}
                          {c.expiryDate && (
                            <div className="text-xs text-orange-600 mt-1">
                              Vence em: {new Date(c.expiryDate).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={appliedCoupons.some(coupon => coupon.Codigo === c.code)}
                          onChange={() => toggleCoupon(c.code)}
                          disabled={couponLoading}
                          className="h-5 w-5 text-blue-600 ml-2"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {couponError && (
                <p className="text-sm mt-2 text-red-600">
                  {couponError}
                </p>
              )}
            </div>


            {/* Método de Pagamento removido: a seleção e distribuição ocorrerá no checkout */}

            {/* Resumo */}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {appliedCoupons.length > 0 && couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto{couponLoading ? ' (aplicando...)' : ''}</span>
                  <span>
                    {`-${formatPrice(couponDiscount)}`}
                  </span>
                </div>
              )}
              {shippingInfo && shippingInfo.frete > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Frete</span>
                  <span className={hasFreeShippingCoupon ? 'line-through text-slate-400' : ''}>
                    {formatPrice(shippingInfo.frete)}
                  </span>
                </div>
              )}
              {hasFreeShippingCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Frete (cupom)</span>
                  <span>Grátis</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-lg font-semibold text-slate-900">Total</span>
                <span className="text-lg font-bold text-blue-700">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Botão finalizar compra */}
            <button
              onClick={handleFinalizePurchase}
              disabled={selectedItems.length === 0 || isFinalizing}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 mt-4"
              aria-label="Finalizar compra"
            >
              {isFinalizing ? 'Finalizando...' : 'Finalizar compra'}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}


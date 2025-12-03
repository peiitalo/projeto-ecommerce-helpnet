import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { buildImageUrl } from '../../utils/imageUtils.js';
import { FaTrash, FaArrowLeft, FaShoppingCart } from 'react-icons/fa';

export default function CartPage() {
  const { items, updateQuantity, removeItem, appliedCoupons, couponDiscount } = useCart();
  const navigate = useNavigate();

  const [selectedItems, setSelectedItems] = useState([]);

  const [isFinalizing, setIsFinalizing] = useState(false); // Estado de carregamento para finalização



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


  // Total com desconto do cupom
  const total = useMemo(() => {
    return Math.max(0, subtotal - couponDiscount);
  }, [subtotal, couponDiscount]);

  const handleFinalizePurchase = () => {
    if (selectedItems.length === 0) return;

    setIsFinalizing(true);
    try {
      // Persistir dados do checkout
      const checkoutData = {
        selectedItems,
        subtotal,
        couponDiscount,
        appliedCoupons
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


            {/* Método de Pagamento removido: a seleção e distribuição ocorrerá no checkout */}

            {/* Resumo */}
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900">Itens selecionados ({selectedItems.length})</h3>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">Subtotal</span>
                <span className="font-semibold text-blue-700">
                  {formatPrice(subtotal)}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Desconto</span>
                  <span>
                    {`-${formatPrice(couponDiscount)}`}
                  </span>
                </div>
              )}
              <hr className="border-slate-200 my-2" />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-semibold text-blue-700">
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



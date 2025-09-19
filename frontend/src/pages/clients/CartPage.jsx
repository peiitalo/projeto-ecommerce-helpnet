import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { freteService, clienteService } from '../../services/api.js';
import { FaTrash, FaArrowLeft, FaTruck, FaMapMarkerAlt } from 'react-icons/fa';
import '@fontsource/poppins/400.css'; // Regular
import '@fontsource/poppins/600.css'; // Semibold

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedItems, setSelectedItems] = useState([]);
  const [coupon, setCoupon] = useState('');
  const [selectedCoupons, setSelectedCoupons] = useState([]);

  // Estados para cálculo de frete
  const [shippingInfo, setShippingInfo] = useState(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState(1); // ID do endereço padrão

  // Estados para endereços
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const availableCoupons = [
    { code: 'PROMO10', discount: 0.1 },
    { code: 'FRETEGRATIS', discount: 0 }, // exemplo: frete grátis
  ];

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
  }, [user]);

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

  const toggleCoupon = (code) => {
    setSelectedCoupons((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
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
    return selectedItems.reduce((acc, id) => {
      const item = items.find((i) => i.id === id);
      if (!item) return acc;
      return acc + item.price * item.quantity;
    }, 0);
  }, [selectedItems, items]);

  // Total incluindo frete
  const total = useMemo(() => {
    let totalValue = subtotal;
    if (shippingInfo && shippingInfo.frete > 0) {
      totalValue += shippingInfo.frete;
    }
    return totalValue;
  }, [subtotal, shippingInfo]);

  return (
    <div className="min-h-screen bg-gray-50 font-poppins flex flex-col">
      {/* Header fixo */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            <FaArrowLeft /> Carrinho
          </button>

          {selectedItems.length > 0 && (
            <button
              onClick={handleRemoveSelected}
              className="text-red-600 hover:text-red-700 flex items-center gap-1"
              title="Remover itens selecionados"
            >
              <FaTrash size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de itens */}
        <section className="lg:col-span-2 space-y-4">
          {items.length === 0 ? (
            <div className="p-8 border border-gray-200 rounded-xl text-center text-gray-500">
              Seu carrinho está vazio.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`p-4 border rounded-xl flex gap-4 items-center transition ${
                  selectedItems.includes(item.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:shadow'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleSelectItem(item.id)}
                  className="h-5 w-5 text-blue-600"
                />
                <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">Sem imagem</div>
                  )}
                </div>
                <div className="flex-1">
                  <h2
                    className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/produto/${item.id}`)}
                  >
                    {item.name}
                  </h2>
                  {item.sku && (
                    <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-blue-700 font-semibold">
                      {formatPrice(item.price)}
                    </span>
                    {typeof item.estoque === 'number' && (
                      <span className="text-xs text-gray-500">
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
                    <span className="px-3 py-1 border rounded bg-gray-50">
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
          <div className="p-4 border border-gray-200 rounded-xl bg-white space-y-3 shadow-sm">

            {/* Input para cupom */}
            <div className="mt-3 space-y-2">
              <input
                type="text"
                placeholder="Código do cupom"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={() => {
                  if (coupon.trim()) {
                    toggleCoupon(coupon);
                    setCoupon('');
                  }
                }}
                disabled={!coupon.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Aplicar cupom
              </button>
            </div>

            {/* Cupons */}
            <div className="mt-4">
              <h3 className="font-semibold text-gray-700 mb-2">Seus cupons</h3>
              {availableCoupons.length === 0 ? (
                <div className="p-3 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
                  Você não tem cupons
                  <button
                    onClick={() => navigate('/cupons')}
                    className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mais detalhes
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableCoupons.map((c) => (
                    <label
                      key={c.code}
                      className="flex justify-between items-center border px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <span className="text-gray-900 font-medium">
                        {c.code} ({c.discount ? `${c.discount * 100}%` : 'Frete grátis'})
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedCoupons.includes(c.code)}
                        onChange={() => toggleCoupon(c.code)}
                        className="h-5 w-5 text-blue-600"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>


            {/* Total */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-blue-700">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Botão finalizar compra */}
            <button
              disabled={selectedItems.length === 0}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 mt-4"
            >
              Finalizar compra
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

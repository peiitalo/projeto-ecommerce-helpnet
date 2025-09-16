import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { FaTrash, FaShoppingCart } from 'react-icons/fa';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clear, subtotal } = useCart();

  const formatPrice = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleQtyChange = (id, delta) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    updateQuantity(id, (item.quantity || 1) + delta);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
            <FaShoppingCart /> Carrinho
          </h1>
          <Link to="/home" className="text-blue-600 hover:text-blue-700 text-sm">Continuar comprando</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          {items.length === 0 ? (
            <div className="p-8 border border-slate-200 rounded-xl text-center text-slate-600">
              Seu carrinho está vazio.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="p-4 border border-slate-200 rounded-xl flex gap-4">
                <div className="w-24 h-24 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-400 text-sm">Sem imagem</div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-slate-900">{item.name}</h2>
                  {item.sku && <p className="text-xs text-slate-500">SKU: {item.sku}</p>}
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-blue-700 font-semibold">{formatPrice(item.price)}</span>
                    {typeof item.estoque === 'number' && <span className="text-xs text-slate-500">Estoque: {item.estoque}</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => handleQtyChange(item.id, -1)} disabled={item.quantity <= 1} className="px-2 py-1 border rounded disabled:opacity-50">-</button>
                    <span className="px-3 py-1 border rounded bg-slate-50">{item.quantity}</span>
                    <button onClick={() => handleQtyChange(item.id, 1)} className="px-2 py-1 border rounded">+</button>
                    <button onClick={() => removeItem(item.id)} className="ml-4 px-3 py-1.5 border border-red-200 text-red-600 rounded flex items-center gap-2 hover:bg-red-50">
                      <FaTrash /> Remover
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        <aside className="lg:col-span-1">
          <div className="p-4 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
            </div>
            <button disabled={items.length === 0} className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
              Finalizar compra
            </button>
            <button onClick={clear} disabled={items.length === 0} className="w-full px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              Limpar carrinho
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
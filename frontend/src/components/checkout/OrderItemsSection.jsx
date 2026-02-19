import { useCart } from '../../context/CartContext.jsx';

function OrderItemsSection({ orderData, getSelectedItems }) {
  const { items } = useCart();

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Itens do Pedido</h2>
      <div className="space-y-4">
        {(orderData?.items?.length > 0 ? orderData.items : items.filter(item => getSelectedItems().includes(item.id))).map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg">
            <img
              src={item.image || '/placeholder-image.png'}
              alt={item.name}
              className="w-16 h-16 object-cover rounded-lg"
              onError={(e) => {
                e.target.src = '/placeholder-image.png';
              }}
            />
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">{item.name}</h3>
              <p className="text-sm text-slate-600">Quantidade: {item.quantity}</p>
              {/* Mostrar desconto e/ou frete gratis */}
              {(() => {
                const discountValue = Number(item.discount) || 0;
                const hasFreeShipping = Boolean(item.freeShipping);

                if (discountValue > 0 && hasFreeShipping) {
                  return <p className="text-sm text-green-600 font-medium">Frete grátis e Desconto {discountValue}%</p>;
                } else if (discountValue > 0) {
                  return <p className="text-sm text-green-600 font-medium">Desconto {discountValue}%</p>;
                } else if (hasFreeShipping) {
                  return <p className="text-sm text-green-600 font-medium">Frete gratis</p>;
                }
                return null;
              })()}
            </div>
            <div className="text-right">
              {(() => {
                const discountValue = Number(item.discount) || 0;
                const quantity = item.quantity || 1;
                const totalPrice = item.price * quantity;

                if (discountValue > 0) {
                  const originalPrice = item.originalPrice || (item.price / (1 - discountValue / 100));
                  const originalTotal = originalPrice * quantity;

                  return (
                    <div>
                      <p className="font-semibold text-green-600">{formatPrice(totalPrice)}</p>
                      <p className="text-sm text-slate-400 line-through">{formatPrice(originalTotal)}</p>
                      <p className="text-sm text-slate-600">{formatPrice(item.price)} cada</p>
                    </div>
                  );
                } else {
                  return (
                    <div>
                      <p className="font-semibold text-slate-900">{formatPrice(totalPrice)}</p>
                      <p className="text-sm text-slate-600">{formatPrice(item.price)} cada</p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        ))}
        {(!orderData?.items || orderData.items.length === 0) && items.filter(item => getSelectedItems().includes(item.id)).length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-600">Nenhum item selecionado para checkout.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderItemsSection;
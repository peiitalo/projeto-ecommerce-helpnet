import { FaCheck, FaTimes } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import CouponInput from '../CouponInput';

function OrderSummary({
  orderData,
  freight,
  appliedCoupons,
  selectedFreight,
  freightLoading,
  processingOrder,
  selectedAddress,
  calcularTotalPagamentos,
  calcularValorRestante,
  handleFinalizarPedido,
  items,
  getSelectedItems
}) {
  const { removeCoupon } = useCart();

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Get selected items for coupon validation
  const selectedItemIds = getSelectedItems ? getSelectedItems() : [];
  const selectedItems = items ? items.filter(item => selectedItemIds.includes(item.id)) : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Resumo do Pedido</h2>

      {/* Applied Coupons */}
      {appliedCoupons.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-900 mb-3">Cupons Aplicados</h3>
          <div className="space-y-2">
            {appliedCoupons.map((coupon, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg ${
                  coupon.TipoDesconto === 'frete_gratis'
                    ? 'border-green-500 bg-green-50'
                    : 'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{coupon.Codigo}</p>
                      <p className="text-xs text-slate-600">
                        {coupon.TipoDesconto === 'porcentagem' ? `${coupon.ValorDesconto}% de desconto` :
                         coupon.TipoDesconto === 'valor_fixo' ? `R$ ${coupon.ValorDesconto} de desconto` :
                         coupon.TipoDesconto === 'frete_gratis' ? 'Frete grátis' :
                         'Desconto aplicado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      coupon.TipoDesconto === 'frete_gratis' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {coupon.TipoDesconto === 'frete_gratis' ? 'GRÁTIS' :
                       coupon.TipoDesconto === 'porcentagem' ? `-${coupon.ValorDesconto}%` :
                       `-${formatPrice(coupon.ValorDesconto)}`}
                    </span>
                    <button
                      onClick={() => removeCoupon(coupon.Codigo)}
                      className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                      title="Remover cupom"
                    >
                      <FaTimes className="text-slate-500 text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coupon Input */}
      <div className="mb-6">
        <CouponInput
          cartItems={selectedItems}
          cartTotal={orderData?.subtotal || 0}
          onCouponApplied={() => {}} // CartContext handles this
          disabled={false}
        />
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Subtotal ({orderData?.items?.length || 0} itens)</span>
          <span className="font-medium">{formatPrice(orderData?.subtotal || 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Frete</span>
          <span className="font-medium">
            {freightLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-600"></div>
                <span>Calculando...</span>
              </div>
            ) : orderData?.frete === 0 && appliedCoupons.some(coupon => coupon.TipoDesconto === 'frete_gratis') ? (
              <div className="text-right">
                <div className="text-green-600 font-medium">Frete Grátis</div>
                <div className="text-xs text-slate-500">{selectedFreight?.nome || 'Cupom aplicado'}</div>
              </div>
            ) : selectedFreight ? (
              <div className="text-right">
                <div>{formatPrice(orderData?.frete || 0)}</div>
                <div className="text-xs text-slate-500">{selectedFreight.nome}</div>
              </div>
            ) : (
              formatPrice(orderData?.frete || 0)
            )}
          </span>
        </div>
        <div className="border-t border-slate-200 pt-3">
          <div className="flex justify-between text-lg font-semibold">
            <span className="text-slate-900">Total</span>
            <span className="text-blue-600">{formatPrice(orderData?.total || 0)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleFinalizarPedido}
        disabled={processingOrder || !selectedAddress || calcularTotalPagamentos() === 0 || Math.abs(calcularTotalPagamentos() - (orderData?.total || 0)) > 0.01}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {processingOrder ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processando...</span>
          </div>
        ) : (
          'Finalizar Compra'
        )}
      </button>

      {!selectedAddress && (
        <p className="text-red-600 text-sm mt-2">Selecione um endereço de entrega</p>
      )}
      {calcularTotalPagamentos() === 0 && (
        <p className="text-red-600 text-sm mt-2">Adicione valores aos métodos de pagamento</p>
      )}
      {calcularTotalPagamentos() > 0 && Math.abs(calcularTotalPagamentos() - (orderData?.total || 0)) > 0.01 && (
        <p className="text-red-600 text-sm mt-2">
          O total dos pagamentos deve ser igual a {formatPrice(orderData?.total || 0)}
        </p>
      )}
    </div>
  );
}

export default OrderSummary;
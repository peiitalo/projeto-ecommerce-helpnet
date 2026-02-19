import { FaCheck, FaTimes } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import CouponInput from '../CouponInput';

function OrderSummary({
  orderData,
  appliedCoupons,
  selectedFreight,
  freightLoading,
  processingOrder,
  selectedAddress,
  calcularTotalPagamentos,
  handleFinalizarPedido,
  items,
  getSelectedItems,
  freightOptions = []
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

      {/* Coupon Input - Always visible first */}
      <div className="mb-6">
        <CouponInput
          cartItems={selectedItems}
          cartTotal={orderData?.subtotal || 0}
          onCouponApplied={() => {}} // CartContext handles this
          disabled={false}
        />
      </div>

      {/* Applied Coupons - Below the input */}
      {appliedCoupons.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-900 mb-3">Cupons Aplicados</h3>
          <div className="space-y-3">
            {appliedCoupons.map((coupon, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg ${
                  coupon.TipoDesconto === 'frete_gratis'
                    ? 'border-green-500 bg-green-50'
                    : 'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium text-slate-900 text-sm">{coupon.Codigo}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        coupon.TipoDesconto === 'frete_gratis'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {coupon.TipoDesconto === 'porcentagem' ? `${coupon.ValorDesconto}% desconto` :
                         coupon.TipoDesconto === 'valor_fixo' ? `R$ ${coupon.ValorDesconto} desconto` :
                         coupon.TipoDesconto === 'frete_gratis' ? 'Frete grátis' :
                         'Desconto'}
                      </span>
                    </div>

                    {/* Coupon Information and Restrictions */}
                    <div className="text-xs text-slate-600 mb-2 space-y-1">
                      <p><strong>Descrição:</strong> {coupon.Nome}</p>
                      {coupon.ValorMinimo > 0 && (
                        <p><strong>Valor mínimo:</strong> {formatPrice(coupon.ValorMinimo)}</p>
                      )}
                      {coupon.Restricoes?.categoriaId && (
                        <p><strong>Categoria:</strong> Restrito a categoria específica</p>
                      )}
                      {coupon.DataExpiracao && (
                        <p><strong>Expira em:</strong> {new Date(coupon.DataExpiracao).toLocaleDateString('pt-BR')}</p>
                      )}
                      {coupon.UsoPorCliente && (
                        <p><strong>Uso por cliente:</strong> {coupon.UsoPorCliente} vez(es)</p>
                      )}
                    </div>

                    {/* Show which items this coupon applies to */}
                    {coupon.discountDetails?.eligibleItems && coupon.discountDetails.eligibleItems.length > 0 && (
                      <div className="text-xs text-slate-600 mb-2">
                        <p className="font-medium mb-1">✅ Aplica-se a:</p>
                        <ul className="space-y-1">
                          {coupon.discountDetails.eligibleItems.map((item, itemIndex) => {
                            const cartItem = items.find(cartItem => cartItem.id === item.ProdutoID || cartItem.id === item.produtoId || cartItem.id === item.id);
                            return (
                              <li key={itemIndex} className="flex justify-between">
                                <span>{cartItem?.name || `Produto ${item.ProdutoID || item.produtoId || item.id}`}</span>
                                <span className="text-green-600 font-medium">
                                  -{formatPrice(coupon.discountDetails.itemDiscounts?.[itemIndex]?.discountAmount || 0)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Show ineligible items if any */}
                    {coupon.discountDetails?.ineligibleItems && coupon.discountDetails.ineligibleItems.length > 0 && (
                      <div className="text-xs text-orange-600">
                        <p className="font-medium mb-1">❌ Não se aplica a:</p>
                        <ul className="space-y-1">
                          {coupon.discountDetails.ineligibleItems.map((item, itemIndex) => {
                            const cartItem = items.find(cartItem => cartItem.id === item.ProdutoID || cartItem.id === item.produtoId || cartItem.id === item.id);
                            return (
                              <li key={itemIndex}>
                                {cartItem?.name || `Produto ${item.ProdutoID || item.produtoId || item.id}`}
                                {item.ineligibilityReason && (
                                  <span className="text-slate-500 ml-1">({item.ineligibilityReason})</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 ml-4">
                    <div className="text-right">
                      <span className={`text-sm font-medium block ${
                        coupon.TipoDesconto === 'frete_gratis' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {coupon.TipoDesconto === 'frete_gratis' ? 'GRÁTIS' :
                         `-${formatPrice(coupon.discountDetails?.totalDiscount || coupon.descontoAplicado || 0)}`}
                      </span>
                      <button
                        onClick={() => removeCoupon(coupon.Codigo)}
                        className="mt-2 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors"
                        title="Remover cupom"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
      {selectedAddress && (appliedCoupons.some(coupon => coupon.TipoDesconto === 'frete_gratis') || freightOptions.length === 0) && (
        <p className="text-green-600 text-sm mt-2 flex items-center gap-2">
          <FaCheck className="text-xs" />
          <span>Frete não obrigatório para estes produtos</span>
        </p>
      )}
    </div>
  );
}

export default OrderSummary;
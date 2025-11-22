import { FaCreditCard, FaBarcode, FaMoneyBillWave, FaTrash, FaCheck } from 'react-icons/fa';
import { FiCreditCard } from 'react-icons/fi';

function PaymentMethodsSection({
  paymentMethods,
  showAllMethods,
  setShowAllMethods,
  allAvailableMethods,
  addPaymentMethod,
  removePaymentMethod,
  updatePaymentAmount,
  calculateInstallments,
  updateInstallments,
  installments,
  orderData,
  calcularTotalPagamentos,
  calcularValorRestante,
  distribuirValorAutomaticamente
}) {
  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Métodos de Pagamento</h2>
        <div className="flex items-center gap-2">
          {paymentMethods.length > 1 && (
            <button
              onClick={distribuirValorAutomaticamente}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Distribuir automaticamente
            </button>
          )}
          {!showAllMethods && (
            <button
              onClick={() => setShowAllMethods(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <FaCreditCard className="text-xs" />
              Adicionar método
            </button>
          )}
        </div>
      </div>

      {/* Modal/Seção para adicionar métodos */}
      {showAllMethods && (
        <div className="mb-4 p-4 bg-slate-50 rounded-lg">
          <h3 className="text-sm font-medium text-slate-900 mb-3">Escolha métodos adicionais:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {allAvailableMethods.map((method) => {
              const isSelected = paymentMethods.some(m => m.type === method.type);
              return (
                <button
                  key={method.type}
                  onClick={() => {
                    if (isSelected) {
                      removePaymentMethod(paymentMethods.find(m => m.type === method.type)?.id);
                    } else {
                      addPaymentMethod(method.type);
                    }
                  }}
                  disabled={isSelected && paymentMethods.length <= 1}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-2">
                    {method.type === 'cartao' && <FaCreditCard className="text-slate-400" />}
                    {method.type === 'debito' && <FaCreditCard className="text-slate-400" />}
                    {method.type === 'boleto' && <FaBarcode className="text-slate-400" />}
                    {method.type === 'pix' && <FaMoneyBillWave className="text-slate-400" />}
                    <div>
                      <div className="text-sm font-medium">{method.label}</div>
                      <div className="text-xs text-slate-500">
                        {method.type === 'cartao' && 'Cartão de crédito'}
                        {method.type === 'boleto' && 'Boleto bancário'}
                        {method.type === 'pix' && 'PIX instantâneo'}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => setShowAllMethods(false)}
              className="text-sm text-slate-600 hover:text-slate-700 font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <div key={method.id} className="p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {method.type === 'cartao' && <FaCreditCard className="text-slate-400" />}
                {method.type === 'boleto' && <FaBarcode className="text-slate-400" />}
                {method.type === 'pix' && <FaMoneyBillWave className="text-slate-400" />}
                <div>
                  <h3 className="font-medium text-slate-900">{method.label}</h3>
                  <p className="text-sm text-slate-600">
                    {method.type === 'cartao' && 'Visa, Mastercard, Elo'}
                    {method.type === 'debito' && 'Débito instantâneo'}
                    {method.type === 'boleto' && 'Pagamento à vista'}
                    {method.type === 'pix' && 'Pagamento instantâneo'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method.amount > 0 && (
                  <span className="text-sm font-medium text-green-600">
                    R$ {method.amount.toFixed(2)}
                  </span>
                )}
                {paymentMethods.length > 1 && (
                  <button
                    onClick={() => removePaymentMethod(method.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    title="Remover método"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={method.amount || ''}
                  onChange={(e) => updatePaymentAmount(method.id, e.target.value)}
                  placeholder="0,00"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                />
              </div>

              {/* Opções de parcelas */}
              {method.amount > 0 && method.type === 'cartao' && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                  {/* Parcelas para cartão de crédito */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 mb-2">Parcelas</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {calculateInstallments(method.amount).slice(0, 6).map((installment, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            updateInstallments(method.id, installment.installments);
                            // showInfo would be passed as prop
                          }}
                          className={`p-2 text-xs border rounded-lg transition-colors ${
                            installments[method.id] === installment.installments
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          {installment.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Resumo dos pagamentos */}
      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600">Total do pedido:</span>
          <span className="font-medium">{formatPrice(orderData?.total || 0)}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600">Total dos pagamentos:</span>
          <span className="font-medium">{formatPrice(calcularTotalPagamentos())}</span>
        </div>
        <div className="flex justify-between text-sm font-medium">
          <span className={calcularValorRestante() > 0 ? 'text-red-600' : 'text-green-600'}>
            {calcularValorRestante() > 0 ? 'Valor restante:' : 'Valor coberto:'}
          </span>
          <span className={calcularValorRestante() > 0 ? 'text-red-600' : 'text-green-600'}>
            {formatPrice(Math.abs(calcularValorRestante()))}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PaymentMethodsSection;
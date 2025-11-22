import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaTruck, FaCheck } from 'react-icons/fa';
import { FiTag } from 'react-icons/fi';

function AddressSelection({
  addresses,
  selectedAddress,
  handleAddressChange,
  freightLoading,
  appliedCoupons,
  freightOptions,
  selectedFreight,
  setSelectedFreight,
  availableCoupons,
  showCouponSection,
  setShowCouponSection,
  handleApplyCouponFromList,
  couponInput,
  setCouponInput,
  handleApplyManualCoupon,
  freightError
}) {
  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Endereço de Entrega</h2>
      {addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address.EnderecoID}
              onClick={() => handleAddressChange(address)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedAddress?.EnderecoID === address.EnderecoID
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-slate-400 mt-1" />
                  <div>
                    <h3 className="font-medium text-slate-900">{address.Nome}</h3>
                    <p className="text-sm text-slate-600">
                      {address.CEP}, {address.Cidade} - {address.UF}
                    </p>
                    <p className="text-sm text-slate-600">
                      {address.Bairro}, {address.Numero}
                    </p>
                  </div>
                </div>
                {selectedAddress?.EnderecoID === address.EnderecoID && (
                  <div className="flex items-center gap-2">
                    {freightLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                    <FaCheck className="text-blue-600" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Cupons e Opções de Frete */}
          {selectedAddress && (
            <div className="mt-4 space-y-4">
              {/* Cupons Aplicados */}
              {appliedCoupons.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FiTag className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Cupons Aplicados</span>
                  </div>
                  <div className="space-y-3">
                    {appliedCoupons.map((coupon, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg ${
                          coupon.TipoDesconto === 'frete_gratis'
                            ? 'border-green-500 bg-green-50 cursor-pointer'
                            : 'border-blue-500 bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {coupon.TipoDesconto === 'frete_gratis' ? (
                              <FaTruck className="text-green-600" />
                            ) : (
                              <FiTag className="text-blue-600" />
                            )}
                            <div>
                              <h4 className="font-medium text-slate-900">{coupon.Codigo}</h4>
                              <p className="text-sm text-slate-600">
                                {coupon.TipoDesconto === 'porcentagem' ? `${coupon.ValorDesconto}% de desconto` :
                                 coupon.TipoDesconto === 'valor_fixo' ? `R$ ${coupon.ValorDesconto} de desconto` :
                                 coupon.TipoDesconto === 'frete_gratis' ? 'Frete grátis' :
                                 'Desconto aplicado'}
                              </p>
                              {coupon.TipoDesconto === 'frete_gratis' && (
                                <p className="text-sm text-green-700 font-medium">Entrega gratuita</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {coupon.TipoDesconto === 'frete_gratis' ? (
                              <div>
                                <p className="font-medium text-green-600">GRÁTIS</p>
                                <p className="text-sm text-slate-600">Selecionado</p>
                              </div>
                            ) : (
                              <p className="font-medium text-blue-600">
                                -{coupon.TipoDesconto === 'porcentagem' ? `${coupon.ValorDesconto}%` : formatPrice(coupon.ValorDesconto)}
                              </p>
                            )}
                          </div>
                        </div>
                        {coupon.TipoDesconto === 'frete_gratis' && (
                          <div className="flex items-center gap-2 mt-2">
                            <FaCheck className="text-green-600" />
                            <span className="text-sm text-green-600">Cupom de frete aplicado</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Opções de Frete */}
              {(!appliedCoupons.some(coupon => coupon.TipoDesconto === 'frete_gratis')) && freightOptions.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <FaTruck className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Opções de Frete</span>
                  </div>

                  {/* Mostrar opções de frete */}
                  {freightOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => setSelectedFreight(option)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedFreight?.id === option.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FaTruck className="text-slate-400" />
                          <div>
                            <h4 className="font-medium text-slate-900">{option.nome}</h4>
                            <p className="text-sm text-slate-600">{option.transportadora}</p>
                            <p className="text-sm text-slate-600">{option.descricao}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-blue-600">{formatPrice(option.valor)}</p>
                          <p className="text-sm text-slate-600">{option.prazo}</p>
                        </div>
                      </div>
                      {selectedFreight?.id === option.id && (
                        <div className="flex items-center gap-2 mt-2">
                          <FaCheck className="text-blue-600" />
                          <span className="text-sm text-blue-600">Selecionado</span>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Seção de Cupons */}
              <div className="mt-6 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FiTag className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Cupons Disponíveis</span>
                  </div>
                  <button
                    onClick={() => setShowCouponSection(!showCouponSection)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showCouponSection ? 'Ocultar' : 'Ver cupons'}
                  </button>
                </div>

                {showCouponSection && (
                  <div className="space-y-4">
                    {/* Lista de cupons aplicáveis */}
                    {availableCoupons.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600">Cupons aplicáveis ao seu carrinho:</p>
                        {availableCoupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            className="p-4 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-sm font-bold px-2 py-1 rounded bg-blue-600 text-white">
                                    {coupon.code}
                                  </span>
                                  <span className="text-sm text-green-600 font-medium">
                                    {coupon.type === 'free_shipping' ? 'Frete Grátis' :
                                     coupon.type === 'percentage' ? `${coupon.discount}% OFF` :
                                     `R$ ${coupon.discount} OFF`}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-2">{coupon.description}</p>
                                {coupon.discountAmount > 0 && (
                                  <p className="text-sm text-green-600 font-medium">
                                    Desconto: R$ {coupon.discountAmount.toFixed(2)}
                                  </p>
                                )}
                                {coupon.minValue > 0 && (
                                  <p className="text-xs text-slate-500">
                                    Valor mínimo: R$ {coupon.minValue}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleApplyCouponFromList(coupon.code)}
                                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Aplicar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">Nenhum cupom aplicável encontrado para os itens do seu carrinho.</p>
                    )}

                    {/* Aplicar cupom manualmente */}
                    <div className="border-t border-slate-200 pt-4">
                      <p className="text-sm text-slate-600 mb-3">Ou digite o código de um cupom:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="CÓDIGO DO CUPOM"
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm uppercase"
                          onKeyPress={(e) => e.key === 'Enter' && handleApplyManualCoupon()}
                        />
                        <button
                          onClick={handleApplyManualCoupon}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Exibir erro de cálculo de frete */}
              {freightError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-red-900">Erro no cálculo do frete</span>
                  </div>
                  <p className="text-sm text-red-800">{freightError}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <FaMapMarkerAlt className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum endereço cadastrado</h3>
          <p className="text-slate-600 mb-4">Adicione um endereço para continuar com a compra</p>
          <Link
            to="/enderecos"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FaMapMarkerAlt />
            <span>Adicionar Endereço</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default AddressSelection;
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

          {/* Opções de Frete */}
          {selectedAddress && (
            <div className="mt-4 space-y-4">
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
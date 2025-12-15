import { Link } from 'react-router-dom';
import { useEffect } from 'react';
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

  // useEffect para monitorar mudanças de endereço selecionado
  useEffect(() => {
    if (selectedAddress) {
      console.log('[AddressSelection] Endereço selecionado mudou:', {
        enderecoId: selectedAddress.EnderecoID,
        nome: selectedAddress.Nome,
        cep: selectedAddress.CEP,
        cidade: selectedAddress.Cidade,
        uf: selectedAddress.UF,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('[AddressSelection] Nenhum endereço selecionado');
    }
  }, [selectedAddress]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Endereço de Entrega</h2>
      {addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address.EnderecoID}
              onClick={() => {
                console.log('[AddressSelection] Endereço clicado:', {
                  enderecoId: address.EnderecoID,
                  nome: address.Nome,
                  cep: address.CEP,
                  cidade: address.Cidade,
                  uf: address.UF,
                  timestamp: new Date().toISOString()
                });
                console.log('[AddressSelection] Chamando handleAddressChange - calculateFreight será chamado no CheckoutPage');
                handleAddressChange(address);
              }}
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
              <div className="flex items-center gap-2 mb-3">
                <FaTruck className="text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Opções de Frete</span>
              </div>

              {/* Verificar se há cupom de frete grátis */}
              {appliedCoupons.some(coupon => coupon.TipoDesconto === 'frete_gratis') ? (
                <div className="p-4 border rounded-lg bg-green-50 border-green-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaTruck className="text-green-600" />
                      <div>
                        <h4 className="font-medium text-green-900">Frete Grátis</h4>
                        <p className="text-sm text-green-700">Aplicado via cupom de desconto</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">GRÁTIS</p>
                      <p className="text-sm text-green-600">Cupom aplicado</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <FaCheck className="text-green-600" />
                    <span className="text-sm text-green-600">Selecionado automaticamente</span>
                  </div>
                </div>
              ) : freightOptions.length > 0 ? (
                /* Mostrar opções de frete normais */
                freightOptions.map((option) => {
                  console.log('[AddressSelection] Renderizando opções de frete:', freightOptions.length, freightOptions.map(o => ({ id: o.id, nome: o.nome, valor: o.valor })));
                  return (
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
                  );
                })
              ) : (
                <div className="text-center py-4 text-slate-500">
                  <FaTruck className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  <p>Nenhuma opção de frete disponível</p>
                  <p className="text-xs mt-1">Verifique se todos os produtos estão disponíveis para entrega neste endereço</p>
                </div>
              )}

              {/* Exibir erro de cálculo de frete */}
              {freightError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-red-900">Erro no cálculo do frete</span>
                  </div>
                  <p className="text-sm text-red-800">{freightError}</p>
                  <button
                    onClick={() => {
                      if (selectedAddress && window.location.reload) {
                        window.location.reload(); // Recarregar página como fallback
                      }
                    }}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* Debug info - mostrar apenas se não há opções e não há erro */}
              {freightOptions.length === 0 && !freightError && !freightLoading && selectedAddress && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-yellow-900">Debug: Frete não calculado</span>
                  </div>
                  <p className="text-sm text-yellow-800">
                    Verifique se há produtos no carrinho e se o endereço está selecionado corretamente.
                  </p>
                  <details className="mt-2">
                    <summary className="text-xs text-yellow-700 cursor-pointer">Detalhes técnicos</summary>
                    <div className="mt-1 text-xs text-yellow-600">
                      <p>Endereço selecionado: {selectedAddress.EnderecoID}</p>
                      <p>Produtos no carrinho: {JSON.stringify(appliedCoupons)}</p>
                      <p>Status do frete: {freightLoading ? 'Carregando' : 'Pronto'}</p>
                    </div>
                  </details>
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
import { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaSpinner, FaShoppingBag, FaReceipt, FaBox, FaTruck, FaCheck, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import clienteVendedorApi from '../services/clienteVendedorApi';

const ClientDetailsModal = ({ clienteId, isOpen, onClose }) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && clienteId) {
      fetchClientDetails();
    }
  }, [isOpen, clienteId]);

  const fetchClientDetails = async () => {
    if (!clienteId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await clienteVendedorApi.buscarCliente(clienteId);
      if (response.success) {
        setClient(response.cliente);
      } else {
        throw new Error(response.errors?.[0] || 'Erro ao carregar cliente');
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes do cliente:', err);
      setError('Erro ao carregar detalhes do cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setClient(null);
    setError(null);
    onClose();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Entregue':
        return <FaCheck className="text-green-600" />;
      case 'Em trânsito':
        return <FaTruck className="text-blue-600" />;
      case 'Processando':
        return <FaClock className="text-yellow-600" />;
      default:
        return <FaBox className="text-slate-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Entregue':
        return 'bg-green-100 text-green-800';
      case 'Em trânsito':
        return 'bg-blue-100 text-blue-800';
      case 'Processando':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaUser className="text-blue-600" />
              Detalhes do Cliente
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Fechar"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FaSpinner className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Carregando detalhes do cliente...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchClientDetails}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Client Details */}
          {client && !loading && !error && (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nome Completo</p>
                    <p className="font-medium text-gray-900">{client.cliente?.NomeCompleto || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">E-mail</p>
                    <p className="font-medium text-gray-900">{client.cliente?.Email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CPF/CNPJ</p>
                    <p className="font-medium text-gray-900">{client.cliente?.CPF_CNPJ || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefone Celular</p>
                    <p className="font-medium text-gray-900">{client.cliente?.TelefoneCelular || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefone Fixo</p>
                    <p className="font-medium text-gray-900">{client.cliente?.TelefoneFixo || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">WhatsApp</p>
                    <p className="font-medium text-gray-900">{client.cliente?.Whatsapp || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data de Cadastro</p>
                    <p className="font-medium text-gray-900">
                      {client.cliente?.DataCadastro ? formatDate(client.cliente.DataCadastro) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              {client.cliente?.enderecos && client.cliente.enderecos.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Endereços</h4>
                  <div className="space-y-3">
                    {client.cliente.enderecos.map((endereco, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <FaMapMarkerAlt className="text-gray-400 mt-1" />
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{endereco.Nome}</h5>
                            <p className="text-gray-700">
                              {endereco.Logradouro && endereco.Numero
                                ? `${endereco.Logradouro}, ${endereco.Numero}`
                                : 'Endereço não informado'}
                            </p>
                            <p className="text-gray-700">
                              {endereco.Cidade && endereco.UF
                                ? `${endereco.Cidade} - ${endereco.UF}`
                                : 'Cidade não informada'}
                            </p>
                            <p className="text-gray-700">CEP: {endereco.CEP || 'Não informado'}</p>
                            {endereco.Complemento && (
                              <p className="text-gray-700">Complemento: {endereco.Complemento}</p>
                            )}
                            {endereco.Bairro && (
                              <p className="text-gray-700">Bairro: {endereco.Bairro}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order History */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Pedidos</h4>
                {client.pedidos && client.pedidos.length > 0 ? (
                  <div className="space-y-4">
                    {client.pedidos.map((pedido, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(pedido.Status)}
                            <div>
                              <h5 className="font-semibold text-gray-900">Pedido #{pedido.PedidoID}</h5>
                              <p className="text-sm text-gray-600">{formatDate(pedido.DataPedido)}</p>
                            </div>
                          </div>
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(pedido.Status)}`}>
                            {pedido.Status}
                          </span>
                        </div>

                        {/* Order Items */}
                        <div className="mb-4">
                          <h6 className="font-medium text-gray-900 mb-2">Itens</h6>
                          <div className="space-y-2">
                            {pedido.itens.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex justify-between items-center text-sm">
                                <div className="flex-1">
                                  <span className="font-medium">{item.produto?.Nome}</span>
                                  <span className="text-gray-600 ml-2">SKU: {item.produto?.SKU}</span>
                                  <span className="text-gray-600 ml-2">Qtd: {item.quantidade}</span>
                                </div>
                                <span className="font-medium">{formatPrice(item.subtotal)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Total and Address */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <div>
                            <p className="text-sm text-gray-600">Endereço de entrega</p>
                            <p className="text-sm font-medium text-gray-900">
                              {pedido.endereco?.Nome}, {pedido.endereco?.Cidade} - {pedido.endereco?.UF}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="font-bold text-blue-600">{formatPrice(pedido.Total)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhum pedido encontrado</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsModal;
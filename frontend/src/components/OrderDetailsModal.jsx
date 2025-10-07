import { useState, useEffect } from 'react';
import { FaTimes, FaEye, FaSpinner, FaReceipt, FaBox, FaTruck, FaCheck, FaClock, FaMapMarkerAlt, FaShippingFast } from 'react-icons/fa';
import { clienteService } from '../services/api';
import api from '../services/api';
import entregaApi from '../services/entregaApi';

const OrderDetailsModal = ({ orderId, isOpen, onClose, isAdmin = false }) => {
   const [order, setOrder] = useState(null);
   const [delivery, setDelivery] = useState(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
     if (!orderId) return;

     setLoading(true);
     setError(null);

     try {
       let response;
       if (isAdmin) {
         response = await api.get(`/admin/pedidos/${orderId}`);
         if (response.success) {
           setOrder(response.pedido);
         } else {
           throw new Error(response.errors?.[0] || 'Erro ao carregar pedido');
         }
       } else {
         response = await clienteService.buscarPedido(orderId);
         setOrder(response);
       }

       // Fetch delivery tracking data for client orders
       // This provides tracking information including status updates and timeline
       if (!isAdmin) {
         try {
           const deliveryResponse = await entregaApi.buscarEntregaCliente(orderId);
           if (deliveryResponse.success) {
             setDelivery(deliveryResponse.entrega);
           }
         } catch (deliveryErr) {
           console.warn('Erro ao buscar dados de entrega:', deliveryErr);
           // Don't set error for delivery, just log - delivery is optional
         }
       }
     } catch (err) {
       console.error('Erro ao buscar detalhes do pedido:', err);
       setError('Erro ao carregar detalhes do pedido');
     } finally {
       setLoading(false);
     }
   };

  const handleClose = () => {
    setOrder(null);
    setDelivery(null);
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

  // Map status codes to friendly texts for delivery tracking
  // Example mapping: 0="Pendente", 1="Aguardando envio", 2="Em trânsito", 3="Entregue"
  const getDeliveryStatusText = (statusCode) => {
    const statusMap = {
      0: 'Pendente',
      1: 'Aguardando envio',
      2: 'Em trânsito',
      3: 'Entregue'
    };
    return statusMap[statusCode] || statusCode; // Fallback to original if not mapped
  };

  // Get appropriate icon for delivery status with color coding
  const getDeliveryStatusIcon = (statusText) => {
    switch (statusText) {
      case 'Pendente':
        return <FaClock className="text-yellow-600" />; // Yellow for pending
      case 'Aguardando envio':
        return <FaBox className="text-blue-600" />; // Blue for awaiting shipment
      case 'Em trânsito':
        return <FaTruck className="text-blue-600" />; // Blue for in transit
      case 'Entregue':
        return <FaCheck className="text-green-600" />; // Green for delivered
      default:
        return <FaShippingFast className="text-slate-600" />; // Default shipping icon
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaEye className="text-blue-600" />
              Detalhes do Pedido
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
                <p className="text-gray-600">Carregando detalhes do pedido...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchOrderDetails}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Order Details */}
          {order && !loading && !error && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(order.Status)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Pedido #{order.PedidoID}</h3>
                      <p className="text-sm text-gray-600">{formatDate(order.DataPedido)}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.Status)}`}>
                    {order.Status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{formatPrice(order.Total)}</p>
                  <p className="text-sm text-gray-600">{order.itensPedido?.length || 0} item(s)</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Itens do Pedido</h4>
                <div className="space-y-3">
                  {order.itensPedido?.map((item, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{item.produto?.Nome}</h5>
                          <p className="text-sm text-gray-600">SKU: {item.produto?.SKU}</p>
                          <p className="text-sm text-gray-600">Quantidade: {item.Quantidade}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatPrice(item.PrecoUnitario * item.Quantidade)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatPrice(item.PrecoUnitario)} cada
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment and Shipping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Details */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Pagamento</h4>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    {order.pagamentosPedido?.length > 0 ? (
                      <div className="space-y-2">
                        {order.pagamentosPedido.map((pagamento, index) => (
                          <div key={index}>
                            <p className="font-medium text-gray-900">
                              {pagamento.MetodoPagamento?.Nome || 'Método não informado'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Valor: {formatPrice(pagamento.ValorPago || 0)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Status: {pagamento.StatusPagamento || 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">Informações de pagamento não disponíveis</p>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Endereço de Entrega</h4>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    {order.Endereco ? (
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">{order.Endereco.Nome}</p>
                        <p className="text-gray-700">
                          {order.Endereco.Logradouro && order.Endereco.Numero
                            ? `${order.Endereco.Logradouro}, ${order.Endereco.Numero}`
                            : 'Endereço não informado'}
                        </p>
                        <p className="text-gray-700">
                          {order.Endereco.Cidade && order.Endereco.UF
                            ? `${order.Endereco.Cidade} - ${order.Endereco.UF}`
                            : 'Cidade não informada'}
                        </p>
                        <p className="text-gray-700">CEP: {order.Endereco.CEP || 'Não informado'}</p>
                        {order.Endereco.Complemento && (
                          <p className="text-gray-700">Complemento: {order.Endereco.Complemento}</p>
                        )}
                        {order.Endereco.Bairro && (
                          <p className="text-gray-700">Bairro: {order.Endereco.Bairro}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600">Endereço não disponível</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Tracking - Only show for client orders */}
              {!isAdmin && delivery && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Rastreamento de Entrega</h4>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    {delivery.rastreamentos && delivery.rastreamentos.length > 0 ? (
                      <div className="space-y-4">
                        {/* Responsive timeline showing delivery status updates with icons and dates */}
                        <div className="relative">
                          {delivery.rastreamentos.map((rastreamento, index) => {
                            // Map status codes to friendly texts if numeric, otherwise use string directly
                            const statusText = typeof rastreamento.status === 'number'
                              ? getDeliveryStatusText(rastreamento.status)
                              : rastreamento.status;
                            const isLast = index === delivery.rastreamentos.length - 1;

                            return (
                              <div key={index} className="flex items-start gap-4 pb-4">
                                {/* Timeline line */}
                                {!isLast && (
                                  <div className="absolute left-6 top-10 w-0.5 h-full bg-gray-200"></div>
                                )}

                                {/* Icon */}
                                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                  {getDeliveryStatusIcon(statusText)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-medium text-gray-900">{statusText}</h5>
                                    <span className="text-sm text-gray-500">
                                      {formatDate(rastreamento.dataHora)}
                                    </span>
                                  </div>
                                  {rastreamento.local && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      <FaMapMarkerAlt className="inline mr-1" />
                                      {rastreamento.local}
                                    </p>
                                  )}
                                  {rastreamento.observacoes && (
                                    <p className="text-sm text-gray-600 mt-1">{rastreamento.observacoes}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Additional delivery information section */}
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {delivery.Transportadora && (
                              <div>
                                <span className="font-medium text-gray-900">Transportadora:</span>
                                <p className="text-gray-600">{delivery.Transportadora}</p>
                              </div>
                            )}
                            {delivery.CodigoRastreio && (
                              <div>
                                <span className="font-medium text-gray-900">Código de Rastreio:</span>
                                <p className="text-gray-600 font-mono">{delivery.CodigoRastreio}</p>
                              </div>
                            )}
                            {delivery.PrevisaoEntrega && (
                              <div>
                                <span className="font-medium text-gray-900">Previsão de Entrega:</span>
                                <p className="text-gray-600">{formatDate(delivery.PrevisaoEntrega)}</p>
                              </div>
                            )}
                            {delivery.DataEntrega && (
                              <div>
                                <span className="font-medium text-gray-900">Data de Entrega:</span>
                                <p className="text-gray-600">{formatDate(delivery.DataEntrega)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FaShippingFast className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-600">Entrega ainda não foi iniciada</p>
                        <p className="text-sm text-gray-500 mt-1">O rastreamento aparecerá aqui quando o pedido for enviado</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Resumo do Pedido</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatPrice((order.Total || 0) - (order.Frete || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frete:</span>
                    <span className="font-medium">{formatPrice(order.Frete || 0)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-blue-600">{formatPrice(order.Total || 0)}</span>
                  </div>
                </div>
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

export default OrderDetailsModal;
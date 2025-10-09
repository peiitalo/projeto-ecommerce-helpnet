import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VendorLayout from '../../components/VendorLayout.jsx';
import { entregaApi } from '../../services/api.js';
import { useNotifications } from '../../hooks/useNotifications';
import {
  FaArrowLeft,
  FaTruck,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaShippingFast,
  FaBox,
  FaUser
} from 'react-icons/fa';

function VendorDeliveryDetailPage() {
  const { pedidoId } = useParams();
  const { showSuccess, showError } = useNotifications();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadDeliveryDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await entregaApi.buscarEntregaVendedor(pedidoId);
      if (response.entrega) {
        setDelivery(response.entrega);
        setTracking(response.entrega.rastreamentos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes da entrega:', error);
    } finally {
      setLoading(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    loadDeliveryDetails();
  }, [loadDeliveryDetails]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await entregaApi.atualizarStatusEntregaPorPedido(pedidoId, newStatus);
      // Reload delivery details
      loadDeliveryDetails();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      showError('Erro ao atualizar status da entrega');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AguardandoEnvio':
        return 'bg-yellow-100 text-yellow-800';
      case 'Enviado':
        return 'bg-blue-100 text-blue-800';
      case 'EmTransito':
        return 'bg-purple-100 text-purple-800';
      case 'Entregue':
        return 'bg-green-100 text-green-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDescription = (status) => {
    const descriptions = {
      'AguardandoEnvio': 'Aguardando Envio',
      'Enviado': 'Enviado',
      'EmTransito': 'Em Trânsito',
      'Entregue': 'Entregue',
      'Cancelado': 'Cancelado'
    };
    return descriptions[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';

      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', dateString, error);
      return 'Data inválida';
    }
  };

  const getNextStatusOptions = (currentStatus) => {
    const statusFlow = {
      'AguardandoEnvio': ['Enviado', 'Cancelado'],
      'Enviado': ['EmTransito', 'Cancelado'],
      'EmTransito': ['Entregue', 'Cancelado'],
      'Entregue': [],
      'Cancelado': []
    };
    return statusFlow[currentStatus] || [];
  };

  if (loading) {
    return (
      <VendorLayout>
        <div className="p-4 sm:p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando detalhes da entrega...</p>
        </div>
      </VendorLayout>
    );
  }

  if (!delivery) {
    return (
      <VendorLayout>
        <div className="p-4 sm:p-8 text-center">
          <FaTruck className="text-4xl sm:text-6xl text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Entrega não encontrada
          </h3>
          <p className="text-slate-600 mb-4">
            Não foi possível encontrar os detalhes desta entrega.
          </p>
          <button
            onClick={() => navigate('/vendedor/entregas')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaArrowLeft />
            Voltar para Entregas
          </button>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button
            onClick={() => navigate('/vendedor/entregas')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Entrega do Pedido #{delivery.PedidoID}
            </h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              Gerencie o status e acompanhe o rastreamento desta entrega
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
          {/* Delivery Info */}
          <div className="xl:col-span-2 space-y-4 lg:space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Status da Entrega</h2>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(delivery.StatusEntrega)}`}>
                  {getStatusDescription(delivery.StatusEntrega)}
                </span>
              </div>

              {delivery.CodigoRastreio && (
                <div className="mb-4">
                  <p className="text-sm text-slate-600">Código de Rastreio</p>
                  <p className="font-mono text-lg font-semibold text-slate-900">{delivery.CodigoRastreio}</p>
                </div>
              )}

              {delivery.Transportadora && (
                <div className="mb-4">
                  <p className="text-sm text-slate-600">Transportadora</p>
                  <p className="text-slate-900">{delivery.Transportadora}</p>
                </div>
              )}

              {/* Status Update Actions */}
              {getNextStatusOptions(delivery.StatusEntrega).length > 0 && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-medium text-slate-900 mb-3">Atualizar Status</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getNextStatusOptions(delivery.StatusEntrega).map(status => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(status)}
                        disabled={updating}
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-center"
                      >
                        {updating ? 'Atualizando...' : `Marcar como ${getStatusDescription(status)}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tracking History Timeline */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Histórico de Rastreamento</h2>

              {tracking.length === 0 ? (
                <p className="text-slate-600">Nenhum evento de rastreamento registrado ainda.</p>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>

                  <div className="space-y-4 sm:space-y-6">
                    {tracking
                      .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora)) // Most recent first
                      .map((event, index) => (
                        <div key={event.RastreamentoID || index} className="relative flex gap-3 sm:gap-4">
                          {/* Timeline dot */}
                          <div className="flex-shrink-0 relative">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-4 border-white shadow-md ${
                              (event.status || event.Status || '').includes('Entregue') ? 'bg-green-500' :
                              (event.status || event.Status || '').includes('trânsito') || (event.status || event.Status || '').includes('EmTransito') ? 'bg-blue-500' :
                              (event.status || event.Status || '').includes('Enviado') ? 'bg-purple-500' :
                              'bg-slate-400'
                            }`}>
                              {(event.status || event.Status || '').includes('Entregue') ? (
                                <FaCheckCircle className="text-white text-base sm:text-lg" />
                              ) : (event.status || event.Status || '').includes('trânsito') || (event.status || event.Status || '').includes('EmTransito') ? (
                                <FaShippingFast className="text-white text-base sm:text-lg" />
                              ) : (event.status || event.Status || '').includes('Enviado') ? (
                                <FaBox className="text-white text-base sm:text-lg" />
                              ) : (
                                <FaTruck className="text-white text-base sm:text-lg" />
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 pb-4 sm:pb-6">
                            <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{event.Status}</h3>
                                <span className="text-xs sm:text-sm text-slate-500">{formatDate(event.dataHora)}</span>
                              </div>

                              {event.Local && (
                                <div className="flex items-center gap-2 mb-2">
                                  <FaMapMarkerAlt className="text-slate-400 text-xs sm:text-sm flex-shrink-0" />
                                  <p className="text-xs sm:text-sm text-slate-700">{event.Local}</p>
                                </div>
                              )}

                              {event.Observacoes && (
                                <p className="text-xs sm:text-sm text-slate-600">{event.Observacoes}</p>
                              )}

                              {delivery.CodigoRastreio && index === 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                  <p className="text-xs text-slate-500 mb-1">Código de Rastreio</p>
                                  <p className="font-mono text-xs sm:text-sm font-semibold text-slate-900 break-all">{delivery.CodigoRastreio}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Products */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Produtos do Pedido</h2>
            <div className="space-y-4">
              {delivery.pedido?.itensPedido?.map((item) => (
                <div key={item.ItemID} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <img
                      src={item.produto?.Imagens?.[0] ? `http://localhost:3001${item.produto.Imagens[0]}` : '/placeholder-image.png'}
                      alt={item.produto?.Nome || 'Produto'}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{item.produto?.Nome || 'Produto não encontrado'}</h3>
                    <p className="text-sm text-slate-600">Quantidade: {item.Quantidade}</p>
                    <p className="text-sm font-medium text-slate-900">R$ {item.PrecoUnitario?.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">R$ {(item.PrecoUnitario * item.Quantidade)?.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-900">Total do Pedido:</span>
                <span className="text-xl font-bold text-slate-900">R$ {delivery.pedido?.Total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer & Order Info */}
          <div className="space-y-4 lg:space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Informações do Cliente</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FaUser className="text-slate-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{delivery.pedido?.cliente?.NomeCompleto}</p>
                    <p className="text-sm text-slate-600 truncate">{delivery.pedido?.cliente?.Email}</p>
                  </div>
                </div>
                {delivery.pedido?.cliente?.TelefoneCelular && (
                  <div className="flex items-center gap-3">
                    <FaPhone className="text-slate-400 flex-shrink-0" />
                    <p className="text-slate-900">{delivery.pedido.cliente.TelefoneCelular}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Endereço de Entrega</h2>
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-slate-400 mt-1 flex-shrink-0" />
                <div className="text-sm text-slate-900 flex-1">
                  {delivery.pedido?.Endereco && (
                    <div className="space-y-1">
                      <p className="font-medium">{delivery.pedido.Endereco.Cidade}, {delivery.pedido.Endereco.UF}</p>
                      {delivery.pedido.Endereco.Bairro && <p className="text-slate-600">Bairro: {delivery.pedido.Endereco.Bairro}</p>}
                      {delivery.pedido.Endereco.Numero && <p className="text-slate-600">Número: {delivery.pedido.Endereco.Numero}</p>}
                      {delivery.pedido.Endereco.Complemento && <p className="text-slate-600">Complemento: {delivery.pedido.Endereco.Complemento}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Dates */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Datas Importantes</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-slate-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-600">Criado em</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(delivery.CriadoEm)}</p>
                  </div>
                </div>
                {delivery.DataEnvio && (
                  <div className="flex items-center gap-3">
                    <FaShippingFast className="text-slate-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-600">Enviado em</p>
                      <p className="text-sm font-medium text-slate-900">{formatDate(delivery.DataEnvio)}</p>
                    </div>
                  </div>
                )}
                {delivery.PrevisaoEntrega && (
                  <div className="flex items-center gap-3">
                    <FaClock className="text-slate-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-600">Previsão de entrega</p>
                      <p className="text-sm font-medium text-slate-900">{formatDate(delivery.PrevisaoEntrega)}</p>
                    </div>
                  </div>
                )}
                {delivery.DataEntrega && (
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-600">Entregue em</p>
                      <p className="text-sm font-medium text-slate-900">{formatDate(delivery.DataEntrega)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}

export default VendorDeliveryDetailPage;
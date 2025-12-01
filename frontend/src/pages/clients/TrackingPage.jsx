import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaBox, FaTruck, FaCheck, FaClock, FaMapMarkerAlt, FaShippingFast, FaUser, FaPhone, FaEnvelope, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { clienteService } from '../../services/api';
import entregaApi from '../../services/entregaApi';

const TrackingPage = () => {
  const { pedidoId } = useParams();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar dados do pedido - formatar ID como "PED-XX"
      const formattedPedidoId = pedidoId.startsWith('PED-') ? pedidoId : `PED-${pedidoId}`;
      const orderResponse = await clienteService.buscarPedido(formattedPedidoId);
      setOrder(orderResponse.pedido);

      // Carregar dados de tracking/entrega (entregaApi aceita ambos os formatos)
      const trackingResponse = await entregaApi.buscarEntregaCliente(pedidoId);
      if (trackingResponse.success) {
        setTracking(trackingResponse.entrega);
      }

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados do pedido');
    } finally {
      setLoading(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    if (pedidoId) {
      carregarDados();
    }
  }, [pedidoId, carregarDados]);

  const getStatusDescription = (status) => {
    const descriptions = {
      'confirmado': 'Pedido Confirmado',
      'processando': 'Processando',
      'preparando': 'Preparando Envio',
      'enviado': 'Enviado',
      'em trânsito': 'Em Trânsito',
      'em_transito': 'Em Trânsito',
      'entregue': 'Entregue',
      'concluido': 'Concluído',
      'cancelado': 'Cancelado'
    };
    return descriptions[status?.toLowerCase()] || status;
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'entregue':
      case 'concluido':
        return <FaCheck className="text-green-600" />;
      case 'em trânsito':
      case 'em_transito':
      case 'enviado':
        return <FaTruck className="text-blue-600" />;
      case 'processando':
      case 'preparando':
      case 'confirmado':
        return <FaBox className="text-yellow-600" />;
      case 'cancelado':
        return <FaInfoCircle className="text-red-600" />;
      default:
        return <FaClock className="text-slate-600" />;
    }
  };

  const formatPrice = (price) => {
    return parseFloat(price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

  const getCurrentStepIndex = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmado':
      case 'processando':
        return 0;
      case 'preparando':
        return 1;
      case 'enviado':
      case 'em trânsito':
      case 'em_transito':
        return 2;
      case 'entregue':
      case 'concluido':
        return 3;
      default:
        return -1;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando tracking...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Pedido não encontrado'}</p>
          <Link
            to="/meus-pedidos"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FaArrowLeft />
            Voltar aos Pedidos
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex(order.Status);
  const formattedOrder = {
    id: `PED-${order.PedidoID}`,
    date: order.DataPedido,
    status: order.Status,
    total: parseFloat(order.Total || 0),
    items: order.itensPedido?.map(item => ({
      name: item.produto?.Nome || 'Produto',
      quantity: item.Quantidade || 0,
      price: parseFloat(item.PrecoUnitario || 0),
      image: item.produto?.Imagens?.[0] || '/placeholder-image.png'
    })) || [],
    address: order.Endereco ? {
      name: order.Endereco.Nome || 'Endereço de entrega',
      street: order.Endereco.Logradouro || '',
      city: order.Endereco.Cidade || '',
      state: order.Endereco.UF || '',
      cep: order.Endereco.CEP || ''
    } : null,
    estimatedDelivery: tracking?.dataPrevistaEntrega || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link
              to="/meus-pedidos"
              className="p-2 text-slate-600 hover:text-blue-700 transition-colors"
            >
              <FaArrowLeft className="text-lg" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Rastreamento do Pedido</h1>
              <p className="text-sm text-slate-600">{formattedOrder.id}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
          {/* Delivery Info - Left Column */}
          <div className="xl:col-span-2 space-y-4 lg:space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(formattedOrder.status)}
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{getStatusDescription(formattedOrder.status)}</h2>
                    <p className="text-sm text-slate-600">Status atual do seu pedido</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{formatPrice(formattedOrder.total)}</p>
                  <p className="text-sm text-slate-600">{formattedOrder.items.length} item(s)</p>
                </div>
              </div>

              {/* Timeline de Progresso */}
              <div className="mt-6">
                <h3 className="font-medium text-slate-900 mb-4">Progresso da Entrega</h3>
                <div className="relative">
                  <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                  <div className="space-y-4 sm:space-y-6">
                    {[
                      { 
                        key: 'confirmado', 
                        label: 'Pedido Confirmado', 
                        icon: FaCheck,
                        description: 'Seu pedido foi confirmado e está sendo processado'
                      },
                      { 
                        key: 'preparando', 
                        label: 'Preparando Envio', 
                        icon: FaBox,
                        description: 'O pedido está sendo preparado para envio'
                      },
                      { 
                        key: 'enviado', 
                        label: 'Enviado', 
                        icon: FaShippingFast,
                        description: 'O pedido foi enviado e está a caminho'
                      },
                      { 
                        key: 'entregue', 
                        label: 'Entregue', 
                        icon: FaCheck,
                        description: 'Pedido entregue com sucesso'
                      }
                    ].map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      const IconComponent = step.icon;

                      return (
                        <div key={step.key} className="relative flex items-start gap-3 sm:gap-4">
                          <div className={`relative z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 ${
                            isCompleted 
                              ? 'bg-blue-100 border-blue-500 text-blue-600' 
                              : isCurrent 
                              ? 'bg-blue-100 border-blue-500 text-blue-600'
                              : 'bg-slate-100 border-slate-300 text-slate-400'
                          }`}>
                            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="flex-1 min-w-0 pb-4 sm:pb-6">
                            <div className={`font-medium ${
                              isCompleted ? 'text-blue-900' : isCurrent ? 'text-blue-900' : 'text-slate-500'
                            }`}>
                              {step.label}
                            </div>
                            <div className={`text-sm ${
                              isCompleted ? 'text-blue-700' : isCurrent ? 'text-blue-700' : 'text-slate-500'
                            }`}>
                              {step.description}
                            </div>
                            {isCurrent && tracking?.dataAtualizacao && (
                              <div className="text-xs text-slate-500 mt-1">
                                Última atualização: {formatDate(tracking.dataAtualizacao)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Details */}
            {tracking && (
              <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Informações de Rastreamento</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tracking.codigoRastreamento && (
                    <div>
                      <p className="text-sm font-medium text-slate-600">Código de Rastreamento</p>
                      <p className="font-mono text-lg font-semibold text-slate-900">{tracking.codigoRastreamento}</p>
                    </div>
                  )}
                  {tracking.transportadora && (
                    <div>
                      <p className="text-sm font-medium text-slate-600">Transportadora</p>
                      <p className="text-slate-900">{tracking.transportadora}</p>
                    </div>
                  )}
                  {tracking.linkRastreamento && (
                    <div className="md:col-span-2">
                      <a
                        href={tracking.linkRastreamento}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FaTruck />
                        Acompanhar no Site da Transportadora
                      </a>
                    </div>
                  )}
                </div>

                {/* Histórico de Eventos */}
                {tracking.historico && tracking.historico.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-slate-900 mb-3">Histórico de Eventos</h4>
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>

                      <div className="space-y-4 sm:space-y-6">
                        {tracking.historico
                          .sort((a, b) => new Date(b.data) - new Date(a.data)) // Most recent first
                          .map((evento, index) => (
                          <div key={index} className="relative flex gap-3 sm:gap-4">
                            {/* Timeline dot */}
                            <div className="flex-shrink-0 relative">
                              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-4 border-white shadow-md ${
                                (evento.status || '').includes('Entregue') ? 'bg-green-500' :
                                (evento.status || '').includes('trânsito') || (evento.status || '').includes('EmTransito') ? 'bg-blue-500' :
                                (evento.status || '').includes('Enviado') ? 'bg-purple-500' :
                                'bg-slate-400'
                              }`}>
                                {(evento.status || '').includes('Entregue') ? (
                                  <FaCheck className="text-white text-base sm:text-lg" />
                                ) : (evento.status || '').includes('trânsito') || (evento.status || '').includes('EmTransito') ? (
                                  <FaTruck className="text-white text-base sm:text-lg" />
                                ) : (evento.status || '').includes('Enviado') ? (
                                  <FaShippingFast className="text-white text-base sm:text-lg" />
                                ) : (
                                  <FaBox className="text-white text-base sm:text-lg" />
                                )}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-4 sm:pb-6">
                              <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{evento.status}</h3>
                                  <span className="text-xs sm:text-sm text-slate-500">{formatDate(evento.data)}</span>
                                </div>

                                {evento.local && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <FaMapMarkerAlt className="text-slate-400 text-xs sm:text-sm flex-shrink-0" />
                                    <p className="text-xs sm:text-sm text-slate-700">{evento.local}</p>
                                  </div>
                                )}

                                {evento.descricao && (
                                  <p className="text-xs sm:text-sm text-slate-600">{evento.descricao}</p>
                                )}

                                {evento.observacoes && (
                                  <p className="text-xs text-slate-500 mt-2 italic">{evento.observacoes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-4 lg:space-y-6">
            {/* Order Products */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Produtos do Pedido</h2>
              <div className="space-y-4">
                {formattedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 truncate">{item.name}</h3>
                      <p className="text-sm text-slate-600">Quantidade: {item.quantity}</p>
                      <p className="text-sm font-medium text-slate-900">R$ {item.price.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">R$ {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-900">Total do Pedido:</span>
                  <span className="text-xl font-bold text-slate-900">{formatPrice(formattedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Endereço de Entrega</h2>
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-slate-400 mt-1 flex-shrink-0" />
                <div className="text-sm text-slate-900 flex-1">
                  {formattedOrder.address && (
                    <div className="space-y-1">
                      <p className="font-medium">{formattedOrder.address.name}</p>
                      <p className="text-slate-600">
                        {formattedOrder.address.street}, {formattedOrder.address.city} - {formattedOrder.address.state}
                      </p>
                      <p className="text-slate-600">CEP: {formattedOrder.address.cep}</p>
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
                    <p className="text-xs text-slate-600">Data do Pedido</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(formattedOrder.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaClock className="text-slate-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-600">Previsão de entrega</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(formattedOrder.estimatedDelivery).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Precisa de Ajuda?</h3>
              <p className="text-blue-800 text-sm mb-4">
                Se você tiver alguma dúvida sobre seu pedido ou não receber a entrega na data prevista, 
                entre em contato conosco.
              </p>
              <Link
                to="/suporte"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full justify-center"
              >
                <FaUser />
                Entrar em Contato
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
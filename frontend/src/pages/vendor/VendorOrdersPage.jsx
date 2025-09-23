import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import VendorLayout from '../../components/VendorLayout.jsx';
import { clienteService, entregaApi } from '../../services/api';
import {
  FaBox,
  FaTruck,
  FaCheck,
  FaClock,
  FaArrowLeft,
  FaMapMarkerAlt
} from 'react-icons/fa';
import {
  FiPackage
} from 'react-icons/fi';

function VendorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryTracking, setDeliveryTracking] = useState({});
  const { logout } = useAuth();

  // Carregar pedidos do vendedor
  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      // API call for vendor orders - adjust based on backend
      const response = await clienteService.listarPedidosVendedor();
      const pedidos = response.pedidos || [];

      // Transformar dados da API para o formato esperado pelo componente
      const pedidosFormatados = pedidos.map(pedido => ({
        id: `PED-${pedido.PedidoID}`,
        pedidoId: pedido.PedidoID,
        date: pedido.DataPedido,
        status: pedido.Status,
        total: parseFloat(pedido.Total),
        items: pedido.itensPedido.map(item => ({
          name: item.produto.Nome,
          quantity: item.Quantidade,
          price: parseFloat(item.PrecoUnitario),
          seller: item.produto.vendedor ? item.produto.vendedor.Nome : 'N/A'
        })),
        address: {
          name: pedido.Endereco.Nome,
          street: `${pedido.Endereco.Logradouro}, ${pedido.Endereco.Numero}`,
          city: `${pedido.Endereco.Cidade} - ${pedido.Endereco.UF}`,
          cep: pedido.Endereco.CEP
        },
        paymentMethod: pedido.pagamentosPedido[0]?.MetodoPagamento?.Nome || 'N/A',
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Simular 5 dias
      }));

      setOrders(pedidosFormatados);

      // Carregar informações de entrega para cada pedido
      await carregarInformacoesEntrega(pedidosFormatados);

    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarInformacoesEntrega = async (pedidos) => {
    const trackingInfo = {};

    for (const pedido of pedidos) {
      try {
        const entregaResponse = await entregaApi.buscarEntregaVendedor(pedido.pedidoId);
        if (entregaResponse.success && entregaResponse.entrega) {
          trackingInfo[pedido.id] = entregaResponse.entrega;
        }
      } catch (error) {
        console.error(`Erro ao carregar entrega para pedido ${pedido.id}:`, error);
      }
    }

    setDeliveryTracking(trackingInfo);
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

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <VendorLayout>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Cabeçalho */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Pedidos dos Meus Produtos</h1>
              <p className="text-slate-600">Acompanhe os pedidos dos produtos que você vende</p>
            </div>

            {/* Lista de pedidos */}
            {orders.length > 0 ? (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">Pedido {order.id}</h3>
                          <p className="text-sm text-slate-600">{formatDate(order.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatPrice(order.total)}</p>
                        <p className="text-sm text-slate-600">{order.items.length} item(s)</p>
                      </div>
                    </div>

                    {/* Status e entrega */}
                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      {deliveryTracking[order.id] ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FaTruck className="text-blue-600" />
                              <span className="text-sm font-medium text-slate-900">Rastreamento</span>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              deliveryTracking[order.id].StatusEntrega === 'Entregue' ? 'bg-green-100 text-green-800' :
                              deliveryTracking[order.id].StatusEntrega === 'EmTransito' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {deliveryTracking[order.id].StatusEntrega}
                            </span>
                          </div>

                          {/* Última atualização */}
                          {deliveryTracking[order.id].rastreamentos && deliveryTracking[order.id].rastreamentos.length > 0 && (
                            <div className="text-sm text-slate-600">
                              <p><strong>Última atualização:</strong> {deliveryTracking[order.id].rastreamentos[0].status}</p>
                              <p className="text-xs">
                                {new Date(deliveryTracking[order.id].rastreamentos[0].dataHora).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          )}

                          {/* Código de rastreio */}
                          {deliveryTracking[order.id].CodigoRastreio && (
                            <div className="text-sm">
                              <p><strong>Código de rastreio:</strong> {deliveryTracking[order.id].CodigoRastreio}</p>
                              {deliveryTracking[order.id].Transportadora && (
                                <p><strong>Transportadora:</strong> {deliveryTracking[order.id].Transportadora}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FaTruck className="text-blue-600" />
                            <span className="text-sm font-medium text-slate-900">Entrega estimada</span>
                          </div>
                          <span className="text-sm text-slate-600">
                            {new Date(order.estimatedDelivery).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Itens do pedido */}
                    <div className="border-t border-slate-200 pt-4">
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-slate-600">{item.name} (x{item.quantity})</span>
                            <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Endereço e método de pagamento */}
                    <div className="border-t border-slate-200 pt-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-slate-900 mb-1">Endereço de entrega</p>
                          <p className="text-slate-600">{order.address.name}</p>
                          <p className="text-slate-600">{order.address.street}</p>
                          <p className="text-slate-600">{order.address.city}</p>
                          <p className="text-slate-600">CEP: {order.address.cep}</p>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 mb-1">Método de pagamento</p>
                          <p className="text-slate-600">
                            {order.paymentMethod === 'cartao' ? 'Cartão de Crédito' :
                             order.paymentMethod === 'boleto' ? 'Boleto Bancário' : 'PIX'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="border-t border-slate-200 pt-4 mt-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <FaBox />
                          <span>Ver Detalhes</span>
                        </button>
                        {order.status === 'Em trânsito' && (
                          <button className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-200">
                            <FaMapMarkerAlt />
                            <span>Rastrear Pedido</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FaBox className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                <h3 className="text-xl font-medium text-slate-900 mb-2">Nenhum pedido encontrado</h3>
                <p className="text-slate-600 mb-6">Você não possui pedidos para seus produtos no momento</p>
                <Link
                  to="/vendedor/produtos"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiPackage />
                  <span>Gerenciar Produtos</span>
                </Link>
              </div>
            )}
         </div>

         {/* Modal de Detalhes do Pedido */}
         {selectedOrder && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
             <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
               <div className="p-6 border-b border-slate-200">
                 <div className="flex items-center justify-between">
                   <h2 className="text-xl font-semibold text-slate-900">Detalhes - Pedido {selectedOrder.id}</h2>
                   <button
                     onClick={() => setSelectedOrder(null)}
                     className="p-2 rounded-lg text-slate-600 hover:bg-slate-50"
                   >
                     <FiX />
                   </button>
                 </div>
               </div>
               <div className="p-6 space-y-6">
                 {/* Status e informações */}
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     {getStatusIcon(selectedOrder.status)}
                     <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedOrder.status)}`}>
                       {selectedOrder.status}
                     </span>
                   </div>
                   <div className="text-right text-sm">
                     <p className="text-slate-600">Pedido em {formatDate(selectedOrder.date)}</p>
                     {deliveryTracking[selectedOrder.id] ? (
                       <div>
                         <p className="font-medium">
                           Status da entrega: {deliveryTracking[selectedOrder.id].StatusEntrega}
                         </p>
                         {deliveryTracking[selectedOrder.id].PrevisaoEntrega && (
                           <p>Previsão: {new Date(deliveryTracking[selectedOrder.id].PrevisaoEntrega).toLocaleDateString('pt-BR')}</p>
                         )}
                       </div>
                     ) : (
                       <p className="font-medium">Entrega estimada: {new Date(selectedOrder.estimatedDelivery).toLocaleDateString('pt-BR')}</p>
                     )}
                   </div>
                 </div>

                 {/* Rastreamento detalhado */}
                 {deliveryTracking[selectedOrder.id] && (
                   <div className="bg-slate-50 rounded-lg p-4">
                     <h3 className="font-medium text-slate-900 mb-3">Rastreamento da Entrega</h3>

                     {deliveryTracking[selectedOrder.id].CodigoRastreio && (
                       <div className="mb-3">
                         <p className="text-sm"><strong>Código de rastreio:</strong> {deliveryTracking[selectedOrder.id].CodigoRastreio}</p>
                         {deliveryTracking[selectedOrder.id].Transportadora && (
                           <p className="text-sm"><strong>Transportadora:</strong> {deliveryTracking[selectedOrder.id].Transportadora}</p>
                         )}
                       </div>
                     )}

                     {deliveryTracking[selectedOrder.id].rastreamentos && deliveryTracking[selectedOrder.id].rastreamentos.length > 0 && (
                       <div>
                         <h4 className="font-medium text-slate-900 mb-2">Histórico de Rastreamento</h4>
                         <div className="space-y-2">
                           {deliveryTracking[selectedOrder.id].rastreamentos.map((rastreamento, index) => (
                             <div key={index} className="flex items-start gap-3 p-2 bg-white rounded border">
                               <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                               <div className="flex-1">
                                 <p className="text-sm font-medium text-slate-900">{rastreamento.status}</p>
                                 {rastreamento.local && (
                                   <p className="text-xs text-slate-600">Local: {rastreamento.local}</p>
                                 )}
                                 <p className="text-xs text-slate-500">
                                   {new Date(rastreamento.dataHora).toLocaleString('pt-BR')}
                                 </p>
                                 {rastreamento.observacoes && (
                                   <p className="text-xs text-slate-600 mt-1">{rastreamento.observacoes}</p>
                                 )}
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 )}

                 {/* Itens */}
                 <div>
                   <h3 className="font-medium text-slate-900 mb-3">Itens do pedido</h3>
                   <div className="space-y-2">
                     {selectedOrder.items.map((item, index) => (
                       <div key={index} className="flex justify-between text-sm">
                         <span className="text-slate-600">{item.name} (x{item.quantity})</span>
                         <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                       </div>
                     ))}
                   </div>
                   <div className="border-t border-slate-200 pt-2 mt-3">
                     <div className="flex justify-between font-semibold">
                       <span>Total</span>
                       <span>{formatPrice(selectedOrder.total)}</span>
                     </div>
                   </div>
                 </div>

                 {/* Endereço e pagamento */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                   <div>
                     <h3 className="font-medium text-slate-900 mb-2">Endereço de entrega</h3>
                     <p className="text-slate-600">{selectedOrder.address.name}</p>
                     <p className="text-slate-600">{selectedOrder.address.street}</p>
                     <p className="text-slate-600">{selectedOrder.address.city}</p>
                     <p className="text-slate-600">CEP: {selectedOrder.address.cep}</p>
                   </div>
                   <div>
                     <h3 className="font-medium text-slate-900 mb-2">Método de pagamento</h3>
                     <p className="text-slate-600">
                       {selectedOrder.paymentMethod === 'cartao' ? 'Cartão de Crédito' :
                        selectedOrder.paymentMethod === 'boleto' ? 'Boleto Bancário' : 'PIX'}
                     </p>
                   </div>
                 </div>
               </div>
               <div className="p-6 border-t border-slate-200">
                 <button
                   onClick={() => setSelectedOrder(null)}
                   className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                 >
                   Fechar
                 </button>
               </div>
             </div>
           </div>
         )}
       </VendorLayout>
  );
}

export default VendorOrdersPage;
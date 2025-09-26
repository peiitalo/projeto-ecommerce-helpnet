import { useState, useEffect } from 'react';
import VendorLayout from '../../layouts/VendorLayout';
import { useAuth } from '../../context/AuthContext';
import vendedorApi from '../../services/vendedorApi';
import { FiEye, FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiClock, FiSearch, FiX, FiMapPin, FiUser, FiCalendar } from 'react-icons/fi';

function VendorOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await vendedorApi.listarPedidos({
        pagina: 1,
        limit: 50
      });

      if (response.pedidos) {
        setOrders(response.pedidos);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (order) => {
    // Priorizar status de entrega sobre status de pagamento
    const status = order.Status?.toLowerCase();
    const paymentStatus = order.StatusPagamento?.toLowerCase();

    if (status === 'entregue' || status === 'concluido') {
      return <FiCheckCircle className="text-green-600" />;
    }
    if (status === 'em trânsito' || status === 'enviado') {
      return <FiTruck className="text-blue-600" />;
    }
    if (status === 'cancelado') {
      return <FiXCircle className="text-red-600" />;
    }
    if (paymentStatus === 'pago' && (status === 'processando' || !status)) {
      return <FiCheckCircle className="text-green-600" />;
    }
    if (paymentStatus === 'pendente' || status === 'pagamento pendente') {
      return <FiClock className="text-yellow-600" />;
    }
    return <FiPackage className="text-gray-600" />;
  };

  const getStatusColor = (order) => {
    // Lógica melhorada para determinar status único
    const status = order.Status?.toLowerCase();
    const paymentStatus = order.StatusPagamento?.toLowerCase();

    if (status === 'entregue' || status === 'concluido') {
      return 'bg-green-100 text-green-800';
    }
    if (status === 'em trânsito' || status === 'enviado') {
      return 'bg-blue-100 text-blue-800';
    }
    if (status === 'cancelado') {
      return 'bg-red-100 text-red-800';
    }
    if (paymentStatus === 'pago') {
      return 'bg-green-100 text-green-800';
    }
    if (paymentStatus === 'pendente' || status === 'pagamento pendente') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (order) => {
    // Retornar texto único baseado na prioridade
    const status = order.Status?.toLowerCase();
    const paymentStatus = order.StatusPagamento?.toLowerCase();

    if (status === 'entregue' || status === 'concluido') return 'Entregue';
    if (status === 'em trânsito' || status === 'enviado') return 'Em Trânsito';
    if (status === 'cancelado') return 'Cancelado';
    if (paymentStatus === 'pago') return 'Pago';
    if (paymentStatus === 'pendente' || status === 'pagamento pendente') return 'Pagamento Pendente';
    return order.Status || 'Processando';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm ||
      order.PedidoID.toString().includes(searchTerm) ||
      order.cliente?.NomeCompleto?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' ||
      order.Status?.toLowerCase() === statusFilter.toLowerCase() ||
      (statusFilter === 'pagamento_pendente' && order.StatusPagamento === 'PENDENTE');

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  return (
    <VendorLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
          <p className="mt-2 text-gray-600">Gerencie os pedidos dos seus produtos</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por ID do pedido ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos</option>
                <option value="processando">Processando</option>
                <option value="pagamento_pendente">Pagamento Pendente</option>
                <option value="pago">Pago</option>
                <option value="enviado">Enviado</option>
                <option value="entregue">Entregue</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''} encontrado{filteredOrders.length !== 1 ? 's' : ''}
            </div>

            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.PedidoID} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(order.Status)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Pedido #{order.PedidoID}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Cliente: {order.cliente?.NomeCompleto || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Data: {formatDate(order.DataPedido)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(order.Total)}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order)}`}>
                          {getStatusText(order)}
                        </span>
                        {/* Mostrar valor pago se parcialmente pago */}
                        {order.TotalPago > 0 && order.TotalPago < order.Total && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Parcial: {formatCurrency(order.TotalPago)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Itens do Pedido:</h4>
                    <div className="space-y-2">
                      {order.itensPedido?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.produto?.Imagens?.[0] || '/placeholder-image.png'}
                              alt={item.produto?.Nome || 'Produto'}
                              className="w-8 h-8 object-cover rounded"
                              onError={(e) => {
                                e.target.src = '/placeholder-image.png';
                              }}
                            />
                            <span className="text-gray-900">{item.produto?.Nome || 'Produto'}</span>
                            <span className="text-gray-600">SKU: {item.produto?.SKU || 'N/A'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-600">{item.Quantidade}x</span>
                            <span className="ml-4 font-medium text-gray-900">
                              {formatCurrency(item.PrecoUnitario * item.Quantidade)}
                            </span>
                          </div>
                        </div>
                      )) || (
                        <p className="text-sm text-gray-600">Nenhum item encontrado</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => openOrderDetails(order)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiEye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum pedido encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'todos'
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Você ainda não recebeu nenhum pedido.'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalhes do Pedido #{selectedOrder.PedidoID}
                </h3>
                <button
                  onClick={closeOrderModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Informações do Pedido</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <FiCalendar className="text-gray-400 w-4 h-4" />
                        <span className="text-sm text-gray-900">
                          Data: {formatDate(selectedOrder.DataPedido)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiPackage className="text-gray-400 w-4 h-4" />
                        <span className="text-sm text-gray-900">
                          Status: <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder)}`}>
                            {getStatusText(selectedOrder)}
                          </span>
                        </span>
                      </div>
                      <div className="text-sm text-gray-900">
                        Total: <span className="font-semibold">{formatCurrency(selectedOrder.Total)}</span>
                      </div>
                      {selectedOrder.TotalPago > 0 && (
                        <div className="text-sm text-gray-900">
                          Valor Pago: <span className="font-semibold text-green-600">{formatCurrency(selectedOrder.TotalPago)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Cliente</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <FiUser className="text-gray-400 w-4 h-4" />
                        <span className="text-sm text-gray-900">{selectedOrder.cliente?.NomeCompleto || 'N/A'}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Email: {selectedOrder.cliente?.Email || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                {selectedOrder.Endereco && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Endereço de Entrega</h4>
                    <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
                      <FiMapPin className="text-gray-400 w-4 h-4 mt-0.5" />
                      <div className="text-sm text-gray-900">
                        <p>{selectedOrder.Endereco.Nome}</p>
                        <p>{selectedOrder.Endereco.Bairro}, {selectedOrder.Endereco.Cidade} - {selectedOrder.Endereco.UF}</p>
                        <p>CEP: {selectedOrder.Endereco.CEP}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Itens do Pedido</h4>
                  <div className="space-y-3">
                    {selectedOrder.itensPedido?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.produto?.Imagens?.[0] || '/placeholder-image.png'}
                            alt={item.produto?.Nome || 'Produto'}
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => {
                              e.target.src = '/placeholder-image.png';
                            }}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.produto?.Nome || 'Produto'}</p>
                            <p className="text-xs text-gray-600">SKU: {item.produto?.SKU || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{item.Quantidade}x</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.PrecoUnitario)} cada
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            Total: {formatCurrency(item.PrecoUnitario * item.Quantidade)}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-600">Nenhum item encontrado</p>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                {selectedOrder.pagamentosPedido && selectedOrder.pagamentosPedido.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Pagamentos</h4>
                    <div className="space-y-2">
                      {selectedOrder.pagamentosPedido.map((pagamento, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {pagamento.MetodoPagamento?.Nome || 'Método não informado'}
                            </p>
                            <p className="text-xs text-gray-600">
                              Data: {pagamento.DataPagamento ? formatDate(pagamento.DataPagamento) : 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(pagamento.ValorPago)}
                            </p>
                            <p className={`text-xs ${
                              pagamento.StatusPagamento === 'Pago' ? 'text-green-600' :
                              pagamento.StatusPagamento === 'Pendente' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {pagamento.StatusPagamento || 'Status não informado'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={closeOrderModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}

export default VendorOrdersPage;
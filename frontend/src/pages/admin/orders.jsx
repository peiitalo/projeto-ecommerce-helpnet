import { useState, useEffect } from 'react';
import { FiPackage, FiSearch, FiFilter, FiEdit, FiEye, FiCheck, FiX } from 'react-icons/fi';
import { FaEye } from 'react-icons/fa';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import OrderDetailsModal from '../../components/OrderDetailsModal';

function AdminOrdersPage() {
  const { showSuccess, showError } = useNotifications();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [orderModalId, setOrderModalId] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const ordersPerPage = 10;

  const statusOptions = [
    { value: 'AguardandoPagamento', label: 'Aguardando Pagamento' },
    { value: 'PagamentoIniciado', label: 'Pagamento Iniciado' },
    { value: 'Pago', label: 'Pago' },
    { value: 'EmProcessamento', label: 'Em Processamento' },
    { value: 'Enviado', label: 'Enviado' },
    { value: 'Entregue', label: 'Entregue' },
    { value: 'Cancelado', label: 'Cancelado' },
    { value: 'Reembolsado', label: 'Reembolsado' }
  ];

  const getStatusColor = (status) => {
    const colors = {
      'AguardandoPagamento': 'bg-yellow-100 text-yellow-800',
      'PagamentoIniciado': 'bg-blue-100 text-blue-800',
      'Pago': 'bg-green-100 text-green-800',
      'EmProcessamento': 'bg-purple-100 text-purple-800',
      'Enviado': 'bg-indigo-100 text-indigo-800',
      'Entregue': 'bg-emerald-100 text-emerald-800',
      'Cancelado': 'bg-red-100 text-red-800',
      'Reembolsado': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status) => {
    const labels = {
      'AguardandoPagamento': 'Aguardando Pagamento',
      'PagamentoIniciado': 'Pagamento Iniciado',
      'Pago': 'Pago',
      'EmProcessamento': 'Em Processamento',
      'Enviado': 'Enviado',
      'Entregue': 'Entregue',
      'Cancelado': 'Cancelado',
      'Reembolsado': 'Reembolsado'
    };
    return labels[status] || status;
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        pagina: currentPage,
        limit: ordersPerPage
      });

      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/admin/pedidos?${params}`);

      if (response.success) {
        setOrders(response.pedidos || []);
        setTotalOrders(response.total || 0);
      } else {
        setError(response.errors?.[0] || 'Erro ao carregar pedidos');
      }
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setError('Erro ao carregar pedidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      setUpdatingStatus(true);

      const response = await api.put(`/admin/pedidos/${selectedOrder.PedidoID}/status`, {
        status: newStatus,
        observacoes: statusNotes
      });

      if (response.success) {
        // Recarregar pedidos
        await loadOrders();
        setShowStatusModal(false);
        setSelectedOrder(null);
        setNewStatus('');
        setStatusNotes('');
        showSuccess('Status do pedido atualizado com sucesso!');
      } else {
        showError(response.errors?.[0] || 'Erro ao atualizar status');
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      showError('Erro ao atualizar status. Tente novamente.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.Status);
    setStatusNotes('');
    setShowStatusModal(true);
  };

  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter]);

  const totalPages = Math.ceil(totalOrders / ordersPerPage);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gerenciamento de Pedidos</h1>
            <p className="text-slate-600">Visualize e gerencie todos os pedidos da plataforma</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por ID do pedido, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos os status</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Pedidos */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 mt-2">Carregando pedidos...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <FiX className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadOrders}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center">
              <FiPackage className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Pedido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {orders.map((order) => (
                      <tr key={order.PedidoID} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            #{order.PedidoID}
                          </div>
                          <div className="text-sm text-slate-500">
                            {order.itensPedido?.length || 0} item(s)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {order.cliente?.NomeCompleto}
                          </div>
                          <div className="text-sm text-slate-500">
                            {order.cliente?.Email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.Status)}`}>
                            {formatStatus(order.Status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          R$ {order.Total?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(order.DataPedido).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setOrderModalId(order.PedidoID);
                                setShowOrderModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Ver detalhes do pedido"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openStatusModal(order)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Alterar status"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-700">
                      Mostrando {((currentPage - 1) * ordersPerPage) + 1} a {Math.min(currentPage * ordersPerPage, totalOrders)} de {totalOrders} pedidos
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-slate-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-slate-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                      >
                        Próximo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal de alteração de status */}
        {showStatusModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Alterar Status do Pedido #{selectedOrder.PedidoID}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Novo Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Adicione observações sobre a alteração..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus || !newStatus}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? 'Atualizando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        <OrderDetailsModal
          orderId={orderModalId}
          isOpen={showOrderModal}
          onClose={() => {
            setShowOrderModal(false);
            setOrderModalId(null);
          }}
          isAdmin={true}
        />
      </div>
    </AdminLayout>
  );
}

export default AdminOrdersPage;
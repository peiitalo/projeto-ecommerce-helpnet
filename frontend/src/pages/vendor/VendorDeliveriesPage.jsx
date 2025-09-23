import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import VendorLayout from '../../components/VendorLayout.jsx';
import { entregaApi } from '../../services/api.js';
import {
  FaSearch,
  FaTruck,
  FaCheck,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaEye,
  FaShippingFast
} from 'react-icons/fa';

function VendorDeliveriesPage() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const deliveriesPerPage = 10;


  useEffect(() => {
    loadDeliveries();
  }, [user, searchQuery, statusFilter, currentPage]);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const response = await entregaApi.listarEntregasVendedor({
        page: currentPage,
        limit: deliveriesPerPage,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery
      });
      setDeliveries(response.entregas || []);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
      setDeliveries([]);
      setLoading(false);
    }
  };

  const filteredDeliveries = deliveries;

  const paginatedDeliveries = useMemo(() => {
    const startIndex = (currentPage - 1) * deliveriesPerPage;
    return filteredDeliveries.slice(startIndex, startIndex + deliveriesPerPage);
  }, [filteredDeliveries, currentPage]);

  const totalPages = Math.ceil(filteredDeliveries.length / deliveriesPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'em_transito':
        return 'bg-blue-100 text-blue-800';
      case 'entregue':
        return 'bg-green-100 text-green-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'em_transito':
        return 'Em Trânsito';
      case 'entregue':
        return 'Entregue';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gerenciar Entregas</h1>
            <p className="text-slate-600 mt-1">
              {filteredDeliveries.length} entrega{filteredDeliveries.length !== 1 ? 's' : ''} encontrada{filteredDeliveries.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, pedido ou código de rastreio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="em_transito">Em Trânsito</option>
                <option value="entregue">Entregue</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Carregando entregas...</p>
            </div>
          ) : paginatedDeliveries.length === 0 ? (
            <div className="p-8 text-center">
              <FaTruck className="text-6xl text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchQuery || statusFilter !== 'all' ? 'Nenhuma entrega encontrada' : 'Nenhuma entrega cadastrada'}
              </h3>
              <p className="text-slate-600 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros'
                  : 'As entregas aparecerão aqui quando houver pedidos'
                }
              </p>
            </div>
          ) : (
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
                      Destino
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Previsão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {delivery.orderId}
                          </div>
                          <div className="text-sm text-slate-500">
                            {delivery.trackingCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {delivery.customerName}
                            </div>
                            <div className="text-sm text-slate-500 flex items-center gap-1">
                              <FaPhone className="text-xs" />
                              {delivery.customerPhone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 flex items-start gap-1">
                          <FaMapMarkerAlt className="text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{delivery.address}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(delivery.status)}`}>
                          {getStatusText(delivery.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDate(delivery.estimatedDelivery)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/vendedor/entregas/${delivery.id}`}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Ver Detalhes"
                          >
                            <FaEye />
                          </Link>
                          {delivery.status === 'pendente' && (
                            <button
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Marcar como Enviado"
                            >
                              <FaShippingFast />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700">
                  Mostrando {((currentPage - 1) * deliveriesPerPage) + 1} a{' '}
                  {Math.min(currentPage * deliveriesPerPage, filteredDeliveries.length)} de{' '}
                  {filteredDeliveries.length} resultados
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-slate-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </VendorLayout>
  );
}

export default VendorDeliveriesPage;
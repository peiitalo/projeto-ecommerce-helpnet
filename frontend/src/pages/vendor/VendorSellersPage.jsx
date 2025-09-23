import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import VendorLayout from '../../components/VendorLayout.jsx';
import { vendedorApi } from '../../services/api.js';
import {
  FaSearch,
  FaUser,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt
} from 'react-icons/fa';

function VendorSellersPage() {
  const { user } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const sellersPerPage = 10;


  useEffect(() => {
    loadSellers();
  }, [user, searchQuery, currentPage]);

  const loadSellers = async () => {
    try {
      setLoading(true);
      const response = await vendedorApi.listarVendedores({
        page: currentPage,
        limit: sellersPerPage,
        search: searchQuery
      });
      setSellers(response.vendedores || []);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
      setSellers([]);
      setLoading(false);
    }
  };

  const filteredSellers = sellers;

  const paginatedSellers = useMemo(() => {
    const startIndex = (currentPage - 1) * sellersPerPage;
    return filteredSellers.slice(startIndex, startIndex + sellersPerPage);
  }, [filteredSellers, currentPage]);

  const totalPages = Math.ceil(filteredSellers.length / sellersPerPage);

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getStatusText = (status) => {
    return status === 'active' ? 'Ativo' : 'Inativo';
  };

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gerenciar Vendedores</h1>
            <p className="text-slate-600 mt-1">
              {filteredSellers.length} vendedor{filteredSellers.length !== 1 ? 'es' : ''} encontrado{filteredSellers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            to="/vendedor/vendedores/novo"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus />
            <span>Adicionar Vendedor</span>
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Sellers Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Carregando vendedores...</p>
            </div>
          ) : paginatedSellers.length === 0 ? (
            <div className="p-8 text-center">
              <FaUser className="text-6xl text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchQuery ? 'Nenhum vendedor encontrado' : 'Nenhum vendedor cadastrado'}
              </h3>
              <p className="text-slate-600 mb-4">
                {searchQuery
                  ? 'Tente ajustar os filtros'
                  : 'Comece adicionando seu primeiro vendedor'
                }
              </p>
              {!searchQuery && (
                <Link
                  to="/vendedor/vendedores/novo"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPlus />
                  <span>Adicionar Primeiro Vendedor</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Vendedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Localização
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Vendas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedSellers.map((seller) => (
                    <tr key={seller.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <FaUser className="text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {seller.name}
                            </div>
                            <div className="text-sm text-slate-500">
                              ID: {seller.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 flex items-center gap-1">
                          <FaEnvelope className="text-slate-400" />
                          {seller.email}
                        </div>
                        <div className="text-sm text-slate-500 flex items-center gap-1">
                          <FaPhone className="text-slate-400" />
                          {seller.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 flex items-start gap-1">
                          <FaMapMarkerAlt className="text-slate-400 mt-0.5" />
                          <span>{seller.address}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(seller.status)}`}>
                          {getStatusText(seller.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {formatPrice(seller.totalSales)}
                        </div>
                        <div className="text-sm text-slate-500">
                          {seller.totalOrders} pedidos
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/vendedor/vendedores/${seller.id}`}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Ver Detalhes"
                          >
                            <FaEye />
                          </Link>
                          <button
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Excluir"
                          >
                            <FaTrash />
                          </button>
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
                  Mostrando {((currentPage - 1) * sellersPerPage) + 1} a{' '}
                  {Math.min(currentPage * sellersPerPage, filteredSellers.length)} de{' '}
                  {filteredSellers.length} resultados
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

export default VendorSellersPage;
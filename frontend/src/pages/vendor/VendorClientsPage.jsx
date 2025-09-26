import { useState, useEffect } from 'react';
import VendorLayout from '../../layouts/VendorLayout';
import { useAuth } from '../../context/AuthContext';
import clienteVendedorApi from '../../services/clienteVendedorApi';
import { FiUsers, FiMail, FiPhone, FiShoppingBag, FiSearch, FiEye } from 'react-icons/fi';

function VendorClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalClients, setTotalClients] = useState(0);

  useEffect(() => {
    loadClients();
  }, [user]);

  const loadClients = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await clienteVendedorApi.listarClientes({
        pagina: 1,
        limit: 50,
        search: searchTerm
      });

      if (response.success) {
        setClients(response.clientes || []);
        setTotalClients(response.total || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadClients();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredClients = clients.filter(client =>
    !searchTerm ||
    client.cliente?.NomeCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cliente?.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cliente?.CPF_CNPJ?.includes(searchTerm)
  );

  return (
    <VendorLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="mt-2 text-gray-600">Gerencie seus clientes e veja o histórico de compras</p>
        </div>

        {/* Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou CPF/CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Clients List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {totalClients} cliente{totalClients !== 1 ? 's' : ''} encontrado{totalClients !== 1 ? 's' : ''}
            </div>

            <div className="space-y-4">
              {filteredClients.map((clientRelation) => {
                const client = clientRelation.cliente;
                const stats = clientRelation.estatisticas || {};

                return (
                  <div key={clientRelation.ClienteID} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <FiUsers className="text-blue-600 w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {client?.NomeCompleto || 'Cliente sem nome'}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <FiMail className="w-4 h-4" />
                              <span>{client?.Email || 'Sem e-mail'}</span>
                            </div>
                            {client?.TelefoneCelular && (
                              <div className="flex items-center space-x-1">
                                <FiPhone className="w-4 h-4" />
                                <span>{client.TelefoneCelular}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            CPF/CNPJ: {client?.CPF_CNPJ || 'Não informado'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Total de Pedidos</p>
                            <p className="font-semibold text-gray-900">{stats.totalPedidos || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Valor Total</p>
                            <p className="font-semibold text-green-600">
                              {formatCurrency(stats.valorTotal || 0)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">
                            Cliente desde: {client?.DataCadastro ? formatDate(client.DataCadastro) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <FiShoppingBag className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {stats.totalPedidos || 0} pedido{stats.totalPedidos !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {stats.ultimoPedido && (
                            <span className="text-gray-600">
                              Último pedido: {formatDate(stats.ultimoPedido)}
                            </span>
                          )}
                        </div>

                        <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <FiEye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cliente encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Você ainda não tem clientes cadastrados.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </VendorLayout>
  );
}

export default VendorClientsPage;
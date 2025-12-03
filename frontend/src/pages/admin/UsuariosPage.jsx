import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { FiSearch, FiEye, FiUser, FiShoppingCart, FiDollarSign, FiPhone } from 'react-icons/fi';

function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminAccessToken');

      if (!token) {
        console.error('Token de acesso não encontrado');
        return;
      }

      const response = await fetch('/api/admin/clientes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.clientes) {
          setUsuarios(data.clientes.map(cliente => ({
            id: cliente.ClienteID,
            nome: cliente.NomeCompleto,
            email: cliente.Email,
            telefone: cliente.TelefoneCelular,
            dataCadastro: cliente.DataCadastro,
            totalPedidos: cliente._count?.pedidos || 0,
            valorTotalGasto: cliente.valorTotalGasto || 0,
            pedidosRecentes: cliente.pedidosRecentes || []
          })));
        }
      } else {
        console.error('Erro ao carregar usuários:', response.status);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: usuarios.length,
    totalPedidos: usuarios.reduce((sum, user) => sum + user.totalPedidos, 0),
    valorTotal: usuarios.reduce((sum, user) => sum + user.valorTotalGasto, 0)
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="mt-2 text-gray-600">Gerencie clientes e usuários da plataforma</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FiUser className="text-2xl text-blue-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalPedidos}</p>
              </div>
              <FiShoppingCart className="text-2xl text-green-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total Gasto</p>
                <p className="text-2xl font-bold text-purple-600">R$ {stats.valorTotal.toLocaleString('pt-BR')}</p>
              </div>
              <FiDollarSign className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Usuário
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Nome ou email do usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando usuários...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estatísticas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Últimos Pedidos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsuarios.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{usuario.nome}</div>
                            <div className="text-sm text-gray-500">{usuario.email}</div>
                            <div className="text-xs text-gray-400">
                              Cadastro: {new Date(usuario.dataCadastro).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <FiPhone className="text-gray-400 w-3 h-3" />
                            {usuario.telefone || 'Telefone não informado'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900 flex items-center gap-1">
                              <FiShoppingCart className="text-blue-500 w-3 h-3" />
                              {usuario.totalPedidos} pedidos
                            </div>
                            <div className="text-sm font-medium text-green-600 flex items-center gap-1">
                              <FiDollarSign className="text-green-500 w-3 h-3" />
                              R$ {usuario.valorTotalGasto.toLocaleString('pt-BR')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {usuario.pedidosRecentes.slice(0, 2).map((pedido, index) => (
                              <div key={index} className="text-xs text-gray-600">
                                #{pedido.PedidoID} - R$ {pedido.Total.toFixed(2)} ({new Date(pedido.DataPedido).toLocaleDateString('pt-BR')})
                              </div>
                            ))}
                            {usuario.pedidosRecentes.length === 0 && (
                              <div className="text-xs text-gray-400">Nenhum pedido recente</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Ver detalhes"
                          >
                            <FiEye />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsuarios.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>Nenhum usuário encontrado com os filtros aplicados.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default UsuariosPage;
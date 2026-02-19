import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { FiSearch, FiCheck, FiX, FiEye, FiBriefcase, FiUsers, FiPackage, FiTrendingUp } from 'react-icons/fi';

function EmpresasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminAccessToken');

      if (!token) {
        console.error('Token de acesso não encontrado');
        return;
      }

      const response = await fetch('/api/admin/empresas', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.empresas) {
          setEmpresas(data.empresas.map(empresa => ({
            id: empresa.EmpresaID,
            nome: empresa.Nome,
            documento: empresa.Documento,
            email: empresa.Email,
            telefone: empresa.Telefone,
            status: empresa.Ativo ? 'ativo' : 'inativo',
            dataCadastro: empresa.CriadoEm,
            vendedores: empresa._count?.vendedores || 0,
            produtos: empresa._count?.produtos || 0,
            vendasTotais: empresa.vendasTotais || 0,
            vendedoresList: empresa.vendedores || []
          })));
        }
      } else {
        console.error('Erro ao carregar empresas:', response.status);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmpresas = empresas.filter(empresa => {
    const matchesSearch = empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         empresa.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         empresa.documento.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || empresa.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (empresaId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      const newStatus = !currentStatus;

      const response = await fetch(`/api/admin/empresas/${empresaId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ativo: newStatus })
      });

      if (response.ok) {
        setEmpresas(prev => prev.map(emp =>
          emp.id === empresaId ? { ...emp, status: newStatus ? 'ativo' : 'inativo' } : emp
        ));
      } else {
        console.error('Erro ao atualizar status da empresa');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo': return 'text-green-700 bg-green-100';
      case 'inativo': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ativo': return 'Ativa';
      case 'inativo': return 'Inativa';
      default: return status;
    }
  };

  const stats = {
    total: empresas.length,
    ativas: empresas.filter(e => e.status === 'ativo').length,
    inativas: empresas.filter(e => e.status === 'inativo').length
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Empresas</h1>
          <p className="mt-2 text-gray-600">Gerencie empresas e vendedores da plataforma</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Empresas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FiBriefcase className="text-2xl text-blue-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Empresas Ativas</p>
                <p className="text-2xl font-bold text-green-600">{stats.ativas}</p>
              </div>
              <FiCheck className="text-2xl text-green-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Empresas Inativas</p>
                <p className="text-2xl font-bold text-red-600">{stats.inativas}</p>
              </div>
              <FiX className="text-2xl text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Empresa
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nome, email ou CNPJ da empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os status</option>
                <option value="ativo">Ativas</option>
                <option value="inativo">Inativas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Companies Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando empresas...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estatísticas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEmpresas.map((empresa) => (
                      <tr key={empresa.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{empresa.nome}</div>
                            <div className="text-sm text-gray-500">{empresa.email}</div>
                            <div className="text-xs text-gray-400">CNPJ: {empresa.documento}</div>
                            <div className="text-xs text-gray-400">
                              Cadastro: {new Date(empresa.dataCadastro).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {empresa.telefone || 'Telefone não informado'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900 flex items-center gap-1">
                              <FiUsers className="text-blue-500 w-3 h-3" />
                              {empresa.vendedores} vendedores
                            </div>
                            <div className="text-sm text-gray-900 flex items-center gap-1">
                              <FiPackage className="text-green-500 w-3 h-3" />
                              {empresa.produtos} produtos
                            </div>
                            <div className="text-sm font-medium text-green-600 flex items-center gap-1">
                              <FiTrendingUp className="text-green-500 w-3 h-3" />
                              R$ {empresa.vendasTotais.toLocaleString('pt-BR')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(empresa.status)}`}>
                            {getStatusText(empresa.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleStatus(empresa.id, empresa.status === 'ativo')}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                empresa.status === 'ativo'
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {empresa.status === 'ativo' ? 'Desativar' : 'Ativar'}
                            </button>
                            <button
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Ver detalhes"
                            >
                              <FiEye />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredEmpresas.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>Nenhuma empresa encontrada com os filtros aplicados.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default EmpresasPage;
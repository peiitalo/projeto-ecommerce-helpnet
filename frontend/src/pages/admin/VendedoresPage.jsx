import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { FiSearch, FiCheck, FiX, FiEye, FiBarChart2, FiUsers, FiTrendingUp } from 'react-icons/fi';

function VendedoresPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Mock data for vendors
  const [vendors, setVendors] = useState([
    {
      id: 1,
      nome: 'Loja do João',
      email: 'joao@loja.com',
      status: 'aprovado',
      dataCadastro: '2024-01-15',
      produtos: 45,
      vendas: 1250,
      receita: 45600
    },
    {
      id: 2,
      nome: 'Eletrônicos Silva',
      email: 'silva@eletronicos.com',
      status: 'pendente',
      dataCadastro: '2024-02-20',
      produtos: 23,
      vendas: 890,
      receita: 32100
    },
    {
      id: 3,
      nome: 'Moda & Estilo',
      email: 'contato@modaestilo.com',
      status: 'rejeitado',
      dataCadastro: '2024-01-10',
      produtos: 67,
      vendas: 2100,
      receita: 78900
    },
    {
      id: 4,
      nome: 'Casa Linda',
      email: 'vendas@casalinda.com',
      status: 'aprovado',
      dataCadastro: '2024-03-05',
      produtos: 34,
      vendas: 1560,
      receita: 52300
    }
  ]);

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (vendorId) => {
    setVendors(prev => prev.map(v =>
      v.id === vendorId ? { ...v, status: 'aprovado' } : v
    ));
  };

  const handleReject = (vendorId) => {
    setVendors(prev => prev.map(v =>
      v.id === vendorId ? { ...v, status: 'rejeitado' } : v
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aprovado': return 'text-green-700 bg-green-100';
      case 'pendente': return 'text-yellow-700 bg-yellow-100';
      case 'rejeitado': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'aprovado': return 'Aprovado';
      case 'pendente': return 'Pendente';
      case 'rejeitado': return 'Rejeitado';
      default: return status;
    }
  };

  const stats = {
    total: vendors.length,
    aprovados: vendors.filter(v => v.status === 'aprovado').length,
    pendentes: vendors.filter(v => v.status === 'pendente').length,
    rejeitados: vendors.filter(v => v.status === 'rejeitado').length
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Vendedores</h1>
          <p className="mt-2 text-gray-600">Aprove, rejeite e monitore vendedores da plataforma</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Vendedores</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FiUsers className="text-2xl text-blue-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">{stats.aprovados}</p>
              </div>
              <FiCheck className="text-2xl text-green-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
              </div>
              <FiBarChart2 className="text-2xl text-yellow-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejeitados</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejeitados}</p>
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
                Buscar Vendedor
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nome ou email do vendedor..."
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
                <option value="aprovado">Aprovados</option>
                <option value="pendente">Pendentes</option>
                <option value="rejeitado">Rejeitados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produtos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receita
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vendor.nome}</div>
                        <div className="text-sm text-gray-500">{vendor.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vendor.status)}`}>
                        {getStatusText(vendor.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(vendor.dataCadastro).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.produtos}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.vendas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {vendor.receita.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(vendor.id)}
                          disabled={vendor.status === 'aprovado'}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Aprovar"
                        >
                          <FiCheck />
                        </button>
                        <button
                          onClick={() => handleReject(vendor.id)}
                          disabled={vendor.status === 'rejeitado'}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Rejeitar"
                        >
                          <FiX />
                        </button>
                        <button
                          className="text-blue-600 hover:text-blue-900"
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

          {filteredVendors.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum vendedor encontrado com os filtros aplicados.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default VendedoresPage;
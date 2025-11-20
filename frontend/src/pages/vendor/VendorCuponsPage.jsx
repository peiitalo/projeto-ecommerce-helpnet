import VendorLayout from '../../layouts/VendorLayout';
import { FiPlus, FiEdit, FiTrash2, FiCopy, FiSearch, FiFilter } from 'react-icons/fi';
import { FaTicketAlt, FaPercent, FaTruck } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import cupomApi from '../../services/cupomApi.js';
import CouponModal from '../../components/CouponModal.jsx';

function VendorCuponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // Carregar cupons
  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await cupomApi.listar({
        busca: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setCoupons(response.cupons || []);
    } catch (err) {
      setError('Erro ao carregar cupons');
      console.error('Erro ao carregar cupons:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar cupons localmente
  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = !searchTerm ||
      coupon.Nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.Codigo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && coupon.Ativo) ||
      (statusFilter === 'inactive' && !coupon.Ativo);

    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handleToggleStatus = async (couponId) => {
    try {
      await cupomApi.toggleStatus(couponId);
      await loadCoupons(); // Recarregar lista
    } catch (err) {
      setError('Erro ao alterar status do cupom');
      console.error('Erro ao alterar status:', err);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;

    try {
      await cupomApi.excluir(couponId);
      await loadCoupons(); // Recarregar lista
    } catch (err) {
      setError('Erro ao excluir cupom');
      console.error('Erro ao excluir cupom:', err);
    }
  };

  const handleSearch = () => {
    loadCoupons();
  };

  const handleStatusFilter = (newStatus) => {
    setStatusFilter(newStatus);
    // Recarregar com novo filtro
    setTimeout(() => loadCoupons(), 0);
  };

  const handleCreateCoupon = () => {
    setShowCreateModal(true);
  };

  const handleCouponCreated = () => {
    loadCoupons(); // Recarregar lista de cupons
    setEditingCoupon(null);
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setShowCreateModal(true);
  };

  const formatDiscount = (coupon) => {
    if (coupon.DescontoTipo === 'frete_gratis') {
      return 'Frete Grátis';
    }
    if (coupon.DescontoTipo === 'valor_fixo') {
      return `R$ ${coupon.DescontoValor.toFixed(2)} OFF`;
    }
    return `${coupon.DescontoValor}% OFF`;
  };

  const getStatusColor = (active) => {
    return active ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100';
  };

  const getStatusText = (active) => {
    return active ? 'Ativo' : 'Inativo';
  };

  return (
    <VendorLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciar Cupons</h1>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">Crie e gerencie cupons de desconto para seus clientes</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleCreateCoupon}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              <FiPlus />
              <span>Criar Cupom</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Cupom
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Código ou descrição..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Coupons List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Loading State */}
          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando cupons...</p>
            </div>
          )}

          {!loading && (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cupom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Validade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCoupons.length > 0 ? (
                  filteredCoupons.map((coupon) => (
                    <tr key={coupon.CupomID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaTicketAlt className="text-blue-600 mr-3" />
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {coupon.Codigo}
                              <button
                                className="text-gray-400 hover:text-gray-600"
                                title="Copiar código"
                                onClick={() => navigator.clipboard.writeText(coupon.Codigo)}
                              >
                                <FiCopy className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-sm text-gray-500">{coupon.Nome}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{formatDiscount(coupon)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(coupon.Ativo)}`}>
                          {getStatusText(coupon.Ativo)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.UsosAtuais || 0}/{coupon.LimiteUso || '∞'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.DataExpiracao ? new Date(coupon.DataExpiracao).toLocaleDateString('pt-BR') : 'Sem expiração'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditCoupon(coupon)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <FiEdit />
                          </button>
                          <button
                            className={`hover:text-gray-900 ${coupon.Ativo ? 'text-green-600' : 'text-red-600'}`}
                            title={coupon.Ativo ? 'Desativar' : 'Ativar'}
                            onClick={() => handleToggleStatus(coupon.CupomID)}
                          >
                            {coupon.Ativo ? '✓' : '✗'}
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                            onClick={() => handleDeleteCoupon(coupon.CupomID)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      Nenhum cupom encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {filteredCoupons.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredCoupons.map((coupon) => (
                  <div key={coupon.CupomID} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <FaTicketAlt className="text-blue-600 text-lg" />
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {coupon.Codigo}
                            <button
                              className="text-gray-400 hover:text-gray-600"
                              title="Copiar código"
                              onClick={() => navigator.clipboard.writeText(coupon.Codigo)}
                            >
                              <FiCopy className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-sm text-gray-500">{coupon.Nome}</div>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(coupon.Ativo)}`}>
                        {getStatusText(coupon.Ativo)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500">Tipo:</span>
                        <div className="font-medium text-gray-900">{formatDiscount(coupon)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Uso:</span>
                        <div className="font-medium text-gray-900">
                          {coupon.UsosAtuais || 0}/{coupon.LimiteUso || '∞'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Validade:</span>
                        <div className="font-medium text-gray-900">
                          {coupon.DataExpiracao ? new Date(coupon.DataExpiracao).toLocaleDateString('pt-BR') : 'Sem expiração'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleEditCoupon(coupon)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Editar"
                      >
                        <FiEdit className="w-5 h-5" />
                      </button>
                      <button
                        className={`p-2 hover:bg-gray-50 rounded-lg ${coupon.Ativo ? 'text-green-600' : 'text-red-600'}`}
                        title={coupon.Ativo ? 'Desativar' : 'Ativar'}
                        onClick={() => handleToggleStatus(coupon.CupomID)}
                      >
                        {coupon.Ativo ? '✓' : '✗'}
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Excluir"
                        onClick={() => handleDeleteCoupon(coupon.CupomID)}
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Nenhum cupom encontrado.
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Criação de Cupom */}
      <CouponModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCouponCreated}
        editingCoupon={editingCoupon}
      />
    </VendorLayout>
  );
}

export default VendorCuponsPage;
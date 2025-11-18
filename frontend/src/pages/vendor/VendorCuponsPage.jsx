import { useState, useEffect } from 'react';
import VendorLayout from '../../layouts/VendorLayout';
import { FiPlus, FiEdit, FiTrash2, FiCopy, FiSearch, FiFilter } from 'react-icons/fi';
import { FaTicketAlt, FaPercent, FaTruck } from 'react-icons/fa';
import { useNotifications } from '../../hooks/useNotifications';

function VendorCuponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { showSuccess, showError } = useNotifications();

  // Load coupons from API
  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

      console.log('[VendorCuponsPage] Debug - Load Coupons:', {
        token: token ? 'present' : 'missing',
        tokenLength: token ? token.length : 0,
        tokenPrefix: token ? token.substring(0, 20) + '...' : 'none',
        tokenSource: localStorage.getItem('accessToken') ? 'accessToken' : 'token',
        url: '/api/cupons/vendedor/',
        method: 'GET'
      });

      const response = await fetch('/api/cupons/vendedor/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[VendorCuponsPage] Debug - Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const formattedCoupons = data.data.map(coupon => ({
            id: coupon.CupomID,
            code: coupon.Codigo,
            discount: coupon.ValorDesconto,
            type: coupon.TipoDesconto === 'PERCENTUAL' ? 'percentage' :
                  coupon.TipoDesconto === 'FRETE_GRATIS' ? 'free_shipping' : 'fixed',
            description: coupon.Descricao,
            validUntil: coupon.DataExpiracao ? coupon.DataExpiracao.split('T')[0] : null,
            active: coupon.Ativo,
            usageLimit: coupon.LimiteUso || 0,
            usageCount: coupon.UsosAtuais || 0,
            minValue: coupon.ValorMinimo || 0,
            tipoDistribuicao: coupon.TipoDistribuicao
          }));
          setCoupons(formattedCoupons);
        }
      } else {
        console.error('Erro na resposta da API:', response.status);
      }
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
      // Fallback para dados mock se a API falhar
      setCoupons([
        {
          id: 1,
          code: 'VENDEDOR10',
          discount: 10,
          type: 'percentage',
          description: '10% de desconto para clientes fiéis',
          validUntil: '2024-12-31',
          active: true,
          usageLimit: 100,
          usageCount: 45,
          minValue: 50,
          tipoDistribuicao: 'PUBLICO'
        },
        {
          id: 2,
          code: 'FRETEGRATIS',
          discount: 0,
          type: 'free_shipping',
          description: 'Frete grátis em compras acima de R$ 100',
          validUntil: '2024-12-15',
          active: true,
          usageLimit: 50,
          usageCount: 23,
          minValue: 100,
          tipoDistribuicao: 'VENDEDOR_ESPECIFICO'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
                          (filterStatus === 'active' && coupon.active) ||
                          (filterStatus === 'inactive' && !coupon.active);
    return matchesSearch && matchesStatus;
  });

  const handleCreateCoupon = () => {
    setEditingCoupon(null);
    setShowCreateModal(true);
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setShowCreateModal(true);
  };

  const handleDeleteCoupon = async (couponId) => {
    if (window.confirm('Tem certeza que deseja excluir este cupom?')) {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

        const response = await fetch(`/api/cupons/vendedor/${couponId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setCoupons(prev => prev.filter(c => c.id !== couponId));
          showSuccess('Cupom excluído com sucesso!');
        } else {
          showError('Erro ao excluir cupom');
        }
      } catch (error) {
        console.error('Erro ao excluir cupom:', error);
        showError('Erro ao excluir cupom');
      }
    }
  };

  const handleToggleStatus = async (couponId) => {
    try {
      const coupon = coupons.find(c => c.id === couponId);
      if (!coupon) return;

      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

      const response = await fetch(`/api/cupons/vendedor/${couponId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ativo: !coupon.active
        })
      });

      if (response.ok) {
        setCoupons(prev => prev.map(c =>
          c.id === couponId ? { ...c, active: !c.active } : c
        ));
        showSuccess(`Cupom ${coupon.active ? 'desativado' : 'ativado'} com sucesso!`);
      } else {
        showError('Erro ao alterar status do cupom');
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      showError('Erro ao alterar status do cupom');
    }
  };

  const handleSaveCoupon = async (couponData) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

      const apiData = {
        codigo: couponData.code,
        descricao: couponData.description,
        tipoDesconto: couponData.type === 'percentage' ? 'PERCENTUAL' :
                      couponData.type === 'free_shipping' ? 'FRETE_GRATIS' : 'VALOR_FIXO',
        valorDesconto: couponData.discount,
        valorMinimo: couponData.minValue,
        limiteUso: couponData.usageLimit || null,
        dataExpiracao: couponData.validUntil,
        ativo: couponData.active,
        tipoDistribuicao: couponData.tipoDistribuicao || 'PUBLICO'
      };

      let response;
      if (editingCoupon) {
        response = await fetch(`/api/cupons/vendedor/${editingCoupon.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(apiData)
        });
      } else {
        response = await fetch('/api/cupons/vendedor/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(apiData)
        });
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await loadCoupons(); // Recarregar lista
          setShowCreateModal(false);
          setEditingCoupon(null);
          showSuccess(editingCoupon ? 'Cupom atualizado com sucesso!' : 'Cupom criado com sucesso!');
        } else {
          showError('Erro: ' + result.message);
        }
      } else {
        showError('Erro ao salvar cupom');
      }
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      showError('Erro ao salvar cupom');
    }
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      showSuccess('Código do cupom copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar código:', error);
      // Fallback para browsers que não suportam clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showSuccess('Código do cupom copiado para a área de transferência!');
    }
  };

  const formatDiscount = (coupon) => {
    if (coupon.type === 'free_shipping') {
      return 'Frete Grátis';
    }
    return `${coupon.discount}% OFF`;
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    Distribuição
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
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan="7" className="px-6 py-4">
                        <div className="animate-pulse flex items-center space-x-4">
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredCoupons.length > 0 ? (
                  filteredCoupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaTicketAlt className="text-blue-600 mr-3" />
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {coupon.code}
                              <button
                                onClick={() => copyToClipboard(coupon.code)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copiar código"
                              >
                                <FiCopy className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-sm text-gray-500">{coupon.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{formatDiscount(coupon)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          coupon.tipoDistribuicao === 'PUBLICO'
                            ? 'text-blue-700 bg-blue-100'
                            : 'text-purple-700 bg-purple-100'
                        }`}>
                          {coupon.tipoDistribuicao === 'PUBLICO' ? 'Público' : 'Clientes Específicos'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(coupon.active)}`}>
                          {getStatusText(coupon.active)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.usageCount || 0}/{coupon.usageLimit || '∞'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString('pt-BR') : 'Sem expiração'}
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
                            onClick={() => handleToggleStatus(coupon.id)}
                            className={`hover:text-gray-900 ${coupon.active ? 'text-green-600' : 'text-red-600'}`}
                            title={coupon.active ? 'Desativar' : 'Ativar'}
                          >
                            {coupon.active ? '✓' : '✗'}
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      Nenhum cupom encontrado com os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {loading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div className="w-16 h-6 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCoupons.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredCoupons.map((coupon) => (
                  <div key={coupon.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <FaTicketAlt className="text-blue-600 text-lg" />
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {coupon.code}
                            <button
                              onClick={() => copyToClipboard(coupon.code)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Copiar código"
                            >
                              <FiCopy className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-sm text-gray-500">{coupon.description}</div>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(coupon.active)}`}>
                        {getStatusText(coupon.active)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500">Tipo:</span>
                        <div className="font-medium text-gray-900">{formatDiscount(coupon)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Distribuição:</span>
                        <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                          coupon.tipoDistribuicao === 'PUBLICO'
                            ? 'text-blue-700 bg-blue-100'
                            : 'text-purple-700 bg-purple-100'
                        }`}>
                          {coupon.tipoDistribuicao === 'PUBLICO' ? 'Público' : 'Clientes Específicos'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Uso:</span>
                        <div className="font-medium text-gray-900">
                          {coupon.usageCount || 0}/{coupon.usageLimit || '∞'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Validade:</span>
                        <div className="font-medium text-gray-900">
                          {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString('pt-BR') : 'Sem expiração'}
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
                        onClick={() => handleToggleStatus(coupon.id)}
                        className={`p-2 hover:bg-gray-50 rounded-lg ${coupon.active ? 'text-green-600' : 'text-red-600'}`}
                        title={coupon.active ? 'Desativar' : 'Ativar'}
                      >
                        {coupon.active ? '✓' : '✗'}
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Excluir"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Nenhum cupom encontrado com os filtros aplicados.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CouponModal
          coupon={editingCoupon}
          onSave={handleSaveCoupon}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCoupon(null);
          }}
        />
      )}
    </VendorLayout>
  );
}

// Coupon Modal Component
function CouponModal({ coupon, onSave, onClose }) {
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    discount: coupon?.discount || 10,
    type: coupon?.type || 'percentage',
    description: coupon?.description || '',
    validUntil: coupon?.validUntil || '',
    active: coupon?.active ?? true,
    usageLimit: coupon?.usageLimit || (coupon?.tipoDistribuicao === 'VENDEDOR_ESPECIFICO' ? null : 100),
    minValue: coupon?.minValue || 0,
    tipoDistribuicao: coupon?.tipoDistribuicao || 'PUBLICO'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const generateCode = () => {
    const code = 'CUPOM' + Math.random().toString(36).substr(2, 6).toUpperCase();
    setFormData(prev => ({ ...prev, code }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
            {coupon ? 'Editar Cupom' : 'Criar Novo Cupom'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Código do Cupom
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
                  placeholder="EX: DESCONTO10"
                  required
                />
                <button
                  type="button"
                  onClick={generateCode}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Gerar
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de Desconto
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="percentage">Percentual (%)</option>
                <option value="free_shipping">Frete Grátis</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de Distribuição
              </label>
              <select
                value={formData.tipoDistribuicao}
                onChange={(e) => setFormData(prev => ({ ...prev, tipoDistribuicao: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="PUBLICO">Público (todos os clientes)</option>
                <option value="VENDEDOR_ESPECIFICO">Clientes Específicos (apenas meus clientes)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {formData.tipoDistribuicao === 'VENDEDOR_ESPECIFICO'
                  ? 'Cupom disponível apenas para clientes que já compraram seus produtos. Limite de uso será definido automaticamente.'
                  : 'Cupom disponível para todos os clientes da plataforma.'}
              </p>
            </div>

            {formData.type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Valor do Desconto (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Limite de Uso
              </label>
              <input
                type="number"
                min="1"
                value={formData.usageLimit || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value ? parseInt(e.target.value) : null }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required={formData.tipoDistribuicao !== 'VENDEDOR_ESPECIFICO'}
                disabled={formData.tipoDistribuicao === 'VENDEDOR_ESPECIFICO'}
              />
              {formData.tipoDistribuicao === 'VENDEDOR_ESPECIFICO' && (
                <p className="text-xs text-slate-500 mt-1">
                  Limite será definido automaticamente baseado no número de seus clientes
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Valor Mínimo (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minValue}
                onChange={(e) => setFormData(prev => ({ ...prev, minValue: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Data de Validade
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                rows="3"
                placeholder="Descreva as condições do cupom..."
                required
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <span className="ml-2 text-sm text-slate-700">Cupom ativo</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg order-2 sm:order-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 order-1 sm:order-2"
            >
              {coupon ? 'Salvar Alterações' : 'Criar Cupom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VendorCuponsPage;
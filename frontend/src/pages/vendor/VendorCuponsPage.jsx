import { useState, useEffect } from 'react';
import VendorLayout from '../../layouts/VendorLayout';
import { FiPlus, FiEdit, FiTrash2, FiCopy, FiSearch, FiFilter } from 'react-icons/fi';
import { FaTicketAlt, FaPercent, FaTruck } from 'react-icons/fa';

function VendorCuponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock coupons data
  useEffect(() => {
    setTimeout(() => {
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
          minValue: 50
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
          minValue: 100
        },
        {
          id: 3,
          code: 'BLACKFRIDAY',
          discount: 20,
          type: 'percentage',
          description: '20% OFF na Black Friday',
          validUntil: '2024-11-30',
          active: false,
          usageLimit: 200,
          usageCount: 0,
          minValue: 0
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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

  const handleDeleteCoupon = (couponId) => {
    if (window.confirm('Tem certeza que deseja excluir este cupom?')) {
      setCoupons(prev => prev.filter(c => c.id !== couponId));
    }
  };

  const handleToggleStatus = (couponId) => {
    setCoupons(prev => prev.map(c =>
      c.id === couponId ? { ...c, active: !c.active } : c
    ));
  };

  const handleSaveCoupon = (couponData) => {
    if (editingCoupon) {
      setCoupons(prev => prev.map(c =>
        c.id === editingCoupon.id ? { ...c, ...couponData } : c
      ));
    } else {
      const newCoupon = {
        ...couponData,
        id: Date.now(),
        usageCount: 0
      };
      setCoupons(prev => [newCoupon, ...prev]);
    }
    setShowCreateModal(false);
    setEditingCoupon(null);
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    // Could show a toast here
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Cupons</h1>
            <p className="mt-2 text-gray-600">Crie e gerencie cupons de desconto para seus clientes</p>
          </div>
          <button
            onClick={handleCreateCoupon}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus />
            <span>Criar Cupom</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
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
            <div className="sm:w-48">
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
          <div className="overflow-x-auto">
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
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan="6" className="px-6 py-4">
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(coupon.active)}`}>
                          {getStatusText(coupon.active)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.usageCount}/{coupon.usageLimit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}
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
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      Nenhum cupom encontrado com os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
    usageLimit: coupon?.usageLimit || 100,
    minValue: coupon?.minValue || 0
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {coupon ? 'Editar Cupom' : 'Criar Novo Cupom'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
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
                value={formData.usageLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
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

            <div className="md:col-span-2">
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

            <div className="md:col-span-2">
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
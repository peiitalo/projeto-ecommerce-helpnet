import { FiX } from 'react-icons/fi';
import { FaTicketAlt, FaCalendarAlt, FaUser, FaClock, FaPercent, FaTag } from 'react-icons/fa';

function CouponDetailsModal({ isOpen, onClose, coupon }) {
  if (!isOpen || !coupon) return null;

  const formatDiscount = (coupon) => {
    if (coupon.type === 'free_shipping') {
      return 'Frete Grátis';
    }
    if (coupon.type === 'fixed') {
      return `R$ ${coupon.discount}`;
    }
    return `${coupon.discount}%`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (coupon) => {
    // Handle new state-based system
    if (coupon.state) {
      switch (coupon.state) {
        case 'active': return 'bg-green-100 text-green-700 border-green-200';
        case 'grayed_out': return 'bg-gray-100 text-gray-700 border-gray-200';
        case 'inactive': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
      }
    }

    // Fallback to old status system
    switch (coupon.status) {
      case 'available': return 'bg-green-100 text-green-700 border-green-200';
      case 'redeemed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'used': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusText = (coupon) => {
    // Handle new state-based system
    if (coupon.state) {
      switch (coupon.state) {
        case 'active': return 'Ativo';
        case 'grayed_out': return 'Aplicável com restrições';
        case 'inactive': return 'Não pode ser aplicado';
        default: return coupon.state;
      }
    }

    // Fallback to old status system
    switch (coupon.status) {
      case 'available': return 'Disponível';
      case 'redeemed': return 'Resgatado';
      case 'used': return 'Utilizado';
      default: return coupon.status;
    }
  };

  const getStatusIcon = (coupon) => {
    if (coupon.state) {
      switch (coupon.state) {
        case 'active': return '';
        case 'grayed_out': return '⚠️';
        case 'inactive': return '❌';
        default: return '❓';
      }
    }
    return '📋';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FaTicketAlt className="text-blue-600" />
            Detalhes do Cupom
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações Gerais */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
              <FaTag className="text-blue-600" />
              Informações Gerais
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-slate-900">Nome:</span>
                <span className="text-slate-600">{coupon.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-900">Código:</span>
                <span className="font-mono text-slate-600">{coupon.code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-900">Status:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getStatusIcon(coupon)}</span>
                  <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(coupon)}`}>
                    {getStatusText(coupon)}
                  </span>
                </div>
              </div>
              {coupon.reason && (
                <div className="flex justify-between">
                  <span className="font-medium text-slate-900">Motivo:</span>
                  <span className="text-slate-600 text-sm max-w-xs text-right">{coupon.reason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Desconto */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
              <FaPercent className="text-blue-600" />
              Desconto
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-slate-900">Tipo:</span>
                <span className="text-slate-600">
                  {coupon.type === 'percentage' ? 'Percentual' :
                   coupon.type === 'fixed' ? 'Valor Fixo' :
                   coupon.type === 'free_shipping' ? 'Frete Grátis' : coupon.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-900">Valor:</span>
                <span className="text-slate-600">{formatDiscount(coupon)}</span>
              </div>
            </div>
          </div>

          {/* Validade */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
              <FaCalendarAlt className="text-blue-600" />
              Validade
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-slate-900">Expira em:</span>
                <span className="text-slate-600">{formatDate(coupon.validUntil)}</span>
              </div>
            </div>
          </div>

          {/* Restrições */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-3">Restrições</h3>
            <div className="space-y-2 text-sm">
              {coupon.minValue > 0 && (
                <div className="flex justify-between">
                  <span className="font-medium text-slate-900">Valor mínimo:</span>
                  <span className="text-slate-600">R$ {coupon.minValue}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium text-slate-900">Categoria:</span>
                <span className="text-slate-600">
                  {coupon.restricoes?.categoriaNome || 'Todas as categorias'}
                </span>
              </div>
              {coupon.restricoes?.quantidade_minima_itens && (
                <div className="flex justify-between">
                  <span className="font-medium text-slate-900">Mínimo de itens:</span>
                  <span className="text-slate-600">{coupon.restricoes.quantidade_minima_itens}</span>
                </div>
              )}
              {coupon.restricoes?.frete_gratis_acima && (
                <div className="flex justify-between">
                  <span className="font-medium text-slate-900">Frete grátis acima:</span>
                  <span className="text-slate-600">R$ {coupon.restricoes.frete_gratis_acima}</span>
                </div>
              )}
              {(!coupon.minValue || coupon.minValue <= 0) &&
               !coupon.restricoes?.categoriaId &&
               !coupon.restricoes?.quantidade_minima_itens &&
               !coupon.restricoes?.frete_gratis_acima && (
                <p className="text-slate-600">Nenhuma restrição específica</p>
              )}
            </div>
          </div>

          {/* Limites de Uso */}
          {(coupon.limiteUso || coupon.usoPorCliente || coupon.usosAtuais !== undefined) && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-3">Limites de Uso</h3>
              <div className="space-y-2 text-sm">
                {coupon.limiteUso && (
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-900">Limite total:</span>
                    <span className="text-slate-600">{coupon.usosAtuais || 0} / {coupon.limiteUso} usos</span>
                  </div>
                )}
                {coupon.usoPorCliente && (
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-900">Limite por cliente:</span>
                    <span className="text-slate-600">{coupon.usoPorCliente} uso{coupon.usoPorCliente > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Distribuição */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
              <FaUser className="text-blue-600" />
              Distribuição
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-slate-900">Tipo:</span>
                <span className="text-slate-600">Distribuído pelo vendedor</span>
              </div>
              {coupon.vendedor && (
                <div className="flex justify-between">
                  <span className="font-medium text-slate-900">Vendedor:</span>
                  <span className="text-slate-600">{coupon.vendedor}</span>
                </div>
              )}
            </div>
          </div>

          {/* Histórico */}
          {(coupon.redeemedAt || coupon.usedAt) && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                <FaClock className="text-blue-600" />
                Histórico
              </h3>
              <div className="space-y-2 text-sm">
                {coupon.redeemedAt && (
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-900">Resgatado em:</span>
                    <span className="text-slate-600">{formatDate(coupon.redeemedAt)}</span>
                  </div>
                )}
                {coupon.usedAt && (
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-900">Usado em:</span>
                    <span className="text-slate-600">{formatDate(coupon.usedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default CouponDetailsModal;
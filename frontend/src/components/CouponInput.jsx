import { useState, useEffect } from 'react';
import { FaTicketAlt, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { useCupom } from '../hooks/useCupom';

function CouponInput({ cartItems, cartTotal, onCouponApplied, disabled = false }) {
  const [couponCode, setCouponCode] = useState('');
  const { couponState, couponReason, couponDetails, aplicarCupom, validarCupomEmTempoReal, removerCupom } = useCupom();

  // Real-time validation when cart changes or code changes
  useEffect(() => {
    if (couponCode.trim() && cartItems.length > 0) {
      const timeoutId = setTimeout(() => {
        validarCupomEmTempoReal(couponCode.trim(), cartItems, cartTotal);
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    } else if (couponState !== 'idle') {
      // Reset state when input is cleared or cart is empty
      setTimeout(() => {
        // Small delay to prevent flickering
      }, 100);
    }
  }, [couponCode, cartItems, cartTotal, validarCupomEmTempoReal]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    const success = await aplicarCupom(couponCode.trim(), cartItems, cartTotal);
    if (success && onCouponApplied) {
      onCouponApplied(couponDetails);
    }
  };

  const handleRemoveCoupon = () => {
    removerCupom();
    setCouponCode('');
    if (onCouponApplied) {
      onCouponApplied(null);
    }
  };

  const getStateDisplay = () => {
    switch (couponState) {
      case 'idle':
        return {
          icon: <FaTicketAlt className="text-slate-400" />,
          text: 'Digite o código do cupom',
          color: 'border-slate-200',
          showApply: false
        };
      case 'loading':
        return {
          icon: <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>,
          text: 'Validando cupom...',
          color: 'border-blue-300',
          showApply: false
        };
      case 'active':
        return {
          icon: <FaCheck className="text-green-600" />,
          text: couponDetails ? `Cupom aplicado: ${couponDetails.Nome || couponDetails.name}` : 'Cupom válido',
          color: 'border-green-300 bg-green-50',
          showApply: true,
          discountText: couponDetails ? formatDiscount(couponDetails) : null
        };
      case 'grayed_out':
        return {
          icon: <FaExclamationTriangle className="text-yellow-600" />,
          text: couponReason || 'Cupom aplicável com restrições',
          color: 'border-yellow-300 bg-yellow-50',
          showApply: false
        };
      case 'inactive':
        return {
          icon: <FaTimes className="text-red-600" />,
          text: couponReason || 'Cupom não pode ser aplicado',
          color: 'border-red-300 bg-red-50',
          showApply: false
        };
      default:
        return {
          icon: <FaTicketAlt className="text-slate-400" />,
          text: 'Digite o código do cupom',
          color: 'border-slate-200',
          showApply: false
        };
    }
  };

  const formatDiscount = (coupon) => {
    if (!coupon) return null;

    const { DescontoTipo, DescontoValor } = coupon;
    if (DescontoTipo === 'porcentagem') {
      return `${DescontoValor}%`;
    } else if (DescontoTipo === 'valor_fixo') {
      return `R$ ${DescontoValor.toFixed(2)}`;
    } else if (DescontoTipo === 'frete_gratis') {
      return 'Frete Grátis';
    }
    return null;
  };

  const stateDisplay = getStateDisplay();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FaTicketAlt className="text-blue-600" />
        <span className="font-medium text-slate-900">Cupom de Desconto</span>
      </div>

      <div className={`p-3 rounded-lg border ${stateDisplay.color} transition-colors`}>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {stateDisplay.icon}
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder={cartItems.length === 0 ? "Adicione itens ao carrinho primeiro" : "Digite o código do cupom"}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder-slate-400 min-w-0"
              disabled={disabled || couponState === 'loading' || cartItems.length === 0}
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {couponState === 'active' ? (
              <button
                onClick={handleRemoveCoupon}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-200 whitespace-nowrap"
                disabled={disabled}
              >
                Remover
              </button>
            ) : (
              couponCode.trim() && couponState !== 'loading' && (
                <button
                  onClick={handleApplyCoupon}
                  className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
                  disabled={disabled || couponState === 'loading' || couponState === 'inactive' || cartItems.length === 0}
                >
                  Aplicar
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Status message - only show for active state */}
      {couponState === 'active' && (
        <div className="text-sm text-slate-600 min-h-[1.25rem]">
          {stateDisplay.text}
          {stateDisplay.discountText && (
            <span className="font-semibold text-green-600 ml-1">
              ({stateDisplay.discountText})
            </span>
          )}
        </div>
      )}

      {/* Additional reason for grayed_out state */}
      {couponState === 'grayed_out' && couponReason && (
        <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
          {couponReason}
        </div>
      )}

      {/* Message when cart is empty */}
      {cartItems.length === 0 && (
        <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
          Adicione produtos ao carrinho para aplicar cupons de desconto.
        </div>
      )}
    </div>
  );
}

export default CouponInput;
import { useState, useCallback } from 'react';
import { clienteService } from '../services/api.js';

export const useCupom = () => {
  const [cupomAplicado, setCupomAplicado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [couponState, setCouponState] = useState('idle'); // 'idle', 'loading', 'active', 'grayed_out', 'inactive'
  const [couponReason, setCouponReason] = useState(null);
  const [couponDetails, setCouponDetails] = useState(null);

  const aplicarCupom = async (codigo, itensCarrinho, valorTotal) => {
    if (!codigo || !codigo.trim()) {
      setError('Digite o código do cupom');
      setCouponState('inactive');
      setCouponReason('Código do cupom é obrigatório');
      return false;
    }

    setLoading(true);
    setError(null);
    setCouponState('loading');

    try {
      const resultado = await clienteService.validarCupom(codigo, itensCarrinho, valorTotal);

      // Update state based on backend response
      setCouponState(resultado.state);
      setCouponReason(resultado.reason);
      setCouponDetails(resultado.coupon);

      if (resultado.state === 'active') {
        setCupomAplicado({
          codigo: resultado.coupon?.Codigo,
          nome: resultado.coupon?.Nome,
          descontoTipo: resultado.coupon?.DescontoTipo,
          descontoValor: resultado.coupon?.DescontoValor,
          desconto: resultado.discountDetails?.discountAmount || 0,
          valorFinal: resultado.discountDetails?.finalAmount || valorTotal,
          discountDetails: resultado.discountDetails
        });
        return true;
      } else {
        // For grayed_out and inactive states, don't apply the coupon but show the reason
        setCupomAplicado(null);
        setError(resultado.reason || 'Cupom não pode ser aplicado');
        return false;
      }
    } catch (err) {
      const mensagemErro = err.message || 'Erro ao aplicar cupom';
      setError(mensagemErro);
      setCouponState('inactive');
      setCouponReason(mensagemErro);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validarCupomEmTempoReal = useCallback(async (codigo, itensCarrinho, valorTotal) => {
    if (!codigo || !codigo.trim()) {
      setCouponState('idle');
      setCouponReason(null);
      setCouponDetails(null);
      return;
    }

    try {
      const resultado = await clienteService.validarCupom(codigo, itensCarrinho, valorTotal);

      setCouponState(resultado.state);
      setCouponReason(resultado.reason);
      setCouponDetails(resultado.coupon);

      // Update applied coupon if it's active
      if (resultado.state === 'active') {
        setCupomAplicado({
          codigo: resultado.coupon?.Codigo,
          nome: resultado.coupon?.Nome,
          descontoTipo: resultado.coupon?.DescontoTipo,
          descontoValor: resultado.coupon?.DescontoValor,
          desconto: resultado.discountDetails?.discountAmount || 0,
          valorFinal: resultado.discountDetails?.finalAmount || valorTotal,
          discountDetails: resultado.discountDetails
        });
      } else {
        setCupomAplicado(null);
      }
    } catch {
      setCouponState('inactive');
      setCouponReason('Erro ao validar cupom');
      setCouponDetails(null);
      setCupomAplicado(null);
    }
  }, []);

  const removerCupom = () => {
    setCupomAplicado(null);
    setError(null);
    setCouponState('idle');
    setCouponReason(null);
    setCouponDetails(null);
  };

  const limparErro = () => {
    setError(null);
  };

  return {
    cupomAplicado,
    loading,
    error,
    couponState,
    couponReason,
    couponDetails,
    aplicarCupom,
    validarCupomEmTempoReal,
    removerCupom,
    limparErro
  };
};

export default useCupom;
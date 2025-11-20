import { useState } from 'react';
import { clienteService } from '../services/api.js';

export const useCupom = () => {
  const [cupomAplicado, setCupomAplicado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const aplicarCupom = async (codigo, itensCarrinho, valorTotal) => {
    if (!codigo || !codigo.trim()) {
      setError('Digite o código do cupom');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const resultado = await clienteService.validarCupom(codigo, itensCarrinho, valorTotal);

      if (resultado.valido) {
        setCupomAplicado({
          codigo: resultado.cupom.Codigo,
          nome: resultado.cupom.Nome,
          descontoTipo: resultado.cupom.DescontoTipo,
          descontoValor: resultado.cupom.DescontoValor,
          desconto: resultado.desconto,
          valorFinal: resultado.valorFinal
        });
        return true;
      } else {
        setError(resultado.error || 'Cupom inválido');
        return false;
      }
    } catch (err) {
      const mensagemErro = err.message || 'Erro ao aplicar cupom';
      setError(mensagemErro);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removerCupom = () => {
    setCupomAplicado(null);
    setError(null);
  };

  const limparErro = () => {
    setError(null);
  };

  return {
    cupomAplicado,
    loading,
    error,
    aplicarCupom,
    removerCupom,
    limparErro
  };
};

export default useCupom;
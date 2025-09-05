import { useState, useCallback } from 'react';

export function useBuscarCep() {
  const [carregandoCep, setCarregandoCep] = useState(false);

  const buscarCep = useCallback(async (cepBruto) => {
    const cepLimpo = (cepBruto || '').replace(/\D/g, '');
    if (cepLimpo.length !== 8) return { erro: true };

    setCarregandoCep(true);
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await resposta.json();
      if (dados.erro) return { erro: true };
      return {
        erro: false,
        endereco: dados.logradouro,
        bairro: dados.bairro,
        cidade: dados.localidade,
        estado: dados.uf,
      };
    } catch {
      return { erro: true };
    } finally {
      setCarregandoCep(false);
    }
  }, []);

  return { buscarCep, carregandoCep };
}
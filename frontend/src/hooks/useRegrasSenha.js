import { useEffect, useState } from 'react';

export function useRegrasSenha(senha = '') {
  const [temComprimento, setTemComprimento] = useState(false);
  const [temMaiuscula, setTemMaiuscula] = useState(false);
  const [temMinuscula, setTemMinuscula] = useState(false);
  const [temNumero, setTemNumero] = useState(false);
  const [temEspecial, setTemEspecial] = useState(false);

  useEffect(() => {
    const senhaAtual = senha || '';
    setTemComprimento(senhaAtual.length >= 8);
    setTemMaiuscula(/[A-Z]/.test(senhaAtual));
    setTemMinuscula(/[a-z]/.test(senhaAtual));
    setTemNumero(/\d/.test(senhaAtual));
    setTemEspecial(/[^A-Za-z0-9]/.test(senhaAtual));
  }, [senha]);

  return { temComprimento, temMaiuscula, temMinuscula, temNumero, temEspecial };
}
import { baseUrl } from '../config/api';

export async function criarCliente(dadosCliente) {
  const resposta = await fetch(`${baseUrl}/clientes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dadosCliente),
  });

  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados.errors?.join('\n') || 'Erro ao cadastrar');
  }

  return dados;
}
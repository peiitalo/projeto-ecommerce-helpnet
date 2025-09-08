import { clienteService } from './api';

export async function criarCliente(dadosCliente) {
  return clienteService.cadastrar(dadosCliente);
}
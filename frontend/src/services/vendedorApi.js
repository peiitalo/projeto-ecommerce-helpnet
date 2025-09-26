// frontend/src/services/vendedorApi.js
import { apiRequest } from './api.js';

const vendedorApi = {
  // Listar vendedores
  listarVendedores: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/vendedor/vendedores?${queryString}`);
  },

  // Buscar vendedor específico
  buscarVendedor: (vendedorId) => {
    return apiRequest(`/vendedor/vendedores/${vendedorId}`);
  },

  // Criar novo vendedor
  criarVendedor: (dadosVendedor) => {
    return apiRequest('/vendedor/vendedores', {
      method: 'POST',
      body: JSON.stringify(dadosVendedor)
    });
  },

  // Atualizar vendedor
  atualizarVendedor: (vendedorId, dadosVendedor) => {
    return apiRequest(`/vendedor/vendedores/${vendedorId}`, {
      method: 'PUT',
      body: JSON.stringify(dadosVendedor)
    });
  },

  // Excluir vendedor
  excluirVendedor: (vendedorId) => {
    return apiRequest(`/vendedor/vendedores/${vendedorId}`, {
      method: 'DELETE'
    });
  },

  // Dashboard do vendedor
  dashboard: () => {
    return apiRequest('/vendedor/dashboard');
  },

  // Listar pedidos do vendedor (todos os pedidos de produtos da sua empresa)
  listarPedidos: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/vendedor/pedidos${queryString ? `?${queryString}` : ''}`);
  }
};

export default vendedorApi;
// frontend/src/services/clienteVendedorApi.js
import { apiRequest } from './api.js';

const clienteVendedorApi = {
  // Vendedor: listar clientes
  listarClientes: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/vendedor/clientes?${queryString}`);
  },

  // Vendedor: buscar cliente específico
  buscarCliente: (clienteId) => {
    return apiRequest(`/vendedor/clientes/${clienteId}`);
  },

  // Vendedor: obter estatísticas dos clientes
  obterEstatisticas: () => {
    return apiRequest('/vendedor/clientes/estatisticas');
  }
};

export default clienteVendedorApi;
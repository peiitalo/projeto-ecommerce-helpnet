// frontend/src/services/cupomApi.js
import { apiRequest } from './api.js';

// Serviços de Cupons para Vendedores
const cupomService = {
  // Listar cupons do vendedor
  listar: async (filtros = {}) => {
    const params = new URLSearchParams();

    if (filtros.status) params.append('status', filtros.status);
    if (filtros.busca) params.append('busca', filtros.busca);
    if (filtros.pagina) params.append('pagina', filtros.pagina);
    if (filtros.limit) params.append('limit', filtros.limit);

    const queryString = params.toString();
    const endpoint = `/vendedor/cupons${queryString ? `?${queryString}` : ''}`;

    return apiRequest(endpoint);
  },

  // Buscar cupom por ID
  buscarPorId: async (id) => {
    return apiRequest(`/vendedor/cupons/${id}`);
  },

  // Criar novo cupom
  criar: async (dadosCupom) => {
    return apiRequest('/vendedor/cupons', {
      method: 'POST',
      body: JSON.stringify(dadosCupom),
    });
  },

  // Atualizar cupom
  atualizar: async (id, dadosCupom) => {
    return apiRequest(`/vendedor/cupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dadosCupom),
    });
  },

  // Excluir cupom
  excluir: async (id) => {
    return apiRequest(`/vendedor/cupons/${id}`, {
      method: 'DELETE',
    });
  },

  // Ativar/desativar cupom
  toggleStatus: async (id) => {
    return apiRequest(`/vendedor/cupons/${id}/toggle-status`, {
      method: 'PATCH',
    });
  },

  // Listar clientes disponíveis para cupons específicos
  listarClientesDisponiveis: async () => {
    return apiRequest('/vendedor/cupons/clientes/disponiveis');
  },
};

export default cupomService;
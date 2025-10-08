// frontend/src/services/relatoriosApi.js
import { apiRequest } from './api.js';

const relatoriosApi = {
  // Obter estatísticas gerais
  obterEstatisticasGerais: (dateRange = '30d', category = 'all') => {
    return apiRequest(`/vendedor/relatorios/gerais?dateRange=${dateRange}&category=${category}`);
  },

  // Obter dados de vendas
  obterDadosVendas: (dateRange = '30d', category = 'all') => {
    return apiRequest(`/vendedor/relatorios/vendas?dateRange=${dateRange}&category=${category}`);
  },

  // Obter dados de clientes
  obterDadosClientes: (dateRange = '30d', category = 'all') => {
    return apiRequest(`/vendedor/relatorios/clientes?dateRange=${dateRange}&category=${category}`);
  },

  // Exportar relatório CSV
  exportarRelatorio: async (dateRange = '30d', category = 'all') => {
    const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL) || '/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const response = await fetch(`${API_BASE_URL}/vendedor/relatorios/export?dateRange=${dateRange}&category=${category}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const serverMsg = (Array.isArray(errorData.errors) && errorData.errors.join('\n')) || errorData.error || errorData.erro || errorData.message;
      throw new Error(serverMsg || `Erro HTTP: ${response.status}`);
    }

    return response.text();
  }
};

export default relatoriosApi;
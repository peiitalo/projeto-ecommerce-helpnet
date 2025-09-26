// frontend/src/services/relatoriosApi.js
import { apiRequest } from './api.js';

const relatoriosApi = {
  // Obter estatísticas gerais
  obterEstatisticasGerais: (dateRange = '30d') => {
    return apiRequest(`/vendedor/relatorios/gerais?dateRange=${dateRange}`);
  },

  // Obter dados de vendas
  obterDadosVendas: (dateRange = '30d') => {
    return apiRequest(`/vendedor/relatorios/vendas?dateRange=${dateRange}`);
  },

  // Obter dados de clientes
  obterDadosClientes: (dateRange = '30d') => {
    return apiRequest(`/vendedor/relatorios/clientes?dateRange=${dateRange}`);
  }
};

export default relatoriosApi;
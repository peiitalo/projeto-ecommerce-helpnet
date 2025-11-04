// frontend/src/services/parceriaApi.js
import { apiRequest } from './api.js';

// Serviços de Parcerias
export const parceriaApi = {
  // Listar parcerias ativas e pendentes
  listar: async () => {
    return apiRequest('/vendedor/parcerias');
  },

  // Enviar solicitação de parceria
  enviarSolicitacao: async (dados) => {
    return apiRequest('/vendedor/parcerias', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  },

  // Responder solicitação de parceria (aceitar/recusar)
  responderSolicitacao: async (parceriaId, acao) => {
    return apiRequest(`/vendedor/parcerias/${parceriaId}`, {
      method: 'PATCH',
      body: JSON.stringify({ acao }),
    });
  },

  // Encerrar parceria
  encerrar: async (parceriaId) => {
    return apiRequest(`/vendedor/parcerias/${parceriaId}`, {
      method: 'DELETE',
    });
  },

  // Listar produtos compartilhados
  listarProdutosCompartilhados: async () => {
    return apiRequest('/vendedor/parcerias/produtos-compartilhados');
  },
};

export default parceriaApi;
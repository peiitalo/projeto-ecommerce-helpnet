// frontend/src/services/adminApi.js
const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL) || '/api';

// Configuração base para fetch
const fetchConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
};

// Flag para evitar múltiplas tentativas de refresh simultâneas
let isRefreshing = false;
let refreshPromise = null;

// Função auxiliar para fazer requisições
const adminApiRequest = async (endpoint, options = {}, retryCount = 0) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...fetchConfig,
      ...options,
    };

    // Injeta Authorization se houver accessToken persistido
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminAccessToken') : null;
      if (token) {
        config.headers = {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        };
      }
    } catch {}

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const serverMsg = (Array.isArray(errorData.errors) && errorData.errors.join('\n')) || errorData.error || errorData.erro || errorData.message;

      throw new Error(serverMsg || `Erro HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na requisição admin:', error);
    throw error;
  }
};

// Serviços de Suporte Administrativo
export const adminSuporteService = {
  // Listar mensagens de suporte
  listarMensagens: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/suporte/mensagens${queryString ? `?${queryString}` : ''}`;
    return adminApiRequest(endpoint);
  },

  // Responder mensagem
  responderMensagem: async (messageId, resposta) => {
    return adminApiRequest(`/admin/suporte/mensagens/${messageId}/responder`, {
      method: 'PUT',
      body: JSON.stringify({ resposta }),
    });
  },

  // Marcar mensagem como resolvida
  marcarComoResolvida: async (messageId) => {
    return adminApiRequest(`/admin/suporte/mensagens/${messageId}/resolver`, {
      method: 'PUT',
    });
  },

  // Listar avaliações da plataforma
  listarAvaliacoes: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/suporte/avaliacoes${queryString ? `?${queryString}` : ''}`;
    return adminApiRequest(endpoint);
  },

  // Gerenciar exibição de avaliação
  gerenciarExibicaoAvaliacao: async (avaliacaoId, exibirSite) => {
    return adminApiRequest(`/admin/suporte/avaliacoes/${avaliacaoId}/exibicao`, {
      method: 'PUT',
      body: JSON.stringify({ exibirSite }),
    });
  },

  // Estatísticas do suporte
  estatisticas: async () => {
    return adminApiRequest('/admin/suporte/estatisticas');
  },
};

export default {
  adminSuporteService,
};
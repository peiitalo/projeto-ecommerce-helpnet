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

// Função auxiliar para validar token JWT
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch {
    return false;
  }
};

// Função auxiliar para renovar token
const refreshToken = async () => {
  try {
    const refreshResponse = await fetch(`${API_BASE_URL}/admin/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('Refresh token response:', refreshResponse.status, errorText);
      throw new Error(`Falha ao renovar token: ${refreshResponse.status}`);
    }

    const refreshData = await refreshResponse.json();

    // Atualiza o accessToken no localStorage se fornecido
    if (refreshData?.data?.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('accessToken', refreshData.data.accessToken);
      console.log('Token renovado com sucesso');
    }

    return refreshData;
  } catch (error) {
    console.error('Erro no refreshToken:', error);
    // Se refresh falhar, limpa o token expirado
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
    } catch (e) {
      console.error('Erro ao limpar token:', e);
    }
    throw error;
  }
};

// Função auxiliar para fazer requisições
const adminApiRequest = async (endpoint, options = {}, retryCount = 0) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...fetchConfig,
      ...options,
    };

    // Injeta Authorization se houver accessToken válido persistido
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminAccessToken') : null;
      if (token && isTokenValid(token)) {
        config.headers = {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        };
      } else if (token && !isTokenValid(token)) {
        // Token expirado, remove do localStorage
        localStorage.removeItem('adminAccessToken');
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
    }

    const response = await fetch(url, config);

    // Se receber 401 e ainda não tentou refresh, tenta renovar o token
    if (response.status === 401 && retryCount === 0) {
      try {
        // Evita múltiplas tentativas simultâneas
        if (isRefreshing) {
          await refreshPromise;
        } else {
          isRefreshing = true;
          refreshPromise = refreshToken();
          await refreshPromise;
          isRefreshing = false;
          refreshPromise = null;
        }

        // Retry com novo token
        return adminApiRequest(endpoint, options, retryCount + 1);
      } catch (refreshError) {
        console.error('Erro ao renovar token:', refreshError);
        // Se refresh falhar, limpa tokens e redireciona para login
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('adminAccessToken');
            // Redirecionar para login admin se estiver em página protegida
            if (window.location.pathname.startsWith('/admin')) {
              window.location.href = '/admin/login';
            }
          }
        } catch (error) {
          console.error('Erro ao limpar token:', error);
        }
        throw new Error('Sessão expirada. Faça login novamente.');
      }
    }

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
    return adminApiRequest(`/admin/suporte/avaliacoes/${avaliacaoId}/visibilidade`, {
      method: 'PUT',
      body: JSON.stringify({ visivel: exibirSite, tipo: 'plataforma' }),
    });
  },

  // Estatísticas do suporte
  estatisticas: async () => {
    return adminApiRequest('/admin/suporte/estatisticas');
  },
};

export const adminService = {
  // Login para administradores
  login: async (email, password) => {
    return adminApiRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Listar pedidos
  listarPedidos: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/pedidos${queryString ? `?${queryString}` : ''}`;
    return adminApiRequest(endpoint);
  },

  // Atualizar status do pedido
  atualizarStatusPedido: async (pedidoId, data) => {
    return adminApiRequest(`/admin/pedidos/${pedidoId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

export default {
  adminSuporteService,
  adminService,
};
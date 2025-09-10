const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL) || ((typeof window !== 'undefined' && window?.location) ? `${window.location.protocol}//${window.location.hostname}:${3001}/api` : 'http://localhost:3001/api');
const withEmpresaHeader = (empresaId, options = {}) => ({
  ...options,
  headers: {
    ...(options.headers || {}),
    ...fetchConfig.headers,
    'X-Empresa-ID': String(empresaId),
  },
});

// Configuração base para fetch
const fetchConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // necessário para enviar/receber cookies (refresh)
};

// Função auxiliar para fazer requisições
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...fetchConfig,
      ...options,
    };

    // Injeta Authorization se houver accessToken persistido
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
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
    console.error('Erro na requisição:', error);
    throw error;
  }
};

// Serviços de Produtos
export const produtoService = {
  // Listar produtos
  listar: async (filtros = {}) => {
    const params = new URLSearchParams();
    
    if (filtros.categoria) params.append('categoria', filtros.categoria);
    if (filtros.status) params.append('status', filtros.status);
    if (filtros.busca) params.append('busca', filtros.busca);
    if (filtros.page || filtros.pagina) params.append('pagina', filtros.pagina || filtros.page);
    if (filtros.limit) params.append('limit', filtros.limit);

    const queryString = params.toString();
    const endpoint = `/produtos${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest(endpoint);
  },

  // Buscar produto por ID
  buscarPorId: async (id) => {
    return apiRequest(`/produtos/${id}`);
  },

  // Criar produto
  criar: async (dadosProduto) => {
    return apiRequest('/produtos', {
      method: 'POST',
      body: JSON.stringify(dadosProduto),
    });
  },

  // Atualizar produto
  atualizar: async (id, dadosProduto) => {
    return apiRequest(`/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dadosProduto),
    });
  },

  // Excluir produto
  excluir: async (id) => {
    return apiRequest(`/produtos/${id}`, {
      method: 'DELETE',
    });
  },

  // Ação em lote
  acaoEmLote: async (acao, produtoIds) => {
    return apiRequest('/produtos/acao-lote', {
      method: 'POST',
      body: JSON.stringify({ acao, produtoIds }),
    });
  },

  // Gerar SKU único
  gerarSKU: async () => {
    return apiRequest('/produtos/gerar/sku');
  },

  // Vendedor (escopado por empresa)
  listarVendedor: async (empresaId, filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.categoria) params.append('categoria', filtros.categoria);
    if (filtros.status) params.append('status', filtros.status);
    if (filtros.busca) params.append('busca', filtros.busca);
    if (filtros.pagina) params.append('pagina', filtros.pagina);
    if (filtros.limit) params.append('limit', filtros.limit);
    const qs = params.toString();
    return apiRequest(`/vendedor/produtos${qs ? `?${qs}` : ''}`, withEmpresaHeader(empresaId));
  },
  criarVendedor: async (empresaId, dados) => {
    return apiRequest('/vendedor/produtos', withEmpresaHeader(empresaId, { method: 'POST', body: JSON.stringify(dados) }));
  },
  atualizarVendedor: async (empresaId, id, dados) => {
    return apiRequest(`/vendedor/produtos/${id}`, withEmpresaHeader(empresaId, { method: 'PUT', body: JSON.stringify(dados) }));
  },
  excluirVendedor: async (empresaId, id) => {
    return apiRequest(`/vendedor/produtos/${id}`, withEmpresaHeader(empresaId, { method: 'DELETE' }));
  },
};

// Serviços de Categorias
export const categoriaService = {
  // Listar categorias
  listar: async () => {
    return apiRequest('/categorias');
  },

  // Buscar categoria por ID
  buscarPorId: async (id) => {
    return apiRequest(`/categorias/${id}`);
  },

  // Criar categoria
  criar: async (dadosCategoria) => {
    return apiRequest('/categorias', {
      method: 'POST',
      body: JSON.stringify(dadosCategoria),
    });
  },

  // Atualizar categoria
  atualizar: async (id, dadosCategoria) => {
    return apiRequest(`/categorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dadosCategoria),
    });
  },

  // Excluir categoria
  excluir: async (id) => {
    return apiRequest(`/categorias/${id}`, {
      method: 'DELETE',
    });
  },
};

// Serviços de Clientes (já existente, mantendo compatibilidade)
export const clienteService = {
  // Cadastrar cliente
  cadastrar: async (dadosCliente) => {
    return apiRequest('/clientes/cadastro', {
      method: 'POST',
      body: JSON.stringify(dadosCliente),
    });
  },

  // Login cliente
  login: async (email, senha) => {
    const resp = await apiRequest('/clientes/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
    try {
      const at = resp?.data?.accessToken;
      if (at && typeof window !== 'undefined') localStorage.setItem('accessToken', at);
    } catch {}
    return resp;
  },

  // Refresh token -> obtém novo access via cookie httpOnly
  refresh: async () => {
    const resp = await apiRequest('/clientes/refresh', { method: 'POST' });
    try {
      const at = resp?.data?.accessToken;
      if (at && typeof window !== 'undefined') localStorage.setItem('accessToken', at);
    } catch {}
    return resp;
  },

  // Auto-login usando access atual (ou após refresh)
  autoLogin: async () => {
    // tenta refresh antes
    try { await apiRequest('/clientes/refresh', { method: 'POST' }); } catch {}
    const resp = await apiRequest('/clientes/auto-login');
    try {
      const at = resp?.data?.accessToken;
      if (at && typeof window !== 'undefined') localStorage.setItem('accessToken', at);
    } catch {}
    return resp;
  },

  // Logout: limpa refresh cookie e access local
  logout: async () => {
    try { if (typeof window !== 'undefined') localStorage.removeItem('accessToken'); } catch {}
    return apiRequest('/clientes/logout', { method: 'POST' });
  },
};

export default {
  produtoService,
  categoriaService,
  clienteService,
};
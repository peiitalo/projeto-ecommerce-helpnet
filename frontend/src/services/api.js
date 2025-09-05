const API_BASE_URL = 'http://localhost:3001/api';

// Configuração base para fetch
const fetchConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Função auxiliar para fazer requisições
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...fetchConfig,
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || `Erro HTTP: ${response.status}`);
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
    if (filtros.page) params.append('page', filtros.page);
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
    return apiRequest('/clientes/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
  },
};

export default {
  produtoService,
  categoriaService,
  clienteService,
};
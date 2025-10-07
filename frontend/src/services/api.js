const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL) || '/api';
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

// Flag para evitar múltiplas tentativas de refresh simultâneas
let isRefreshing = false;
let refreshPromise = null;

// Função auxiliar para fazer requisições
const apiRequest = async (endpoint, options = {}, retryCount = 0) => {
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
        return apiRequest(endpoint, options, retryCount + 1);
      } catch (refreshError) {
        console.error('Erro ao renovar token:', refreshError);
        // Se refresh falhar, continua com o erro original
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const serverMsg = (Array.isArray(errorData.errors) && errorData.errors.join('\n')) || errorData.error || errorData.erro || errorData.message;

      // Feedback visual para erros de permissão
      if (response.status === 403) {
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Você não tem permissão para acessar esses dados.');
        }
      }

      throw new Error(serverMsg || `Erro HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
};

// Função auxiliar para renovar token
const refreshToken = async () => {
  try {
    const refreshResponse = await fetch(`${API_BASE_URL}/clientes/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!refreshResponse.ok) {
      throw new Error('Falha ao renovar token');
    }

    const refreshData = await refreshResponse.json();

    // Atualiza o accessToken no localStorage se fornecido
    if (refreshData?.data?.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('accessToken', refreshData.data.accessToken);
    }

    return refreshData;
  } catch (error) {
    // Se refresh falhar, limpa o token expirado
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
    } catch {}
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
    if (filtros.precoMin !== undefined) params.append('precoMin', filtros.precoMin);
    if (filtros.precoMax !== undefined) params.append('precoMax', filtros.precoMax);
    if (filtros.estoqueMin !== undefined) params.append('estoqueMin', filtros.estoqueMin);
    if (filtros.estoqueMax !== undefined) params.append('estoqueMax', filtros.estoqueMax);

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
  acaoEmLoteVendedor: async (empresaId, dados) => {
    return apiRequest('/vendedor/produtos/acao-em-lote', withEmpresaHeader(empresaId, { method: 'POST', body: JSON.stringify(dados) }));
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

  // Buscar perfil do cliente
  buscarPerfil: async () => {
    return apiRequest('/clientes/perfil');
  },

  // Listar endereços do cliente
  listarEnderecos: async () => {
    return apiRequest('/clientes/enderecos');
  },

  // Criar endereço
  criarEndereco: async (dadosEndereco) => {
    return apiRequest('/clientes/enderecos', {
      method: 'POST',
      body: JSON.stringify(dadosEndereco),
    });
  },

  // Atualizar endereço
  atualizarEndereco: async (enderecoId, dadosEndereco) => {
    return apiRequest(`/clientes/enderecos/${enderecoId}`, {
      method: 'PUT',
      body: JSON.stringify(dadosEndereco),
    });
  },

  // Excluir endereço
  excluirEndereco: async (enderecoId) => {
    return apiRequest(`/clientes/enderecos/${enderecoId}`, {
      method: 'DELETE',
    });
  },

  // Definir endereço padrão
  definirEnderecoPadrao: async (enderecoId) => {
    return apiRequest(`/clientes/enderecos/${enderecoId}/padrao`, {
      method: 'PUT',
    });
  },

  // Atualizar perfil do cliente
  atualizarPerfil: async (dadosPerfil) => {
    return apiRequest('/clientes/perfil', {
      method: 'PUT',
      body: JSON.stringify(dadosPerfil),
    });
  },

  // Validar senha atual do cliente
  validarSenhaAtual: async (senhaAtual) => {
    return apiRequest('/clientes/validar-senha-atual', {
      method: 'POST',
      body: JSON.stringify({ senhaAtual }),
    });
  },

  // Alterar senha do cliente
  alterarSenha: async (dadosSenha) => {
    return apiRequest('/clientes/alterar-senha', {
      method: 'PUT',
      body: JSON.stringify(dadosSenha),
    });
  },

  // Listar pedidos do cliente
  listarPedidos: async () => {
    return apiRequest('/pedidos');
  },

  // Criar pedido
  criarPedido: async (dadosPedido) => {
    return apiRequest('/pedidos', {
      method: 'POST',
      body: JSON.stringify(dadosPedido),
    });
  },

  // Solicitar reset de senha
  solicitarResetSenha: async (email) => {
    return apiRequest('/clientes/solicitar-reset-senha', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Resetar senha
  resetarSenha: async (token, novaSenha) => {
    return apiRequest('/clientes/resetar-senha', {
      method: 'POST',
      body: JSON.stringify({ token, novaSenha }),
    });
  },
};

// Serviços de Favoritos
export const favoritoService = {
  // Listar favoritos
  listar: async () => {
    return apiRequest('/favoritos');
  },

  // Adicionar favorito
  adicionar: async (produtoId) => {
    return apiRequest('/favoritos', {
      method: 'POST',
      body: JSON.stringify({ produtoId }),
    });
  },

  // Remover favorito
  remover: async (produtoId) => {
    return apiRequest(`/favoritos/${produtoId}`, {
      method: 'DELETE',
    });
  },
};

// Serviços de Frete
export const freteService = {
  // Calcular frete
  calcular: async (clienteId, enderecoId, produtoIds) => {
    return apiRequest('/frete/calcular', {
      method: 'POST',
      body: JSON.stringify({
        clienteId: parseInt(clienteId),
        enderecoId: parseInt(enderecoId),
        produtoIds: produtoIds.map(id => parseInt(id))
      }),
    });
  },
};

// Serviços de Carrinho
export const carrinhoService = {
  // Listar itens do carrinho
  listar: async () => {
    return apiRequest('/carrinho');
  },

  // Adicionar item ao carrinho
  adicionar: async (produtoId, quantidade = 1) => {
    return apiRequest('/carrinho', {
      method: 'POST',
      body: JSON.stringify({
        produtoId: parseInt(produtoId),
        quantidade: parseInt(quantidade || 1)
      }),
    });
  },

  // Atualizar quantidade de um item
  atualizar: async (produtoId, quantidade) => {
    return apiRequest(`/carrinho/produto/${parseInt(produtoId)}`, {
      method: 'PUT',
      body: JSON.stringify({ quantidade: parseInt(quantidade) }),
    });
  },

  // Remover item do carrinho
  remover: async (produtoId) => {
    return apiRequest(`/carrinho/produto/${parseInt(produtoId)}`, {
      method: 'DELETE',
    });
  },

  // Limpar carrinho
  limpar: async () => {
    return apiRequest('/carrinho', {
      method: 'DELETE',
    });
  },
};

// Serviços de Avaliações
export const avaliacaoService = {
  // Listar avaliações de um produto
  listarPorProduto: async (produtoId) => {
    return apiRequest(`/avaliacoes/produto/${produtoId}`);
  },

  // Buscar avaliação do usuário atual para um produto
  minhaDoProduto: async (produtoId) => {
    return apiRequest(`/avaliacoes/produto/${produtoId}/minha`);
  },

  // Avaliar produto
  avaliar: async (produtoId, nota, comentario = null) => {
    return apiRequest(`/avaliacoes/produto/${produtoId}`, {
      method: 'POST',
      body: JSON.stringify({ nota: parseInt(nota), comentario }),
    });
  },

  // Remover avaliação
  remover: async (produtoId) => {
    return apiRequest(`/avaliacoes/produto/${produtoId}`, {
      method: 'DELETE',
    });
  },
};

// Serviços de Notificações
export const notificacaoService = {
  // Listar notificações do cliente
  listarCliente: async () => {
    return apiRequest('/notificacoes/cliente');
  },

  // Listar notificações do vendedor
  listarVendedor: async () => {
    return apiRequest('/notificacoes/vendedor');
  },

  // Criar notificação para clientes específicos
  criarParaClientes: async (titulo, mensagem, tipo, clienteIds) => {
    return apiRequest('/notificacoes/vendedor/clientes', {
      method: 'POST',
      body: JSON.stringify({
        titulo,
        mensagem,
        tipo: tipo || 'info',
        clienteIds
      }),
    });
  },

  // Criar notificação para todos os clientes
  criarParaTodos: async (titulo, mensagem, tipo) => {
    return apiRequest('/notificacoes/vendedor/todos', {
      method: 'POST',
      body: JSON.stringify({
        titulo,
        mensagem,
        tipo: tipo || 'info'
      }),
    });
  },

  // Marcar notificação como lida
  marcarComoLida: async (id) => {
    return apiRequest(`/notificacoes/${id}/lida`, {
      method: 'PUT',
    });
  },

  // Marcar todas as notificações como lidas
  marcarTodasComoLidas: async () => {
    return apiRequest('/notificacoes/cliente/lidas', {
      method: 'PUT',
    });
  },

  // Marcar todas as notificações do vendedor como lidas
  marcarTodasVendedorComoLidas: async () => {
    return apiRequest('/notificacoes/vendedor/lidas', {
      method: 'PUT',
    });
  },

  // Buscar clientes do vendedor
  buscarClientesVendedor: async () => {
    return apiRequest('/notificacoes/vendedor/clientes');
  },
};

// Serviços de Vendedor
export const vendedorService = {
  // Dashboard do vendedor
  dashboard: async () => {
    return apiRequest('/vendedor/dashboard');
  },
};

// Serviços Públicos (Landing Page)
export const publicService = {
  // Obter estatísticas públicas
  obterStats: async () => {
    return apiRequest('/public/stats');
  },

  // Obter depoimentos
  obterDepoimentos: async () => {
    return apiRequest('/public/testimonials');
  },
};

export default {
  produtoService,
  categoriaService,
  clienteService,
  favoritoService,
  freteService,
  carrinhoService,
  notificacaoService,
  avaliacaoService,
};

// Exportar função apiRequest para uso em outros módulos
export { apiRequest };

// Importar e exportar os novos serviços
export { default as entregaApi } from './entregaApi.js';
export { default as clienteVendedorApi } from './clienteVendedorApi.js';
export { default as vendedorApi } from './vendedorApi.js';
export { default as relatoriosApi } from './relatoriosApi.js';

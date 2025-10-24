import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCounters } from '../../context/CountersContext';
import { clienteService, produtoService } from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import { buildImageUrl } from '../../utils/imageUtils';
import {
  FiUser,
  FiBell,
  FiShield,
  FiSave,
  FiSettings,
  FiLogOut,
  FiX,
  FiMenu,
  FiSearch,
  FiPackage,
  FiClock,
  FiCreditCard,
  FiMapPin,
  FiHelpCircle,
  FiStar,
  FiTrash2
} from 'react-icons/fi';
import { FaShoppingCart, FaHeart, FaBell, FaUser, FaSignOutAlt } from 'react-icons/fa';

function ConfiguracoesPage() {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const { favoritesCount, notificationsCount, cartCount } = useCounters();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('conta');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados do perfil
  const [perfil, setPerfil] = useState({
    nome: '',
    email: '',
    telefone: '',
    dataNascimento: '',
    cpf: '',
    genero: ''
  });

  // Estados da senha
  const [senhas, setSenhas] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });

  // Estados das notificações
  const [notificacoes, setNotificacoes] = useState({
    emailPedidos: true,
    emailPromocoes: false
  });

  // Estados da privacidade
  const [privacidade, setPrivacidade] = useState({
    compartilharDados: false,
    cookies: true
  });

  useEffect(() => {
    carregarDadosUsuario();
  }, []);

  const carregarDadosUsuario = async () => {
    try {
      setLoading(true);
      const response = await clienteService.buscarPerfil();
      const dados = response.cliente || response.data || response;
      
      setPerfil({
        nome: dados.nome || '',
        email: dados.email || '',
        telefone: dados.telefone || '',
        dataNascimento: dados.dataNascimento ? dados.dataNascimento.split('T')[0] : '',
        cpf: dados.cpf || '',
        genero: dados.genero || ''
      });

      // Carregar preferências de notificação (simulado)
      setNotificacoes({
        emailPromocoes: dados.emailPromocoes ?? true,
        emailPedidos: dados.emailPedidos ?? true,
        emailNewsletter: dados.emailNewsletter ?? false,
        pushPromocoes: dados.pushPromocoes ?? true,
        pushPedidos: dados.pushPedidos ?? true,
        smsPromocoes: dados.smsPromocoes ?? false,
        smsPedidos: dados.smsPedidos ?? true
      });

      setPrivacidade({
        perfilPublico: dados.perfilPublico ?? false,
        compartilharDados: dados.compartilharDados ?? false,
        cookies: dados.cookies ?? true,
        analytics: dados.analytics ?? true
      });

    } catch (error) {
      showError('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const salvarPerfil = async () => {
    try {
      setLoading(true);
      await clienteService.atualizarPerfil(perfil);
      showSuccess('Perfil atualizado com sucesso!');
    } catch (error) {
      showError(error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const alterarSenha = async () => {
    if (senhas.novaSenha !== senhas.confirmarSenha) {
      showError('As senhas não coincidem');
      return;
    }

    if (senhas.novaSenha.length < 6) {
      showError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      await clienteService.alterarSenha({
        senhaAtual: senhas.senhaAtual,
        novaSenha: senhas.novaSenha
      });
      
      setSenhas({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
      showSuccess('Senha alterada com sucesso!');
    } catch (error) {
      showError(error.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracoes = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('Configurações salvas com sucesso!');
    } catch (error) {
      showError('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const clienteMenu = [
    { label: 'Explore', to: '/explorer', icon: <FiSearch className="text-slate-500" /> },
    { label: 'Pedidos', to: '/meus-pedidos', icon: <FiPackage className="text-slate-500" /> },
    { label: 'Histórico', to: '/historico', icon: <FiClock className="text-slate-500" /> },
    { label: 'Meus Cupons', to: '/cupons', icon: <FiCreditCard className="text-slate-500" /> },
    { label: 'Endereços', to: '/enderecos', icon: <FiMapPin className="text-slate-500" /> },
    { label: 'Suporte', to: '/suporte', icon: <FiHelpCircle className="text-slate-500" /> },
    { label: 'Configurações', to: '/configuracoes', icon: <FiSettings className="text-slate-500" /> },
  ];

  const tabs = [
    { id: 'conta', label: 'Conta', icon: <FiUser /> },
    { id: 'notificacoes', label: 'Notificações', icon: <FiBell /> },
    { id: 'avaliacoes', label: 'Avaliações', icon: <FiStar /> },
    { id: 'privacidade', label: 'Privacidade', icon: <FiShield /> }
  ];

  // Estados para avaliações
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loadingAvaliacoes, setLoadingAvaliacoes] = useState(false);


  // Carregar avaliações do cliente
  const carregarAvaliacoes = async () => {
    try {
      setLoadingAvaliacoes(true);
      // Buscar avaliações reais do cliente logado
      const response = await clienteService.buscarAvaliacoes();
      const avaliacoesData = response.avaliacoes || [];
      
      // Mapear avaliações para o formato esperado
      const avaliacoesMapeadas = avaliacoesData.map(avaliacao => ({
        id: avaliacao.AvaliacaoID || avaliacao.id,
        produto: {
          id: avaliacao.produto?.ProdutoID || avaliacao.produtoId,
          nome: avaliacao.produto?.Nome || avaliacao.produtoNome,
          imagem: avaliacao.produto?.Imagens?.[0] ? buildImageUrl(avaliacao.produto.Imagens[0]) : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=400&auto=format&fit=crop'
        },
        nota: avaliacao.Nota || avaliacao.nota,
        comentario: avaliacao.Comentario || avaliacao.comentario,
        data: avaliacao.DataCriacao || avaliacao.data
      }));
      
      setAvaliacoes(avaliacoesMapeadas);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      setAvaliacoes([]);
    } finally {
      setLoadingAvaliacoes(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'avaliacoes') {
      carregarAvaliacoes();
    }
  }, [activeTab]);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FiStar
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Overlay Mobile da sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Mobile (Drawer) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo-vertical.png" alt="HelpNet Logo" className="h-8 w-auto" />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200"
          >
            <FiX />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Navegação</p>
          {clienteMenu.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                item.to === '/configuracoes'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200'
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
          >
            <FaSignOutAlt />
            <span className="text-sm font-medium">Excluir Conta</span>
          </button>
        </div>
      </div>

      {/* Sidebar Desktop (fixa e sempre aberta) */}
      <aside className="hidden md:flex md:w-72 bg-white border-r border-slate-200 flex-col fixed h-screen">
        <div className="h-16 px-6 border-b border-slate-200 flex items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <img src="/logo-vertical.png" alt="HelpNet Logo" className="h-8 w-auto" />
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Navegação</p>
          {clienteMenu.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                item.to === '/configuracoes'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200'
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
          >
            <FaSignOutAlt />
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col md:ml-72">
        {/* Header */}
        <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 h-16">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200"
              >
                <FiMenu />
              </button>
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <img src="/logo-horizontal.png" alt="HelpNet Logo" className="h-6 w-auto" />
              </div>
              <div className="md:hidden shrink-0">
                <img src="/logo-horizontal.png" alt="HelpNet Logo" className="h-6 w-auto" />
              </div>

              {/* Ícones de ação */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Link to="/favoritos" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <FaHeart />
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">{favoritesCount}</span>
                  )}
                </Link>
                <Link to="/notificacoes" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <FaBell />
                  {notificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">{notificationsCount}</span>
                  )}
                </Link>
                <Link to="/carrinho" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <FaShoppingCart />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">{cartCount}</span>
                  )}
                </Link>
                <Link to="/perfil" className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">
                  <FaUser />
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Configurações</h1>
              <p className="text-slate-600 mt-1">Gerencie suas preferências da conta</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Tabs Sidebar */}
              <div className="lg:col-span-1">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {tab.icon}
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              {/* Tab: Conta */}
              {activeTab === 'conta' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Informações da Conta</h2>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Nome:</span>
                          <span className="ml-2 font-medium">{user?.nome || 'Usuário'}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">E-mail:</span>
                          <span className="ml-2 font-medium">{user?.email || 'email@exemplo.com'}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Status:</span>
                          <span className="ml-2 text-green-600 font-medium">Ativo</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Membro desde:</span>
                          <span className="ml-2 font-medium">{user?.dataCriacao ? new Date(user.dataCriacao).toLocaleDateString('pt-BR') : 'Janeiro 2024'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                    <h3 className="text-lg font-semibold text-red-900 mb-3">Excluir Conta</h3>
                    <div className="mb-4">
                      <p className="text-sm text-red-800 mb-3">
                        Esta ação é <strong>irreversível</strong>. Todos os seus dados serão permanentemente removidos.
                      </p>
                      <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-800">
                          <strong>Atenção:</strong> Após a exclusão, não será possível recuperar sua conta ou dados.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita e todos os seus dados serão permanentemente removidos.')) {
                          showSuccess('Solicitação de exclusão enviada. Nossa equipe entrará em contato em até 48 horas.');
                        }
                      }}
                      className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium transition-colors"
                    >
                      <FiX />
                      Excluir Conta
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Notificações */}
              {activeTab === 'notificacoes' && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-6">Notificações por E-mail</h2>
                  
                  <div className="space-y-6">
                    {[
                      { key: 'emailPedidos', label: 'Atualizações de pedidos', desc: 'Receba confirmações, envios e entregas' },
                      { key: 'emailPromocoes', label: 'Ofertas e promoções', desc: 'Descontos exclusivos e novidades' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-start justify-between p-4 border border-slate-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-slate-900">{item.label}</h4>
                          <p className="text-sm text-slate-600">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificacoes[item.key]}
                            onChange={(e) => setNotificacoes(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={salvarConfiguracoes}
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <FiSave />
                      {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Avaliações */}
              {activeTab === 'avaliacoes' && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-6">Minhas Avaliações</h2>
                  
                  {loadingAvaliacoes ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-slate-600 mt-2">Carregando avaliações...</p>
                    </div>
                  ) : avaliacoes.length > 0 ? (
                    <div className="space-y-6">
                      {avaliacoes.map((avaliacao) => (
                        <div key={avaliacao.id} className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                          <div className="flex gap-4 mb-4">
                            <Link to={`/produto/${avaliacao.produto.id}`} className="flex-shrink-0">
                              <img
                                src={avaliacao.produto.imagem}
                                alt={avaliacao.produto.nome}
                                className="w-20 h-20 object-cover rounded-lg hover:opacity-80 transition-opacity"
                              />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link 
                                to={`/produto/${avaliacao.produto.id}`}
                                className="font-medium text-slate-900 hover:text-blue-700 transition-colors block mb-2"
                              >
                                {avaliacao.produto.nome}
                              </Link>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="flex">
                                  {renderStars(avaliacao.nota)}
                                </div>
                                <span className="text-sm font-medium text-slate-700">({avaliacao.nota}/5)</span>
                                <span className="text-sm text-slate-500">•</span>
                                <span className="text-sm text-slate-500">{new Date(avaliacao.data).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                            <p className="text-slate-800 leading-relaxed">{avaliacao.comentario}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-slate-400 mb-4">
                        <FiStar className="w-12 h-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma avaliação ainda</h3>
                      <p className="text-slate-600 mb-4">Você ainda não avaliou nenhum produto.</p>
                      <Link
                        to="/meus-pedidos"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Ver Pedidos
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Privacidade */}
              {activeTab === 'privacidade' && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-6">Privacidade</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-base font-medium text-slate-900 mb-4">Dados</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">Compartilhar dados para melhorias</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={privacidade.compartilharDados}
                              onChange={(e) => setPrivacidade(prev => ({ ...prev, compartilharDados: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-medium text-slate-900 mb-4">Cookies</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">Cookies funcionais</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={privacidade.cookies}
                              disabled
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 opacity-50 cursor-not-allowed"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={salvarConfiguracoes}
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <FiSave />
                      {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              )}


                </div>
              </div>
            </div>
          </div>
        </main>



        {/* Footer simples */}
        <footer className="bg-slate-900 text-slate-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm">© {new Date().getFullYear()} HelpNet. Todos os direitos reservados.</p>
              <div className="flex items-center gap-5 text-sm">
                <Link to="/termos" className="hover:text-white">Termos</Link>
                <Link to="/privacidade" className="hover:text-white">Privacidade</Link>
                <Link to="/contato" className="hover:text-white">Contato</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default ConfiguracoesPage;
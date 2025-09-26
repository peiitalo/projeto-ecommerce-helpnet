import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { clienteService } from '../../services/api';
import apiCache from '../../utils/cache';
import {
  FaUser,
  FaShoppingCart,
  FaHeart,
  FaBell,
  FaSignOutAlt,
  FaEdit,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaCalendarAlt,
  FaBuilding,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiX,
  FiPackage,
  FiTag,
  FiCreditCard,
  FiMapPin,
  FiHelpCircle,
  FiSettings,
  FiClock
} from 'react-icons/fi';

function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [currentPasswordValid, setCurrentPasswordValid] = useState(null);
  const [saving, setSaving] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Logo configuration
  const logoConfig = {
    useImage: true,
    imageUrl: '/logo-vertical.png',
    altText: 'HelpNet Logo',
    textLogo: 'HelpNet'
  };

  // Menu lateral do cliente
  const clienteMenu = [
    { label: 'Explore', to: '/explorer', icon: <FiSearch className="text-slate-500" /> },
    { label: 'Pedidos', to: '/meus-pedidos', icon: <FiPackage className="text-slate-500" /> },
    { label: 'Histórico', to: '/historico', icon: <FiClock className="text-slate-500" /> },
    { label: 'Categorias', to: '/categorias', icon: <FiTag className="text-slate-500" /> },
    { label: 'Meus Cupons', to: '/cupons', icon: <FiCreditCard className="text-slate-500" /> },
    { label: 'Endereços', to: '/enderecos', icon: <FiMapPin className="text-slate-500" /> },
    { label: 'Suporte', to: '/suporte', icon: <FiHelpCircle className="text-slate-500" /> },
    { label: 'Configurações', to: '/configuracoes', icon: <FiSettings className="text-slate-500" /> },
  ];

  // Carregar dados do perfil
  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    const cacheKey = `profile_${user?.id}`;

    // Check cache first
    const cachedProfile = apiCache.get(cacheKey);
    if (cachedProfile) {
      setProfileData(cachedProfile);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await clienteService.buscarPerfil();
      const profileData = response.cliente || response;
      setProfileData(profileData);
      // Cache profile for 10 minutes
      apiCache.set(cacheKey, profileData, 10 * 60 * 1000);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setError('Erro ao carregar dados do perfil');
      // Fallback com dados do contexto
      if (user) {
        setProfileData({
          ClienteID: user.id,
          CodigoCliente: user.id,
          NomeCompleto: user.nome,
          Email: user.email,
          DataCadastro: new Date().toISOString(),
          CPF_CNPJ: '***.***.***-**',
          TelefoneCelular: '(**) *****-****',
          enderecos: []
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair da conta?')) {
      logout();
      navigate('/login');
    }
  };

  const handleEditClick = () => {
    setEditForm({
      NomeCompleto: profileData?.NomeCompleto || '',
      Email: profileData?.Email || '',
      TelefoneCelular: profileData?.TelefoneCelular || '',
      TelefoneFixo: profileData?.TelefoneFixo || '',
      Whatsapp: profileData?.Whatsapp || '',
      RazaoSocial: profileData?.RazaoSocial || '',
      InscricaoEstadual: profileData?.InscricaoEstadual || '',
      InscricaoMunicipal: profileData?.InscricaoMunicipal || ''
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await clienteService.atualizarPerfil(editForm);
      // Reload profile data
      const response = await clienteService.buscarPerfil();
      setProfileData(response.cliente || response);
      setIsEditing(false);
      setEditForm({});
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      // Show more specific error messages
      if (error.errors && Array.isArray(error.errors)) {
        alert('Erro ao salvar perfil:\n' + error.errors.join('\n'));
      } else if (error.message) {
        alert('Erro ao salvar perfil: ' + error.message);
      } else {
        alert('Erro ao salvar perfil. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePasswordClick = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(true);
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordVisibility({
      current: false,
      new: false,
      confirm: false
    });
    setCurrentPasswordValid(null);
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateCurrentPassword = async (password) => {
    if (!password || password.length < 1) {
      setCurrentPasswordValid(null);
      return;
    }

    try {
      const response = await clienteService.validarSenhaAtual(password);
      setCurrentPasswordValid(response.valida);
    } catch (error) {
      setCurrentPasswordValid(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPasswordValid) {
      alert('A senha atual está incorreta');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      alert('A nova senha deve ter pelo menos 8 caracteres');
      return;
    }

    try {
      setSaving(true);
      await clienteService.alterarSenha({
        senhaAtual: passwordForm.currentPassword,
        novaSenha: passwordForm.newPassword
      });
      alert('Senha alterada com sucesso!');
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setCurrentPasswordValid(null);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      if (error.errors && Array.isArray(error.errors)) {
        alert('Erro ao alterar senha:\n' + error.errors.join('\n'));
      } else {
        alert('Erro ao alterar senha: ' + (error.message || 'Erro desconhecido'));
      }
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    // Formatação básica - pode ser melhorada
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatCPF = (cpf) => {
    if (!cpf) return 'N/A';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={carregarPerfil}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

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
             {logoConfig.useImage ? (
               <img
                 src={logoConfig.imageUrl}
                 alt={logoConfig.altText}
                 className="h-8 w-auto"
               />
             ) : (
               <span className="text-lg font-semibold text-blue-700">{logoConfig.textLogo}</span>
             )}
           </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200"
            aria-label="Fechar menu"
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
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-colors"
            >
              <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Sidebar Desktop (fixa e sempre aberta) */}
      <aside className="hidden md:flex md:w-72 bg-white border-r border-slate-200 flex-col fixed h-screen">
        <div className="h-16 px-6 border-b border-slate-200 flex items-center sticky top-0 bg-white z-10">
           <div className="flex items-center gap-2">
             {logoConfig.useImage ? (
               <img
                 src={logoConfig.imageUrl}
                 alt={logoConfig.altText}
                 className="h-8 w-auto"
               />
             ) : (
               <span className="text-xl font-semibold text-blue-700">{logoConfig.textLogo}</span>
             )}
           </div>
         </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Navegação</p>
          {clienteMenu.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-colors"
            >
              <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
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
                aria-label="Abrir menu"
              >
                <FiMenu />
              </button>
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <img
                  src="/logo-horizontal.png"
                  alt="HelpNet Logo"
                  className="h-6 w-auto"
                />
              </div>
              <div className="md:hidden shrink-0">
                <img
                  src="/logo-horizontal.png"
                  alt="HelpNet Logo"
                  className="h-6 w-auto"
                />
              </div>

              {/* Ícones de ação */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Link to="/favoritos" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <FaHeart />
                </Link>
                <Link to="/notificacoes" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <FaBell />
                </Link>
                <Link to="/carrinho" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <FaShoppingCart />
                </Link>
                <Link to="/perfil" className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">
                  <FaUser />
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo do Perfil */}
        <main className="flex-1 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Cabeçalho */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <Link
                  to="/home"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <FaArrowLeft />
                  <span>Voltar</span>
                </Link>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Meu Perfil</h1>
              <p className="text-slate-600">Gerencie suas informações pessoais e preferências</p>
            </div>

            {/* Informações Pessoais */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Informações Pessoais</h2>
                <button
                  onClick={handleEditClick}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                >
                  <FaEdit />
                  <span>Editar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dados não editáveis */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Código do Cliente</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <FaIdCard className="text-slate-400" />
                      <span className="text-slate-900 font-mono">{profileData?.CodigoCliente || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data de Cadastro</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <FaCalendarAlt className="text-slate-400" />
                      <span className="text-slate-900">{formatDate(profileData?.DataCadastro)}</span>
                    </div>
                  </div>
                </div>

                {/* Dados editáveis */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <FaUser className="text-slate-400" />
                      <span className="text-slate-900 truncate">{profileData?.NomeCompleto || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CPF/CNPJ</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <FaIdCard className="text-slate-400" />
                      <span className="text-slate-900 font-mono">{formatCPF(profileData?.CPF_CNPJ)}</span>
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <FaEnvelope className="text-slate-400" />
                      <span className="text-slate-900 truncate">{profileData?.Email || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefone Celular</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <FaPhone className="text-slate-400" />
                      <span className="text-slate-900">{formatPhone(profileData?.TelefoneCelular)}</span>
                    </div>
                  </div>
                </div>

                {/* Telefones adicionais */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefone Fixo</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <FaPhone className="text-slate-400" />
                      <span className="text-slate-900">{formatPhone(profileData?.TelefoneFixo) || 'Não informado'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <FaPhone className="text-slate-400" />
                      <span className="text-slate-900">{formatPhone(profileData?.Whatsapp) || 'Não informado'}</span>
                    </div>
                  </div>
                </div>

                {/* Dados empresariais (se aplicável) */}
                {(profileData?.TipoPessoa === 'JURIDICA' || profileData?.RazaoSocial) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social</label>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <FaBuilding className="text-slate-400" />
                        <span className="text-slate-900 truncate">{profileData?.RazaoSocial || 'N/A'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Estadual</label>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <FaIdCard className="text-slate-400" />
                        <span className="text-slate-900">{profileData?.InscricaoEstadual || 'Não informado'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Municipal</label>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <FaIdCard className="text-slate-400" />
                        <span className="text-slate-900">{profileData?.InscricaoMunicipal || 'Não informado'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Endereços */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Endereços</h2>
                <Link
                  to="/enderecos"
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                >
                  <FaMapMarkerAlt />
                  <span>Gerenciar Endereços</span>
                </Link>
              </div>

              {profileData?.enderecos && profileData.enderecos.length > 0 ? (
                <div className="space-y-4">
                  {profileData.enderecos.slice(0, 2).map((endereco, index) => (
                    <div key={endereco.EnderecoID || index} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900 mb-1">{endereco.Nome || `Endereço ${index + 1}`}</h3>
                          <p className="text-sm text-slate-600">
                            {endereco.CEP && `${endereco.CEP}, `}
                            {endereco.Cidade && `${endereco.Cidade} - `}
                            {endereco.UF}
                          </p>
                          <p className="text-sm text-slate-600">
                            {endereco.Bairro && `${endereco.Bairro}, `}
                            {endereco.Numero && `${endereco.Numero}`}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          endereco.TipoEndereco === 'Residencial'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {endereco.TipoEndereco || 'Residencial'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {profileData.enderecos.length > 2 && (
                    <p className="text-sm text-slate-500 text-center">
                      +{profileData.enderecos.length - 2} endereços adicionais
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaMapMarkerAlt className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum endereço cadastrado</h3>
                  <p className="text-slate-600 mb-4">Adicione um endereço para facilitar suas compras</p>
                  <Link
                    to="/enderecos"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <FaMapMarkerAlt />
                    <span>Adicionar Endereço</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Ações da conta */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Ações da Conta</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleChangePasswordClick}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <FaEdit />
                  <span>Alterar Senha</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <FaSignOutAlt />
                  <span>Sair da conta</span>
                </button>
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

      {/* Modal de Edição de Perfil */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Editar Perfil</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={editForm.NomeCompleto}
                    onChange={(e) => setEditForm(prev => ({ ...prev, NomeCompleto: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={editForm.Email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone Celular</label>
                  <input
                    type="tel"
                    value={editForm.TelefoneCelular}
                    onChange={(e) => setEditForm(prev => ({ ...prev, TelefoneCelular: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone Fixo</label>
                  <input
                    type="tel"
                    value={editForm.TelefoneFixo}
                    onChange={(e) => setEditForm(prev => ({ ...prev, TelefoneFixo: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={editForm.Whatsapp}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Whatsapp: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {(profileData?.TipoPessoa === 'JURIDICA' || profileData?.RazaoSocial) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social</label>
                    <input
                      type="text"
                      value={editForm.RazaoSocial}
                      onChange={(e) => setEditForm(prev => ({ ...prev, RazaoSocial: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Estadual</label>
                    <input
                      type="text"
                      value={editForm.InscricaoEstadual}
                      onChange={(e) => setEditForm(prev => ({ ...prev, InscricaoEstadual: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Municipal</label>
                    <input
                      type="text"
                      value={editForm.InscricaoMunicipal}
                      onChange={(e) => setEditForm(prev => ({ ...prev, InscricaoMunicipal: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alteração de Senha */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Alterar Senha</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Senha Atual</label>
                  <Link to="/esqueci-senha" className="text-sm text-blue-600 hover:text-blue-700">
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={passwordVisibility.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => {
                      setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }));
                      validateCurrentPassword(e.target.value);
                    }}
                    className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {passwordVisibility.current ? (
                      <FaEyeSlash className="text-slate-400 hover:text-slate-600" />
                    ) : (
                      <FaEye className="text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
                {currentPasswordValid !== null && (
                  <div className="flex items-center gap-1 mt-1">
                    {currentPasswordValid ? (
                      <>
                        <FaCheck className="text-green-500 text-xs" />
                        <span className="text-green-600 text-xs">Senha correta</span>
                      </>
                    ) : (
                      <>
                        <FaTimes className="text-red-500 text-xs" />
                        <span className="text-red-600 text-xs">Senha incorreta</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                <div className="relative">
                  <input
                    type={passwordVisibility.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {passwordVisibility.new ? (
                      <FaEyeSlash className="text-slate-400 hover:text-slate-600" />
                    ) : (
                      <FaEye className="text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nova Senha</label>
                <div className="relative">
                  <input
                    type={passwordVisibility.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {passwordVisibility.confirm ? (
                      <FaEyeSlash className="text-slate-400 hover:text-slate-600" />
                    ) : (
                      <FaEye className="text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <div className="flex items-center gap-1 mt-1">
                    <FaTimes className="text-red-500 text-xs" />
                    <span className="text-red-600 text-xs">As senhas não coincidem</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={handleCancelPasswordChange}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePassword}
                disabled={saving || !currentPasswordValid || passwordForm.newPassword !== passwordForm.confirmPassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
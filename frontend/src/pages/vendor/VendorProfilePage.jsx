import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import VendorLayout from '../../components/VendorLayout.jsx';
import { clienteService } from '../../services/api';
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
  FiX
} from 'react-icons/fi';

function VendorProfilePage() {
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

  // Carregar dados do perfil
  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    try {
      setLoading(true);
      const response = await clienteService.buscarPerfil();
      setProfileData(response.cliente || response);
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
          TipoPessoa: 'JURIDICA',
          RazaoSocial: 'Empresa Exemplo Ltda',
          InscricaoEstadual: '123456789',
          InscricaoMunicipal: '987654321',
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
      <VendorLayout>
        <div className="min-h-screen bg-white flex">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Carregando perfil...</p>
            </div>
          </div>
        </div>
      </VendorLayout>
    );
  }

  if (error && !profileData) {
    return (
      <VendorLayout>
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
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link
              to="/vendedor"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <FaArrowLeft />
              <span>Voltar</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Meu Perfil de Vendedor</h1>
          <p className="text-slate-600">Gerencie suas informações pessoais e empresariais</p>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Código do Vendedor</label>
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

            {/* Dados empresariais */}
            <div className="space-y-4">
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
            </div>
          </div>
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
          </div>
        </div>
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
    </VendorLayout>
  );
}

export default VendorProfilePage;
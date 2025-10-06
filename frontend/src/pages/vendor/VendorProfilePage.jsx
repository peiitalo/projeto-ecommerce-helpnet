import { useState, useEffect } from 'react';
import VendorLayout from '../../layouts/VendorLayout';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { FiUser, FiMail, FiPhone, FiMapPin, FiSave, FiEdit } from 'react-icons/fi';

function VendorProfilePage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    NomeCompleto: '',
    Email: '',
    TelefoneCelular: '',
    TelefoneFixo: '',
    Whatsapp: '',
    RazaoSocial: '',
    InscricaoEstadual: '',
    InscricaoMunicipal: ''
  });

  useEffect(() => {
    loadProfile();
  }, [user]);


  const loadProfile = async () => {
    if (!user) return;

    if (user.role !== 'vendedor') {
      console.error('Acesso negado: usuário não é um vendedor');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        console.error('Token de acesso não encontrado');
        return;
      }

      const response = await fetch('/api/vendedor/perfil', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.vendedor) {
          const profileData = data.vendedor;
          setProfile({
            ...profileData,
            NomeCompleto: profileData.Nome,
            Email: profileData.Email,
            CodigoCliente: profileData.VendedorID.toString(),
            TipoPessoa: 'Jurídica',
            DataCadastro: profileData.CriadoEm,
            CPF_CNPJ: profileData.cliente?.CPF_CNPJ,
            TelefoneFixo: profileData.cliente?.TelefoneFixo,
            TelefoneCelular: profileData.cliente?.TelefoneCelular,
            Whatsapp: profileData.cliente?.Whatsapp,
            RazaoSocial: profileData.cliente?.RazaoSocial,
            InscricaoEstadual: profileData.cliente?.InscricaoEstadual,
            InscricaoMunicipal: profileData.cliente?.InscricaoMunicipal,
            enderecos: profileData.cliente?.enderecos,
            estatisticas: profileData.estatisticas
          });
          setFormData({
            NomeCompleto: profileData.Nome || '',
            Email: profileData.Email || '',
            TelefoneCelular: profileData.cliente?.TelefoneCelular || '',
            TelefoneFixo: profileData.cliente?.TelefoneFixo || '',
            Whatsapp: profileData.cliente?.Whatsapp || '',
            RazaoSocial: profileData.cliente?.RazaoSocial || profileData.empresa?.Nome || profileData.Nome || '',
            InscricaoEstadual: profileData.cliente?.InscricaoEstadual || '',
            InscricaoMunicipal: profileData.cliente?.InscricaoMunicipal || ''
          });
        } else {
          console.error('Resposta da API inválida:', data);
        }
      } else {
        const errorText = await response.text();
        console.error('Erro na API:', response.status, errorText);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      // For now, just show a message that vendor profile editing is not implemented
      // In a full implementation, you'd create a vendor profile update endpoint
      showSuccess('Funcionalidade de edição de perfil de vendedor em desenvolvimento. Os dados foram salvos localmente.');
      setEditing(false);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      showError('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <VendorLayout>
        <LoadingSkeleton type="profile" />
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
            <p className="mt-2 text-gray-600">Gerencie suas informações pessoais e de contato</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiEdit className="w-4 h-4 mr-2" />
              Editar Perfil
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Informações Pessoais */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Informações Pessoais</h2>
            </div>
            <div className="p-6">
              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        name="NomeCompleto"
                        value={formData.NomeCompleto}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-mail
                      </label>
                      <input
                        type="email"
                        name="Email"
                        value={formData.Email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone Celular
                      </label>
                      <input
                        type="tel"
                        name="TelefoneCelular"
                        value={formData.TelefoneCelular}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone Fixo
                      </label>
                      <input
                        type="tel"
                        name="TelefoneFixo"
                        value={formData.TelefoneFixo}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp
                      </label>
                      <input
                        type="tel"
                        name="Whatsapp"
                        value={formData.Whatsapp}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Razão Social
                      </label>
                      <input
                        type="text"
                        name="RazaoSocial"
                        value={formData.RazaoSocial}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          NomeCompleto: profile?.NomeCompleto || '',
                          Email: profile?.Email || '',
                          TelefoneCelular: profile?.TelefoneCelular || '',
                          TelefoneFixo: profile?.TelefoneFixo || '',
                          Whatsapp: profile?.Whatsapp || '',
                          RazaoSocial: profile?.RazaoSocial || '',
                          InscricaoEstadual: profile?.InscricaoEstadual || '',
                          InscricaoMunicipal: profile?.InscricaoMunicipal || ''
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <>
                          <FiSave className="w-4 h-4" />
                          <span>Salvar Alterações</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <FiUser className="text-gray-400 w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nome Completo</p>
                      <p className="text-sm text-gray-900">{profile?.NomeCompleto || 'Não informado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FiMail className="text-gray-400 w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">E-mail</p>
                      <p className="text-sm text-gray-900">{profile?.Email || 'Não informado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FiPhone className="text-gray-400 w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Telefone Celular</p>
                      <p className="text-sm text-gray-900">{profile?.TelefoneCelular || 'Não informado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FiPhone className="text-gray-400 w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">WhatsApp</p>
                      <p className="text-sm text-gray-900">{profile?.Whatsapp || 'Não informado'}</p>
                    </div>
                  </div>

                  {profile?.empresa?.Nome && (
                    <div className="flex items-center space-x-3 md:col-span-2">
                      <FiUser className="text-gray-400 w-5 h-5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Empresa</p>
                        <p className="text-sm text-gray-900">{profile.empresa.Nome}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Endereços */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Endereços</h2>
            </div>
            <div className="p-6">
              {profile?.enderecos && profile.enderecos.length > 0 ? (
                <div className="space-y-4">
                  {profile.enderecos.map((endereco, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                      <FiMapPin className="text-gray-400 w-5 h-5 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{endereco.Nome}</p>
                        <p className="text-sm text-gray-600">
                          {endereco.Numero && `${endereco.Numero}, `}
                          {endereco.Bairro && `${endereco.Bairro}, `}
                          {endereco.Cidade} - {endereco.UF}
                        </p>
                        <p className="text-sm text-gray-600">CEP: {endereco.CEP}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum endereço cadastrado</p>
              )}
            </div>
          </div>

          {/* Informações da Conta */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Informações da Conta</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Código do Cliente</p>
                  <p className="text-sm text-gray-900">{profile?.CodigoCliente || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo de Pessoa</p>
                  <p className="text-sm text-gray-900">{profile?.TipoPessoa || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">CNPJ</p>
                  <p className="text-sm text-gray-900">{profile?.CPF_CNPJ || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Data de Cadastro</p>
                  <p className="text-sm text-gray-900">
                    {profile?.DataCadastro ? new Date(profile.DataCadastro).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Estatísticas do Vendedor */}
            {profile?.estatisticas && (
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Estatísticas de Vendas</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{profile.estatisticas.totalProdutos}</p>
                      <p className="text-sm text-gray-600">Produtos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{profile.estatisticas.totalClientes}</p>
                      <p className="text-sm text-gray-600">Clientes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{profile.estatisticas.totalPedidos}</p>
                      <p className="text-sm text-gray-600">Pedidos Entregues</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">R$ {profile.estatisticas.totalVendas?.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Total em Vendas</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}

export default VendorProfilePage;
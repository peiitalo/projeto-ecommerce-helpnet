import { useState, useEffect } from 'react';
import VendorLayout from '../../layouts/VendorLayout';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { FiUser, FiMail, FiPhone, FiMapPin, FiSave, FiEdit, FiPlus, FiTrash } from 'react-icons/fi';
import { FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { useBuscarCep } from '../../hooks/useBuscarCep';

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
    InscricaoMunicipal: '',
    Banco: '',
    Agencia: '',
    ContaCorrente: '',
    TipoConta: ''
  });

  // Address management state
  const [vendorAddresses, setVendorAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    Nome: '',
    Complemento: '',
    CEP: '',
    Cidade: '',
    UF: '',
    TipoEndereco: 'Comercial',
    Numero: '',
    Bairro: ''
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { buscarCep, loading: cepLoading } = useBuscarCep();

  useEffect(() => {
    loadProfile();
    loadAddresses();
  }, [user]);

  // Load vendor addresses
  const loadAddresses = async () => {
    if (!user) return;

    try {
      setAddressesLoading(true);
      const token = localStorage.getItem('accessToken');

      if (!token) return;

      const response = await fetch('/api/vendedor/enderecos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVendorAddresses(data.enderecos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
    } finally {
      setAddressesLoading(false);
    }
  };

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
            InscricaoMunicipal: profileData.cliente?.InscricaoMunicipal || '',
            Banco: profileData.cliente?.Banco || '',
            Agencia: profileData.cliente?.Agencia || '',
            ContaCorrente: profileData.cliente?.ContaCorrente || '',
            TipoConta: profileData.cliente?.TipoConta || ''
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

  const validateForm = () => {
    // Basic validation
    if (!formData.NomeCompleto.trim()) {
      showError('Nome completo é obrigatório');
      return false;
    }

    if (!formData.Email.trim()) {
      showError('E-mail é obrigatório');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.Email)) {
      showError('E-mail inválido');
      return false;
    }

    // Banking data validation - if any banking field is filled, all must be filled
    const bankingFields = [formData.Banco, formData.Agencia, formData.ContaCorrente];
    const hasAnyBankingData = bankingFields.some(field => field.trim() !== '');

    if (hasAnyBankingData) {
      const hasAllBankingData = bankingFields.every(field => field.trim() !== '');
      if (!hasAllBankingData) {
        showError('Para dados bancários, todos os campos (Banco, Agência, Conta Corrente) são obrigatórios');
        return false;
      }

      if (formData.TipoConta && !['corrente', 'poupanca'].includes(formData.TipoConta)) {
        showError('Tipo de conta deve ser Conta Corrente ou Conta Poupança');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        showError('Token de acesso não encontrado');
        return;
      }

      const response = await fetch('/api/vendedor/perfil', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess('Perfil atualizado com sucesso!');
        setEditing(false);
        // Reload profile data to reflect changes
        loadProfile();
      } else {
        const errorMessage = data.errors ? data.errors.join(', ') : 'Erro ao atualizar perfil';
        showError(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      showError('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Address management functions
  const handleAddAddress = () => {
    setAddressForm({
      Nome: '',
      Complemento: '',
      CEP: '',
      Cidade: '',
      UF: '',
      TipoEndereco: 'Comercial',
      Numero: '',
      Bairro: ''
    });
    setIsAddingAddress(true);
  };

  const handleEditAddress = (address) => {
    setAddressForm({
      Nome: address.Nome || '',
      Complemento: address.Complemento || '',
      CEP: address.CEP || '',
      Cidade: address.Cidade || '',
      UF: address.UF || '',
      TipoEndereco: address.TipoEndereco || 'Comercial',
      Numero: address.Numero || '',
      Bairro: address.Bairro || ''
    });
    setEditingAddress(address);
  };

  const handleCancelAddressForm = () => {
    setIsAddingAddress(false);
    setEditingAddress(null);
    setAddressForm({
      Nome: '',
      Complemento: '',
      CEP: '',
      Cidade: '',
      UF: '',
      TipoEndereco: 'Comercial',
      Numero: '',
      Bairro: ''
    });
  };

  const handleSaveAddress = async () => {
    try {
      setSavingAddress(true);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        showError('Token de acesso não encontrado');
        return;
      }

      let response;
      if (editingAddress) {
        // Update existing address
        response = await fetch(`/api/vendedor/enderecos/${editingAddress.EnderecoVendedorID}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(addressForm)
        });
      } else {
        // Create new address
        response = await fetch('/api/vendedor/enderecos', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(addressForm)
        });
      }

      const data = await response.json();

      if (response.ok) {
        await loadAddresses();
        handleCancelAddressForm();
        showSuccess(editingAddress ? 'Endereço atualizado com sucesso!' : 'Endereço adicionado com sucesso!');
      } else {
        const errorMessage = data.errors ? data.errors.join(', ') : data.error || 'Erro ao salvar endereço';
        showError(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      showError('Erro ao salvar endereço. Tente novamente.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = (addressId) => {
    setDeletingAddressId(addressId);
  };

  const confirmDeleteAddress = async () => {
    if (!deletingAddressId) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`/api/vendedor/enderecos/${deletingAddressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setVendorAddresses(prev => prev.filter(addr => addr.EnderecoVendedorID !== deletingAddressId));
        showSuccess('Endereço excluído com sucesso!');
      } else {
        const errorText = await response.text();
        showError(`Erro ao excluir endereço: ${errorText}`);
      }
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
      showError('Erro ao excluir endereço. Tente novamente.');
    } finally {
      setDeleting(false);
      setDeletingAddressId(null);
    }
  };

  const cancelDeleteAddress = () => {
    setDeletingAddressId(null);
  };

  const handleCepChange = async (cep) => {
    setAddressForm(prev => ({ ...prev, CEP: cep }));

    if (cep.length === 9) { // Formato 00000-000
      try {
        const cepData = await buscarCep(cep);
        if (cepData) {
          setAddressForm(prev => ({
            ...prev,
            Cidade: cepData.localidade || prev.Cidade,
            UF: cepData.uf || prev.UF,
            Bairro: cepData.bairro || prev.Bairro
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  if (loading) {
    return (
      <VendorLayout>
        <LoadingSkeleton type="vendor-profile" />
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inscrição Estadual
                      </label>
                      <input
                        type="text"
                        name="InscricaoEstadual"
                        value={formData.InscricaoEstadual}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inscrição Municipal
                      </label>
                      <input
                        type="text"
                        name="InscricaoMunicipal"
                        value={formData.InscricaoMunicipal}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Dados Bancários */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Bancários</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Banco
                        </label>
                        <input
                          type="text"
                          name="Banco"
                          value={formData.Banco}
                          onChange={handleInputChange}
                          placeholder="Ex: Banco do Brasil"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Agência
                        </label>
                        <input
                          type="text"
                          name="Agencia"
                          value={formData.Agencia}
                          onChange={handleInputChange}
                          placeholder="Ex: 1234-5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Conta Corrente
                        </label>
                        <input
                          type="text"
                          name="ContaCorrente"
                          value={formData.ContaCorrente}
                          onChange={handleInputChange}
                          placeholder="Ex: 12345-6"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Conta
                        </label>
                        <select
                          name="TipoConta"
                          value={formData.TipoConta}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Selecione</option>
                          <option value="corrente">Conta Corrente</option>
                          <option value="poupanca">Conta Poupança</option>
                        </select>
                      </div>
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
                          InscricaoMunicipal: profile?.InscricaoMunicipal || '',
                          Banco: profile?.cliente?.Banco || '',
                          Agencia: profile?.cliente?.Agencia || '',
                          ContaCorrente: profile?.cliente?.ContaCorrente || '',
                          TipoConta: profile?.cliente?.TipoConta || ''
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

          {/* Endereços do Vendedor */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Meus Endereços</h2>
              <button
                onClick={handleAddAddress}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlus className="w-4 h-4 mr-1" />
                Adicionar
              </button>
            </div>
            <div className="p-6">
              {addressesLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Carregando endereços...</p>
                </div>
              ) : vendorAddresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendorAddresses.map((address) => (
                    <div key={address.EnderecoVendedorID} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-gray-900">{address.Nome}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              address.TipoEndereco === 'Comercial'
                                ? 'bg-green-100 text-green-800'
                                : address.TipoEndereco === 'Residencial'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {address.TipoEndereco}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {address.CEP && `${address.CEP}, `}
                            {address.Cidade && `${address.Cidade} - `}
                            {address.UF}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            {address.Bairro && `${address.Bairro}, `}
                            {address.Numero && `${address.Numero}`}
                          </p>
                          {address.Complemento && (
                            <p className="text-sm text-gray-600">{address.Complemento}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="p-1.5 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                            title="Editar"
                          >
                            <FaEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address.EnderecoVendedorID)}
                            className="p-1.5 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                            title="Excluir"
                          >
                            <FaTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiMapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum endereço cadastrado</h3>
                  <p className="text-gray-600 mb-4">Adicione seu primeiro endereço para gerenciar suas operações</p>
                  <button
                    onClick={handleAddAddress}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Endereço
                  </button>
                </div>
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

            {/* Dados Bancários */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Dados Bancários</h2>
              </div>
              <div className="p-6">
                {profile?.cliente?.Banco || profile?.cliente?.Agencia || profile?.cliente?.ContaCorrente ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <FiUser className="text-gray-400 w-5 h-5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Banco</p>
                        <p className="text-sm text-gray-900">{profile.cliente.Banco || 'Não informado'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <FiUser className="text-gray-400 w-5 h-5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Agência</p>
                        <p className="text-sm text-gray-900">{profile.cliente.Agencia || 'Não informado'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <FiUser className="text-gray-400 w-5 h-5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Conta Corrente</p>
                        <p className="text-sm text-gray-900">{profile.cliente.ContaCorrente || 'Não informado'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <FiUser className="text-gray-400 w-5 h-5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tipo de Conta</p>
                        <p className="text-sm text-gray-900">
                          {profile.cliente.TipoConta === 'corrente' ? 'Conta Corrente' :
                           profile.cliente.TipoConta === 'poupanca' ? 'Conta Poupança' :
                           'Não informado'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhum dado bancário cadastrado</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {(isAddingAddress || editingAddress) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAddress ? 'Editar Endereço' : 'Adicionar Endereço'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Endereço</label>
                  <input
                    type="text"
                    value={addressForm.Nome}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, Nome: e.target.value }))}
                    placeholder="Ex: Escritório Principal, Loja Centro"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={addressForm.CEP}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      maxLength="9"
                      required
                    />
                    {cepLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border border-gray-400 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={addressForm.Cidade}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, Cidade: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                  <select
                    value={addressForm.UF}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, UF: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="AC">AC</option>
                    <option value="AL">AL</option>
                    <option value="AP">AP</option>
                    <option value="AM">AM</option>
                    <option value="BA">BA</option>
                    <option value="CE">CE</option>
                    <option value="DF">DF</option>
                    <option value="ES">ES</option>
                    <option value="GO">GO</option>
                    <option value="MA">MA</option>
                    <option value="MT">MT</option>
                    <option value="MS">MS</option>
                    <option value="MG">MG</option>
                    <option value="PA">PA</option>
                    <option value="PB">PB</option>
                    <option value="PR">PR</option>
                    <option value="PE">PE</option>
                    <option value="PI">PI</option>
                    <option value="RJ">RJ</option>
                    <option value="RN">RN</option>
                    <option value="RS">RS</option>
                    <option value="RO">RO</option>
                    <option value="RR">RR</option>
                    <option value="SC">SC</option>
                    <option value="SP">SP</option>
                    <option value="SE">SE</option>
                    <option value="TO">TO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={addressForm.Bairro}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, Bairro: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input
                    type="text"
                    value={addressForm.Numero}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, Numero: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Endereço</label>
                  <select
                    value={addressForm.TipoEndereco}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, TipoEndereco: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Comercial">Comercial</option>
                    <option value="Residencial">Residencial</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={addressForm.Complemento}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, Complemento: e.target.value }))}
                    placeholder="Sala, andar, referência (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCancelAddressForm}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                disabled={savingAddress}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAddress}
                disabled={savingAddress}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {savingAddress && (
                  <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>
                )}
                <span>{savingAddress ? 'Salvando...' : (editingAddress ? 'Atualizar' : 'Adicionar')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAddressId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FaTrash className="text-red-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Excluir Endereço</h3>
                  <p className="text-gray-600 text-sm">Esta ação não pode ser desfeita.</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Tem certeza que deseja excluir este endereço? Todos os dados associados serão removidos permanentemente.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDeleteAddress}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteAddress}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting && (
                    <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>
                  )}
                  <span>{deleting ? 'Excluindo...' : 'Excluir'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
}

export default VendorProfilePage;
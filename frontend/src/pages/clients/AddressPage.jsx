import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { clienteService } from '../../services/api';
import { useBuscarCep } from '../../hooks/useBuscarCep';
import { useNotifications } from '../../hooks/useNotifications';
import {
  FaMapMarkerAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaUser,
  FaShoppingCart,
  FaHeart, 
  FaBell,
  FaSignOutAlt,
  FaArrowLeft
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

function AddressPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    Nome: '',
    Complemento: '',
    CEP: '',
    Cidade: '',
    UF: '',
    TipoEndereco: 'Residencial',
    Numero: '',
    Bairro: ''
  });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState([]);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { buscarCep, loading: cepLoading } = useBuscarCep();
  const { logout } = useAuth();
  const { showSuccess, showError, showWarning } = useNotifications();

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

  // Carregar endereços
  useEffect(() => {
    carregarEnderecos();
  }, []);

  const carregarEnderecos = async () => {
    try {
      setLoading(true);
      const response = await clienteService.listarEnderecos();
      setAddresses(response.enderecos || []);
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    showWarning('Tem certeza que deseja sair da conta?', {
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      onClose: () => {
        logout();
        window.location.href = '/login';
      }
    });
  };

  const handleAddAddress = () => {
    setAddressForm({
      Nome: '',
      Complemento: '',
      CEP: '',
      Cidade: '',
      UF: '',
      TipoEndereco: 'Residencial',
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
      TipoEndereco: address.TipoEndereco || 'Residencial', // Preservar o tipo existente
      Numero: address.Numero || '',
      Bairro: address.Bairro || ''
    });
    setEditingAddress(address);
  };

  const handleCancelForm = () => {
    setIsAddingAddress(false);
    setEditingAddress(null);
    setFormErrors([]);
    setAddressForm({
      Nome: '',
      Complemento: '',
      CEP: '',
      Cidade: '',
      UF: '',
      TipoEndereco: 'Residencial',
      Numero: '',
      Bairro: ''
    });
  };

  const handleSaveAddress = async () => {
    try {
      setSaving(true);
      setFormErrors([]);

      if (editingAddress) {
        // Atualizar endereço existente
        await clienteService.atualizarEndereco(editingAddress.EnderecoID, addressForm);
      } else {
        // Criar novo endereço
        await clienteService.criarEndereco(addressForm);
      }
      await carregarEnderecos();
      handleCancelForm();
      showSuccess(editingAddress ? 'Endereço atualizado com sucesso!' : 'Endereço adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      // Extract error messages from API response
      if (error.errors && Array.isArray(error.errors)) {
        setFormErrors(error.errors);
      } else if (error.message) {
        setFormErrors([error.message]);
      } else {
        setFormErrors(['Erro ao salvar endereço. Tente novamente.']);
      }
      showError('Erro ao salvar endereço. Verifique os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = (addressId) => {
    setDeletingAddressId(addressId);
  };

  const confirmDeleteAddress = async () => {
    if (!deletingAddressId) return;

    try {
      setDeleting(true);
      await clienteService.excluirEndereco(deletingAddressId);
      // Update local state by filtering out the deleted address
      setAddresses(prev => prev.filter(addr => addr.EnderecoID !== deletingAddressId));
      showSuccess('Endereço excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
      // Show user-friendly error message
      const errorMessage = error.errors?.join(', ') || error.message || 'Erro ao excluir endereço';
      showError(`Erro: ${errorMessage}`);
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
        // Não mostra erro para o usuário, apenas log
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando endereços...</p>
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
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
          >
            <FaSignOutAlt />
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>
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

        {/* Conteúdo da página */}
        <main className="flex-1 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <div className="mb-6">
              <Link
                to="/home"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
              >
                <FaArrowLeft />
                <span>Voltar</span>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Meus Endereços</h1>
              <p className="text-slate-600 mt-1">Gerencie seus endereços de entrega</p>
            </div>

            {/* Botão adicionar endereço */}
            <div className="mb-6">
              <button
                onClick={handleAddAddress}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus />
                <span>Adicionar Endereço</span>
              </button>
            </div>

            {/* Lista de endereços */}
            {addresses.length > 0 ? (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div key={address.EnderecoID} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{address.Nome}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            address.TipoEndereco === 'Residencial'
                              ? 'bg-blue-100 text-blue-800'
                              : address.TipoEndereco === 'Comercial'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {address.TipoEndereco}
                          </span>
                        </div>
                        <p className="text-slate-600 mb-1">
                          {address.CEP && `${address.CEP}, `}
                          {address.Cidade && `${address.Cidade} - `}
                          {address.UF}
                        </p>
                        <p className="text-slate-600 mb-1">
                          {address.Bairro && `${address.Bairro}, `}
                          {address.Numero && `${address.Numero}`}
                        </p>
                        {address.Complemento && (
                          <p className="text-slate-600 text-sm">{address.Complemento}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.EnderecoID)}
                          className="p-2 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          title="Excluir"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FaMapMarkerAlt className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                <h3 className="text-xl font-medium text-slate-900 mb-2">Nenhum endereço cadastrado</h3>
                <p className="text-slate-600 mb-6">Adicione seu primeiro endereço para facilitar suas compras</p>
                <button
                  onClick={handleAddAddress}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPlus />
                  <span>Adicionar Primeiro Endereço</span>
                </button>
              </div>
            )}
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

      {/* Modal de Adição/Edição de Endereço */}
      {(isAddingAddress || editingAddress) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingAddress ? 'Editar Endereço' : 'Adicionar Endereço'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Error Messages */}
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-600 font-medium">Erro ao salvar endereço:</span>
                  </div>
                  <ul className="text-red-700 text-sm space-y-1">
                    {formErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Endereço</label>
                  <input
                    type="text"
                    value={addressForm.Nome}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, Nome: e.target.value }))}
                    placeholder="Ex: Casa, Trabalho, etc."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={addressForm.CEP}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      maxLength="9"
                    />
                    {cepLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border border-slate-400 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={addressForm.Cidade}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, Cidade: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">UF</label>
                  <select
                    value={addressForm.UF}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, UF: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={addressForm.Bairro}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, Bairro: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                  <input
                    type="text"
                    value={addressForm.Numero}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, Numero: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Endereço</label>
                  <select
                    value={addressForm.TipoEndereco}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, TipoEndereco: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Residencial">Residencial</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={addressForm.Complemento}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, Complemento: e.target.value }))}
                    placeholder="Apartamento, bloco, etc. (opcional)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={handleCancelForm}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAddress}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : (editingAddress ? 'Atualizar' : 'Adicionar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {deletingAddressId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FaTrash className="text-red-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Excluir Endereço</h3>
                  <p className="text-slate-600 text-sm">Esta ação não pode ser desfeita.</p>
                </div>
              </div>
              <p className="text-slate-700 mb-6">
                Tem certeza que deseja excluir este endereço? Todos os dados associados serão removidos permanentemente.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDeleteAddress}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
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
    </div>
  );
}

export default AddressPage;
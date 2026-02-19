import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import VendorLayout from '../../components/VendorLayout.jsx';
import { vendedorApi, parceriaApi } from '../../services/api.js';
import {
  FaSearch,
  FaUser,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaHandshake,
  FaClock,
  FaCheck,
  FaTimes,
  FaUserFriends
} from 'react-icons/fa';

function VendorSellersPage() {
  const { user } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const sellersPerPage = 10;

  // Estados para parcerias
  const [parcerias, setParcerias] = useState({ ativas: [], pendentes: [] });
  const [showPartnershipModal, setShowPartnershipModal] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [partnershipForm, setPartnershipForm] = useState({
    percentualMeu: 50,
    percentualParceiro: 50,
    mensagem: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);


  useEffect(() => {
    loadSellers();
    loadParcerias();
  }, [user, currentPage]);

  const loadSellers = async () => {
    try {
      setLoading(true);
      const response = await vendedorApi.listarVendedores({
        page: currentPage,
        limit: sellersPerPage,
        search: ''
      });
      setSellers(response.vendedores || []);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
      setSellers([]);
      setLoading(false);
    }
  };

  const loadParcerias = async () => {
    try {
      const response = await parceriaApi.listar();
      setParcerias(response.parcerias || { ativas: [], pendentes: [] });
    } catch (error) {
      console.error('Erro ao carregar parcerias:', error);
      setParcerias({ ativas: [], pendentes: [] });
    }
  };

  const filteredSellers = sellers;

  const paginatedSellers = useMemo(() => {
    const startIndex = (currentPage - 1) * sellersPerPage;
    return filteredSellers.slice(startIndex, startIndex + sellersPerPage);
  }, [filteredSellers, currentPage]);

  const totalPages = Math.ceil(filteredSellers.length / sellersPerPage);

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getStatusText = (status) => {
    return status === 'active' ? 'Ativo' : 'Inativo';
  };

  // Funções para parcerias
  const handleOpenSellerModal = (seller) => {
    setSelectedSeller(seller);
    setShowSellerModal(true);
  };

  const handleCloseSellerModal = () => {
    setShowSellerModal(false);
    setSelectedSeller(null);
  };

  const handleOpenPartnershipModal = (seller) => {
    setSelectedSeller(seller);
    setPartnershipForm({
      percentualMeu: 50,
      percentualParceiro: 50,
      mensagem: ''
    });
    setShowPartnershipModal(true);
  };

  const handleClosePartnershipModal = () => {
    setShowPartnershipModal(false);
    setSelectedSeller(null);
  };

  const handleSendPartnershipRequest = async () => {
    try {
      await parceriaApi.enviarSolicitacao({
        vendedorId: selectedSeller.id,
        percentualMeu: partnershipForm.percentualMeu,
        percentualParceiro: partnershipForm.percentualParceiro,
        mensagem: partnershipForm.mensagem
      });
      handleClosePartnershipModal();
      loadParcerias();
      alert('Solicitação de parceria enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      alert('Erro ao enviar solicitação de parceria');
    }
  };

  const handleRespondPartnership = async (parceriaId, acao) => {
    try {
      await parceriaApi.responderSolicitacao(parceriaId, acao);
      loadParcerias();
      alert(`Solicitação ${acao === 'aceitar' ? 'aceita' : 'recusada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao responder solicitação:', error);
      alert('Erro ao responder solicitação');
    }
  };

  const handleEndPartnership = async (parceriaId) => {
    if (!confirm('Tem certeza que deseja encerrar esta parceria?')) return;

    try {
      await parceriaApi.encerrar(parceriaId);
      loadParcerias();
      alert('Parceria encerrada com sucesso!');
    } catch (error) {
      console.error('Erro ao encerrar parceria:', error);
      alert('Erro ao encerrar parceria');
    }
  };

  // Função para buscar vendedor
  const handleSearchSeller = async () => {
    if (!searchTerm.trim() || searchTerm.length < 3) {
      alert('Digite pelo menos 3 caracteres para buscar');
      return;
    }

    setIsSearching(true);
    try {
      const response = await vendedorApi.buscarPorCnpjEmail(searchTerm.trim());
      setSearchResult(response.vendedor);
    } catch (error) {
      console.error('Erro ao buscar vendedor:', error);
      setSearchResult(null);
      if (error.message !== 'Vendedor não encontrado') {
        alert('Erro ao buscar vendedor');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSeller();
    }
  };

  return (
    <VendorLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vendedores Parceiros</h1>
            <p className="text-slate-600 mt-1">
              Gerencie suas parcerias e convide novos vendedores
            </p>
          </div>
        </div>

        {/* Parcerias Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Parcerias Ativas */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FaHandshake className="text-green-600" />
              <h2 className="text-lg font-semibold text-slate-900">Parcerias Ativas</h2>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {parcerias.ativas.length}
              </span>
            </div>
            {parcerias.ativas.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhuma parceria ativa</p>
            ) : (
              <div className="space-y-3">
                {parcerias.ativas.map((parceria) => (
                  <div key={parceria.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FaUserFriends className="text-green-600" />
                      <div>
                        <p className="font-medium text-slate-900">{parceria.parceiro.nome}</p>
                        <p className="text-sm text-slate-600">
                          {parceria.percentual.meu}% / {parceria.percentual.parceiro}%
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEndPartnership(parceria.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Encerrar parceria"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Solicitações Pendentes */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FaClock className="text-yellow-600" />
              <h2 className="text-lg font-semibold text-slate-900">Solicitações Pendentes</h2>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                {parcerias.pendentes.length}
              </span>
            </div>
            {parcerias.pendentes.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhuma solicitação pendente</p>
            ) : (
              <div className="space-y-3">
                {parcerias.pendentes.map((parceria) => (
                  <div key={parceria.id} className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <FaUserFriends className="text-yellow-600" />
                        <div>
                          <p className="font-medium text-slate-900">{parceria.parceiro.nome}</p>
                          <p className="text-sm text-slate-600">
                            {parceria.souSolicitante
                              ? `Você ofereceu: ${parceria.percentual.meu}% / ${parceria.percentual.parceiro}%`
                              : `Recebido: ${parceria.percentual.parceiro}% / ${parceria.percentual.meu}%`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    {parceria.mensagem && (
                      <p className="text-sm text-slate-600 mb-2 italic">"{parceria.mensagem}"</p>
                    )}
                    <div className="flex gap-2">
                      {!parceria.souSolicitante ? (
                        <>
                          <button
                            onClick={() => handleRespondPartnership(parceria.id, 'aceitar')}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            <FaCheck />
                            Aceitar
                          </button>
                          <button
                            onClick={() => handleRespondPartnership(parceria.id, 'recusar')}
                            className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            <FaTimes />
                            Recusar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRespondPartnership(parceria.id, 'recusar')}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                        >
                          <FaTimes />
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar vendedor por CNPJ ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <button
              onClick={handleSearchSeller}
              disabled={isSearching || !searchTerm.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <FaSearch />
              )}
              <span className="hidden sm:inline">Procurar</span>
            </button>
          </div>
        </div>

        {/* Search Result */}
        {searchResult && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Vendedor Encontrado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{searchResult.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{searchResult.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{searchResult.cpfCnpj}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social</label>
                <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{searchResult.razaoSocial}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleOpenPartnershipModal(searchResult)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Solicitar Parceria
              </button>
              <button
                onClick={() => setSearchResult(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* No Search Result */}
        {searchTerm && !isSearching && !searchResult && (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <FaUser className="text-6xl text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhum vendedor encontrado
            </h3>
            <p className="text-slate-600">
              Verifique se o CNPJ ou e-mail estão corretos e tente novamente.
            </p>
          </div>
        )}

        {/* Sellers Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Carregando vendedores...</p>
            </div>
          ) : paginatedSellers.length === 0 ? (
            <div className="p-8 text-center">
              <FaUserFriends className="text-6xl text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Vendedores Parceiros
              </h3>
              <p className="text-slate-600 mb-4">
                Use a busca acima para encontrar vendedores e estabelecer parcerias
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Vendedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Localização
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Vendas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedSellers.map((seller) => (
                    <tr key={seller.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <FaUser className="text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {seller.name || 'Nome não informado'}
                            </div>
                            <div className="text-sm text-slate-500">
                              ID: {seller.id || 'N/A'}
                            </div>
                            {seller.joinDate && (
                              <div className="text-xs text-slate-400">
                                Desde: {formatDate(seller.joinDate)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 flex items-center gap-1">
                          <FaEnvelope className="text-slate-400" />
                          {seller.email || 'Email não informado'}
                        </div>
                        {seller.phone && (
                          <div className="text-sm text-slate-500 flex items-center gap-1">
                            <FaPhone className="text-slate-400" />
                            {seller.phone}
                          </div>
                        )}
                        {seller.whatsapp && (
                          <div className="text-sm text-slate-500 flex items-center gap-1">
                            <FaPhone className="text-green-500" />
                            WhatsApp: {seller.whatsapp}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {seller.address ? (
                          <div className="text-sm text-slate-900 flex items-start gap-1">
                            <FaMapMarkerAlt className="text-slate-400 mt-0.5" />
                            <span>{seller.address}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500 flex items-start gap-1">
                            <FaMapMarkerAlt className="text-slate-400 mt-0.5" />
                            <span>Endereço não informado</span>
                          </div>
                        )}
                        {seller.city && seller.state && (
                          <div className="text-xs text-slate-500">
                            {seller.city} - {seller.state}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(seller.status)}`}>
                          {getStatusText(seller.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {formatPrice(seller.totalSales)}
                        </div>
                        <div className="text-sm text-slate-500">
                          {seller.totalOrders} pedidos
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenSellerModal(seller)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Ver Informações"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleOpenPartnershipModal(seller)}
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="Solicitar Parceria"
                          >
                            <FaHandshake />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700">
                  Mostrando {((currentPage - 1) * sellersPerPage) + 1} a{' '}
                  {Math.min(currentPage * sellersPerPage, filteredSellers.length)} de{' '}
                  {filteredSellers.length} resultados
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-slate-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Informações do Vendedor */}
        {showSellerModal && selectedSeller && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">
                  Informações do Vendedor
                </h3>
                <button
                  onClick={handleCloseSellerModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                    <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{selectedSeller.name || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                    <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{selectedSeller.email || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                    <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{selectedSeller.cpfCnpj || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social</label>
                    <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{selectedSeller.razaoSocial || 'Não informado'}</p>
                  </div>
                </div>

                {/* Contato */}
                <div>
                  <h4 className="text-lg font-medium text-slate-900 mb-3">Contato</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                      <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{selectedSeller.phone || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                      <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{selectedSeller.whatsapp || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                {/* Localização */}
                <div>
                  <h4 className="text-lg font-medium text-slate-900 mb-3">Localização</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                      <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{selectedSeller.address || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cidade/UF</label>
                      <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">
                        {selectedSeller.city && selectedSeller.state ? `${selectedSeller.city} - ${selectedSeller.state}` : 'Não informado'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estatísticas */}
                <div>
                  <h4 className="text-lg font-medium text-slate-900 mb-3">Estatísticas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedSeller.totalOrders || 0}</div>
                      <div className="text-sm text-blue-700">Pedidos</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedSeller.totalSales ? formatPrice(selectedSeller.totalSales) : 'R$ 0,00'}
                      </div>
                      <div className="text-sm text-green-700">Vendas</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedSeller.joinDate ? formatDate(selectedSeller.joinDate) : 'N/A'}
                      </div>
                      <div className="text-sm text-purple-700">Desde</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleCloseSellerModal}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    handleCloseSellerModal();
                    handleOpenPartnershipModal(selectedSeller);
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Solicitar Parceria
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Parceria */}
        {showPartnershipModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Convidar para Parceria
                </h3>
                <button
                  onClick={handleClosePartnershipModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <FaTimes />
                </button>
              </div>

              {selectedSeller && (
                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-900">{selectedSeller.name}</p>
                  <p className="text-sm text-slate-600">{selectedSeller.email}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Percentual de Lucro
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Você</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={partnershipForm.percentualMeu}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setPartnershipForm({
                            ...partnershipForm,
                            percentualMeu: value,
                            percentualParceiro: 100 - value
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Parceiro</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={partnershipForm.percentualParceiro}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setPartnershipForm({
                            ...partnershipForm,
                            percentualParceiro: value,
                            percentualMeu: 100 - value
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    A soma deve ser 100%
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mensagem (opcional)
                  </label>
                  <textarea
                    value={partnershipForm.mensagem}
                    onChange={(e) => setPartnershipForm({
                      ...partnershipForm,
                      mensagem: e.target.value
                    })}
                    placeholder="Digite uma mensagem para o convite..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleClosePartnershipModal}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendPartnershipRequest}
                  disabled={partnershipForm.percentualMeu + partnershipForm.percentualParceiro !== 100}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar Convite
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}

export default VendorSellersPage;
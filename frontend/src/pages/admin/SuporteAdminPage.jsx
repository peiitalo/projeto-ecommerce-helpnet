import { useState, useEffect } from 'react';
import { FaSearch, FaReply, FaCheck, FaStar, FaFilter, FaEye, FaEyeSlash } from 'react-icons/fa';
import { adminSuporteService } from '../../services/adminApi';
import AdminLayout from '../../layouts/AdminLayout/index.jsx';

function SuporteAdminPage() {
  const [activeTab, setActiveTab] = useState('duvidas');
  const [duvidas, setDuvidas] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [duvidasResponse, avaliacoesResponse, estatisticasResponse] = await Promise.all([
        adminSuporteService.listarMensagens(),
        adminSuporteService.listarAvaliacoes(),
        adminSuporteService.estatisticas()
      ]);

      if (duvidasResponse.success) {
        setDuvidas(duvidasResponse.mensagens);
      }
      if (avaliacoesResponse.success) {
        setAvaliacoes(avaliacoesResponse.avaliacoes);
      }
      if (estatisticasResponse.success) {
        setEstatisticas(estatisticasResponse.estatisticas);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (messageId) => {
    if (!replyText.trim()) return;

    try {
      await adminSuporteService.responderMensagem(messageId, replyText);
      setShowReplyModal(false);
      setReplyText('');
      setSelectedMessage(null);
      loadData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao responder mensagem:', error);
      alert('Erro ao enviar resposta');
    }
  };

  const handleMarkAsResolved = async (messageId) => {
    try {
      await adminSuporteService.marcarComoResolvida(messageId);
      loadData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao marcar como resolvida:', error);
    }
  };

  const handleToggleReviewDisplay = async (reviewId, currentStatus) => {
    try {
      await adminSuporteService.gerenciarExibicaoAvaliacao(reviewId, !currentStatus);
      loadData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao alterar exibição da avaliação:', error);
    }
  };

  const filteredDuvidas = duvidas.filter(duvida => {
    const matchesSearch = duvida.Assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         duvida.Mensagem.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         duvida.cliente?.NomeCompleto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || duvida.Status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800';
      case 'RESPONDIDO': return 'bg-blue-100 text-blue-800';
      case 'RESOLVIDO': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Suporte Administrativo</h1>
          <p className="text-gray-600">Gerencie dúvidas dos clientes e avaliações da plataforma</p>
        </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaReply className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Mensagens</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.mensagens?.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FaCheck className="text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.mensagens?.pendentes || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaStar className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avaliações</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.avaliacoes?.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaStar className="text-purple-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Média Avaliações</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.avaliacoes?.media?.toFixed(1) || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('duvidas')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'duvidas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dúvidas dos Clientes ({estatisticas.mensagens?.total || 0})
            </button>
            <button
              onClick={() => setActiveTab('avaliacoes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'avaliacoes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Avaliações da Plataforma ({estatisticas.avaliacoes?.total || 0})
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'duvidas' && (
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Filtros */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por assunto, mensagem ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os status</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="RESPONDIDO">Respondido</option>
                  <option value="RESOLVIDO">Resolvido</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Dúvidas */}
          <div className="divide-y divide-gray-200">
            {filteredDuvidas.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhuma dúvida encontrada
              </div>
            ) : (
              filteredDuvidas.map((duvida) => (
                <div key={duvida.MensagemID} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{duvida.Assunto}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(duvida.Status)}`}>
                          {duvida.Status}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{duvida.Mensagem}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Cliente: {duvida.cliente?.NomeCompleto}</span>
                        <span>Data: {new Date(duvida.CriadoEm).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {duvida.Resposta && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 mb-2">Resposta:</p>
                          <p className="text-blue-800">{duvida.Resposta}</p>
                          {duvida.RespondidoEm && (
                            <p className="text-xs text-blue-600 mt-2">
                              Respondido em: {new Date(duvida.RespondidoEm).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {duvida.Status !== 'RESOLVIDO' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedMessage(duvida);
                              setReplyText(duvida.Resposta || '');
                              setShowReplyModal(true);
                            }}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            <FaReply className="inline mr-1" />
                            Responder
                          </button>
                          <button
                            onClick={() => handleMarkAsResolved(duvida.MensagemID)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            <FaCheck className="inline mr-1" />
                            Resolver
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'avaliacoes' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Avaliações da Plataforma</h3>
            <p className="text-sm text-gray-600">Gerencie quais avaliações aparecem na página inicial</p>
          </div>

          <div className="divide-y divide-gray-200">
            {avaliacoes.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhuma avaliação encontrada
              </div>
            ) : (
              avaliacoes.map((avaliacao) => (
                <div key={avaliacao.AvaliacaoID} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        {renderStars(avaliacao.Nota)}
                        <span className="text-sm text-gray-500">
                          {avaliacao.ExibirSite ? 'Exibida no site' : 'Não exibida'}
                        </span>
                      </div>
                      {avaliacao.Comentario && (
                        <p className="text-gray-700 mb-3">"{avaliacao.Comentario}"</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Cliente: {avaliacao.cliente?.NomeCompleto}</span>
                        <span>Data: {new Date(avaliacao.CriadoEm).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handleToggleReviewDisplay(avaliacao.AvaliacaoID, avaliacao.ExibirSite)}
                        className={`px-3 py-1 text-sm rounded ${
                          avaliacao.ExibirSite
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {avaliacao.ExibirSite ? (
                          <>
                            <FaEyeSlash className="inline mr-1" />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <FaEye className="inline mr-1" />
                            Exibir
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal de Resposta */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Responder Dúvida</h3>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900">{selectedMessage.Assunto}</h4>
              <p className="text-gray-700 mt-2">{selectedMessage.Mensagem}</p>
              <p className="text-sm text-gray-500 mt-2">
                De: {selectedMessage.cliente?.NomeCompleto}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sua Resposta
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite sua resposta..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setSelectedMessage(null);
                  setReplyText('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReply(selectedMessage.MensagemID)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Enviar Resposta
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}

export default SuporteAdminPage;
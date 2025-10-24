import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaComments, FaTimes, FaUser, FaEnvelope, FaPhone, FaStar } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { suporteService } from '../../services/api';

function SuportePage() {
  const { user } = useAuth();

  // Contact form state
  const [formData, setFormData] = useState({
    tipo: 'DUVIDA', // DUVIDA ou COMENTARIO_PLATAFORMA
    assunto: '',
    mensagem: ''
  });

  // Platform review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    nota: 5,
    comentario: '',
    exibirSite: false
  });
  const [userReview, setUserReview] = useState(null);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Chat widget state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: 'Olá! Como posso ajudar você hoje?', sender: 'bot', timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Load user's existing review
  useEffect(() => {
    const loadUserReview = async () => {
      try {
        const response = await suporteService.buscarMinhaAvaliacao();
        setUserReview(response.avaliacao);
      } catch (error) {
        console.error('Erro ao carregar avaliação:', error);
      }
    };
    loadUserReview();
  }, []);

  // Handle support message submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Você precisa estar logado para enviar mensagens.');
      return;
    }

    setIsSubmitting(true);
    try {
      await suporteService.enviarMensagem({
        tipo: 'DUVIDA', // All support messages go to admin as doubts
        assunto: getFinalSubject(),
        mensagem: formData.mensagem
      });

      alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
      setFormData({
        tipo: 'DUVIDA',
        assunto: '',
        mensagem: ''
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle platform review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Você precisa estar logado para avaliar a plataforma.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await suporteService.avaliarPlataforma(reviewData);
      alert('Avaliação enviada com sucesso! Obrigado pelo feedback.');
      setShowReviewForm(false);
      // Reload user review
      const response = await suporteService.buscarMinhaAvaliacao();
      setUserReview(response.avaliacao);
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      alert('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update form submission to handle custom subject
  const getFinalSubject = () => {
    if (formData.assunto === 'Outro' && formData.assuntoPersonalizado) {
      return formData.assuntoPersonalizado;
    }
    return formData.assunto;
  };

  // Handle review input changes
  const handleReviewChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Render star rating
  const renderStars = (rating, interactive = false, onChange) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={interactive ? () => onChange(i + 1) : undefined}
      />
    ));
  };

  // Handle chat message send
  const handleChatSend = () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: chatMessages.length + 1,
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    // Simulate bot response after 1 second
    setTimeout(() => {
      const botResponses = [
        'Entendi sua dúvida. Vou verificar isso para você.',
        'Obrigado por entrar em contato. Um de nossos especialistas irá responder em breve.',
        'Posso ajudar com mais alguma coisa?',
        'Sua solicitação foi registrada. Entraremos em contato em até 24 horas.'
      ];
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];

      const botMessage = {
        id: chatMessages.length + 2,
        text: randomResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/home"
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
              >
                <FaArrowLeft className="text-sm" />
                <span className="text-sm font-medium">Voltar</span>
              </Link>
              <h1 className="text-xl font-bold text-slate-900">Suporte HelpNet</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Entre em Contato</h2>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div>
                  <label htmlFor="assunto" className="block text-sm font-medium text-slate-700 mb-2">
                    Assunto *
                  </label>
                  <select
                    id="assunto"
                    name="assunto"
                    value={formData.assunto}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option value="">Selecione um assunto</option>
                    <option value="Problemas com pedido">Problemas com pedido</option>
                    <option value="Dúvidas sobre pagamento">Dúvidas sobre pagamento</option>
                    <option value="Problemas na conta">Problemas na conta</option>
                    <option value="Informações sobre produto">Informações sobre produto</option>
                    <option value="Sugestão ou comentário">Sugestão ou comentário</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                {formData.assunto === 'Outro' && (
                  <div>
                    <label htmlFor="assuntoPersonalizado" className="block text-sm font-medium text-slate-700 mb-2">
                      Especifique o assunto *
                    </label>
                    <input
                      type="text"
                      id="assuntoPersonalizado"
                      name="assuntoPersonalizado"
                      value={formData.assuntoPersonalizado || ''}
                      onChange={handleInputChange}
                      required={formData.assunto === 'Outro'}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      placeholder="Digite o assunto específico"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="mensagem" className="block text-sm font-medium text-slate-700 mb-2">
                    Mensagem *
                  </label>
                  <textarea
                    id="mensagem"
                    name="mensagem"
                    value={formData.mensagem}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none"
                    placeholder="Descreva sua dúvida ou problema em detalhes..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane className="text-sm" />
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
              </form>
            </div>

            {/* Platform Review Section */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Avalie Nossa Plataforma</h3>
                {!userReview && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                  >
                    {showReviewForm ? 'Cancelar' : 'Avaliar'}
                  </button>
                )}
              </div>

              {userReview && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-green-800">Sua avaliação:</span>
                    {renderStars(userReview.Nota)}
                  </div>
                  {userReview.Comentario && (
                    <p className="text-green-700 text-sm">"{userReview.Comentario}"</p>
                  )}
                </div>
              )}

              {showReviewForm && (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nota (1-5 estrelas) *
                    </label>
                    <div className="flex gap-1">
                      {renderStars(reviewData.nota, true, (rating) => setReviewData(prev => ({ ...prev, nota: rating })))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="comentario" className="block text-sm font-medium text-slate-700 mb-2">
                      Comentário (opcional)
                    </label>
                    <textarea
                      id="comentario"
                      name="comentario"
                      value={reviewData.comentario}
                      onChange={handleReviewChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none"
                      placeholder="Conte-nos sua experiência..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="exibirSite"
                      name="exibirSite"
                      checked={reviewData.exibirSite}
                      onChange={handleReviewChange}
                      className="rounded"
                    />
                    <label htmlFor="exibirSite" className="text-sm text-slate-700">
                      Permitir que minha avaliação apareça na página inicial (apenas avaliações positivas)
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full bg-yellow-500 text-white py-3 px-6 rounded-lg hover:bg-yellow-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaStar className="text-sm" />
                    {isSubmittingReview ? 'Enviando...' : 'Enviar Avaliação'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Help Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Informações Úteis</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Horário de Atendimento</h4>
                  <p className="text-sm text-slate-600">
                    Segunda a Sexta: 8h às 18h<br />
                    Sábado: 8h às 12h<br />
                    Domingo: Fechado
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Canais de Atendimento</h4>
                  <p className="text-sm text-slate-600">
                    E-mail: suporte@helpnet.com<br />
                    Telefone: (11) 4000-1234<br />
                    Chat: Disponível 24/7
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Tempo de Resposta</h4>
                  <p className="text-sm text-slate-600">
                    Chat: Imediato<br />
                    E-mail: Até 24 horas<br />
                    Telefone: Durante horário comercial
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-2">Precisa de ajuda urgente?</h3>
              <p className="text-sm text-blue-700 mb-4">
                Use nosso chat ao vivo para suporte imediato ou ligue para nossa central de atendimento.
              </p>
              <button
                onClick={() => setIsChatOpen(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <FaComments className="text-sm" />
                Iniciar Chat
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Chat Widget */}
      {isChatOpen && (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-white border border-slate-200 rounded-lg shadow-lg z-50 flex flex-col">
          {/* Chat Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaComments className="text-lg" />
              <span className="font-medium">Chat de Suporte</span>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-white hover:text-blue-100 transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
              />
              <button
                onClick={handleChatSend}
                disabled={!chatInput.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPaperPlane className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Widget Toggle Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
          aria-label="Abrir chat de suporte"
        >
          <FaComments className="text-lg" />
        </button>
      )}
    </div>
  );
}

export default SuportePage;
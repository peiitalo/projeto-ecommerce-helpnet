import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaComments, FaTimes, FaUser, FaEnvelope, FaPhone, FaStar, FaHeart, FaBell, FaShoppingCart, FaSignOutAlt } from 'react-icons/fa';
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
import { useAuth } from '../../context/AuthContext';
import { suporteService } from '../../services/api';

function SuportePage() {
  const { user } = useAuth();

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Chat widget state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: 'Olá! Como posso ajudar você hoje?', sender: 'bot', timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Load user's existing review (for validation purposes)
  useEffect(() => {
    const loadUserReview = async () => {
      try {
        await suporteService.buscarMinhaAvaliacao();
        // Just checking if user already reviewed, no longer storing the data
      } catch (error) {
        console.error('Erro ao carregar avaliação:', error);
      }
    };
    loadUserReview();
  }, []);

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
    { label: 'Meus Cupons', to: '/cupons', icon: <FiCreditCard className="text-slate-500" /> },
    { label: 'Endereços', to: '/enderecos', icon: <FiMapPin className="text-slate-500" /> },
    { label: 'Suporte', to: '/suporte', icon: <FiHelpCircle className="text-slate-500" /> },
    { label: 'Configurações', to: '/configuracoes', icon: <FiSettings className="text-slate-500" /> },
  ];

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
       // Reset form
       setReviewData({
         nota: 5,
         comentario: '',
         exibirSite: false
       });
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

  const content = (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
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
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                >
                  {showReviewForm ? 'Cancelar' : 'Avaliar'}
                </button>
              </div>


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
                      Comentário *
                    </label>
                    <textarea
                      id="comentario"
                      name="comentario"
                      value={reviewData.comentario}
                      onChange={handleReviewChange}
                      required
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
    </>
  );

  // Use the sidebar from home page for clients
  return (
    <div className="min-h-screen bg-white flex overflow-x-hidden">
      {/* Sidebar from home page */}
      <div className="hidden md:flex md:w-72 bg-white border-r border-slate-200 flex-col fixed h-screen">
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                item.to === '/suporte'
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
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200">
            <FaSignOutAlt />
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo-vertical.png" alt="HelpNet Logo" className="h-8 w-auto" />
            <span className="text-lg font-semibold text-blue-700 ml-2">HelpNet</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200" aria-label="Fechar menu">
            <FaTimes />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Navegação</p>
          <Link to="/explorer" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-colors">
            <span className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <span className="text-sm font-medium">Explore</span>
          </Link>
          <Link to="/meus-pedidos" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-colors">
            <span className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </span>
            <span className="text-sm font-medium">Pedidos</span>
          </Link>
          <Link to="/historico" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-colors">
            <span className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span className="text-sm font-medium">Histórico</span>
          </Link>
          <Link to="/cupons" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-colors">
            <span className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </span>
            <span className="text-sm font-medium">Meus Cupons</span>
          </Link>
          <Link to="/enderecos" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-colors">
            <span className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </span>
            <span className="text-sm font-medium">Endereços</span>
          </Link>
          <Link to="/suporte" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 transition-colors">
            <span className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span className="text-sm font-medium">Suporte</span>
          </Link>
          <Link to="/configuracoes" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-colors">
            <span className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </span>
            <span className="text-sm font-medium">Configurações</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-72 min-w-0">
        <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between gap-4 h-16">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200" aria-label="Abrir menu">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <img src="/logo-horizontal.png" alt="HelpNet Logo" className="h-6 w-auto" />
              </div>
              <div className="md:hidden shrink-0">
                <img src="/logo-horizontal.png" alt="HelpNet Logo" className="h-6 w-auto" />
              </div>

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

        <main className="flex-1 bg-slate-50">
          {content}
        </main>
      </div>
    </div>
  );
}

export default SuportePage;
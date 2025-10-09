import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import {
  FaUser,
  FaShoppingCart,
  FaHeart,
  FaBell,
  FaSignOutAlt,
  FaPlus,
  FaTicketAlt,
  FaCopy,
  FaCheck,
  FaTimes,
  FaCalendarAlt,
  FaPercent
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

function MeusCuponsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotifications();

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

  // Mock coupons data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCoupons([
        {
          id: 1,
          code: 'DESCONTO10',
          discount: 10,
          type: 'percentage',
          description: '10% de desconto em produtos selecionados',
          validUntil: '2024-12-31',
          used: false,
          minValue: 50
        },
        {
          id: 2,
          code: 'FRETEGRATIS',
          discount: 0,
          type: 'free_shipping',
          description: 'Frete grátis em compras acima de R$ 100',
          validUntil: '2024-12-15',
          used: false,
          minValue: 100
        },
        {
          id: 3,
          code: 'PRIMEIRA15',
          discount: 15,
          type: 'percentage',
          description: '15% OFF na primeira compra',
          validUntil: '2024-11-30',
          used: true,
          minValue: 0
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair da conta?')) {
      logout();
      window.location.href = '/login';
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    showSuccess('Código copiado para a área de transferência!');
  };

  const generateCoupon = async () => {
    setGenerating(true);
    // Simulate API call
    setTimeout(() => {
      const newCoupon = {
        id: Date.now(),
        code: 'NOVO' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        discount: 5,
        type: 'percentage',
        description: '5% de desconto especial',
        validUntil: '2024-12-31',
        used: false,
        minValue: 25
      };
      setCoupons(prev => [newCoupon, ...prev]);
      setShowGenerateModal(false);
      setGenerating(false);
      showSuccess('Cupom gerado com sucesso!');
    }, 1500);
  };

  const formatDiscount = (coupon) => {
    if (coupon.type === 'free_shipping') {
      return 'Frete Grátis';
    }
    return `${coupon.discount}% OFF`;
  };

  const isExpired = (validUntil) => {
    return new Date(validUntil) < new Date();
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

        {/* Conteúdo dos Cupons */}
        <main className="flex-1 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Cabeçalho */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <Link
                  to="/home"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <FiChevronLeft />
                  <span>Voltar</span>
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Meus Cupons</h1>
                  <p className="text-slate-600">Gerencie seus cupons de desconto</p>
                </div>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPlus />
                  <span>Gerar Cupom</span>
                </button>
              </div>
            </div>

            {/* Lista de Cupons */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white border border-slate-200 rounded-lg p-6 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-8 bg-slate-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : coupons.length > 0 ? (
              <div className="space-y-4">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className={`bg-white border rounded-lg p-6 transition-all ${
                      coupon.used || isExpired(coupon.validUntil)
                        ? 'border-slate-200 opacity-60'
                        : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FaTicketAlt className={`text-lg ${
                            coupon.used || isExpired(coupon.validUntil) ? 'text-slate-400' : 'text-blue-600'
                          }`} />
                          <h3 className={`font-semibold text-lg ${
                            coupon.used || isExpired(coupon.validUntil) ? 'text-slate-500' : 'text-slate-900'
                          }`}>
                            {formatDiscount(coupon)}
                          </h3>
                          {coupon.used && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                              Utilizado
                            </span>
                          )}
                          {isExpired(coupon.validUntil) && !coupon.used && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                              Expirado
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mb-2 ${
                          coupon.used || isExpired(coupon.validUntil) ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          {coupon.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <FaCalendarAlt />
                            Válido até {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}
                          </span>
                          {coupon.minValue > 0 && (
                            <span>Compra mínima: R$ {coupon.minValue}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className={`font-mono text-lg font-bold px-3 py-2 rounded border ${
                          coupon.used || isExpired(coupon.validUntil)
                            ? 'border-slate-200 text-slate-400 bg-slate-50'
                            : 'border-blue-200 text-blue-700 bg-blue-50'
                        }`}>
                          {coupon.code}
                        </span>
                        {!coupon.used && !isExpired(coupon.validUntil) && (
                          <button
                            onClick={() => copyToClipboard(coupon.code)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Copiar código"
                          >
                            <FaCopy />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FaTicketAlt className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-medium text-slate-900 mb-2">Nenhum cupom disponível</h3>
                <p className="text-slate-600 mb-6">Você ainda não possui cupons de desconto</p>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPlus />
                  <span>Gerar Primeiro Cupom</span>
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

      {/* Modal de Geração de Cupom */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Gerar Novo Cupom</h2>
              <p className="text-sm text-slate-600 mt-1">Crie um cupom de desconto personalizado</p>
            </div>
            <div className="p-6">
              <div className="text-center">
                <FaTicketAlt className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <p className="text-slate-600 mb-6">
                  Um novo cupom de desconto será gerado automaticamente com condições especiais.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Benefício:</strong> 5% de desconto em qualquer compra acima de R$ 25
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={generateCoupon}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Gerando...' : 'Gerar Cupom'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeusCuponsPage;
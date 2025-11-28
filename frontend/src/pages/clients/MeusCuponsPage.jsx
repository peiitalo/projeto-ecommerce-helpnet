import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCounters } from '../../context/CountersContext';
import { useNotifications } from '../../hooks/useNotifications';
import CouponDetailsModal from '../../components/CouponDetailsModal';
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
  FaPercent,
  FaEye
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
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { logout } = useAuth();
  const { favoritesCount, notificationsCount, cartCount } = useCounters();
  const { showSuccess } = useNotifications();

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

  // Carregar cupons recebidos
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        console.log('Frontend Debug - Token:', token ? 'present' : 'missing');

        // Buscar cupons disponíveis do cliente
        const meusCuponsResponse = await fetch('/api/cupons/meus', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        let availableCoupons = [];
        if (meusCuponsResponse.ok) {
          const data = await meusCuponsResponse.json();
          console.log('Frontend Debug - Meus cupons response:', data);
          if (data.success && data.data.length > 0) {
            availableCoupons = data.data.map(cupomCliente => ({
              id: cupomCliente.id,
              code: cupomCliente.code,
              discount: cupomCliente.discount,
              type: cupomCliente.type,
              description: cupomCliente.description,
              validUntil: cupomCliente.validUntil,
              used: false, // Sempre false pois backend filtra apenas disponíveis
              minValue: cupomCliente.minValue,
              status: 'available', // Sempre available pois backend filtra apenas disponíveis
              redeemedAt: cupomCliente.redeemedAt,
              usedAt: null, // Sempre null pois backend filtra apenas disponíveis
              canRedeem: true, // Sempre true pois são disponíveis
              vendedor: cupomCliente.vendedor,
              restricoes: cupomCliente.restricoes,
              // Add new state-based properties
              state: cupomCliente.state || 'active', // Default to active if not provided
              reason: cupomCliente.reason || null
            }));
          }
        } else {
          console.log('Frontend Debug - Meus cupons failed:', meusCuponsResponse.status, await meusCuponsResponse.text());
        }

        // Ordenar cupons por data de validade (todos são disponíveis)
        const sortedCoupons = availableCoupons.sort((a, b) => {
          return new Date(a.validUntil) - new Date(b.validUntil);
        });

        console.log('Frontend Debug - Final coupons array:', sortedCoupons);
        setCoupons(sortedCoupons);
      } catch (error) {
        console.error('Erro ao carregar cupons:', error);
        // Fallback para dados mock se a API falhar
        setCoupons([
          {
            id: 1,
            code: 'DESCONTO10',
            discount: 10,
            type: 'percentage',
            description: '10% de desconto em produtos selecionados',
            validUntil: '2024-12-31',
            used: false,
            minValue: 50,
            status: 'available'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
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


  const formatDiscount = (coupon) => {
    if (coupon.type === 'free_shipping') {
      return 'Frete Grátis';
    }
    if (coupon.type === 'fixed') {
      return `R$ ${coupon.discount}`;
    }
    return `${coupon.discount}%`;
  };

  const isExpired = (validUntil) => {
    return new Date(validUntil) < new Date();
  };

  const getCouponStateDisplay = (coupon) => {
    // Handle new state-based system
    if (coupon.state) {
      switch (coupon.state) {
        case 'active':
          return {
            color: 'bg-green-100 text-green-700',
            text: 'Ativo',
            canApply: true,
            icon: ''
          };
        case 'grayed_out':
          return {
            color: 'bg-gray-100 text-gray-700',
            text: 'Aplicável com restrições',
            canApply: false,
            icon: '⚠️',
            reason: coupon.reason
          };
        case 'inactive':
          return {
            color: 'bg-red-100 text-red-700',
            text: 'Não aplicável',
            canApply: false,
            icon: '❌',
            reason: coupon.reason
          };
        default:
          return {
            color: 'bg-slate-100 text-slate-700',
            text: coupon.state,
            canApply: false,
            icon: '❓'
          };
      }
    }

    // Fallback to old status system
    const expired = isExpired(coupon.validUntil);
    if (expired) {
      return {
        color: 'bg-red-100 text-red-700',
        text: 'Expirado',
        canApply: false,
        icon: '⏰'
      };
    }

    return {
      color: 'bg-green-100 text-green-700',
      text: 'Disponível',
      canApply: true,
      icon: '✅'
    };
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
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">{favoritesCount}</span>
                  )}
                </Link>
                <Link to="/notificacoes" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <FaBell />
                  {notificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">{notificationsCount}</span>
                  )}
                </Link>
                <Link to="/carrinho" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <FaShoppingCart />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">{cartCount}</span>
                  )}
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
                {/* Removido: Botão de gerar cupom - agora cupons são distribuídos pelos vendedores */}
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
                    className="bg-white border border-slate-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FaTicketAlt className="text-lg text-blue-600" />
                          <h3 className="font-semibold text-lg text-slate-900">
                            {formatDiscount(coupon)}
                          </h3>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2 items-center">
                            <span className="text-sm">{getCouponStateDisplay(coupon).icon}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getCouponStateDisplay(coupon).color}`}>
                              {getCouponStateDisplay(coupon).text}
                            </span>
                          </div>
                          {getCouponStateDisplay(coupon).reason && (
                            <div className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded">
                              {getCouponStateDisplay(coupon).reason}
                            </div>
                          )}
                        </div>
                        </div>
                        <p className="text-sm mb-2 text-slate-600">
                          {coupon.description}
                        </p>
                        <div className="flex flex-col gap-1 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt />
                            Válido até {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}
                          </div>
                          {coupon.minValue > 0 && (
                            <div>Compra mínima: R$ {coupon.minValue}</div>
                          )}
                          {coupon.restricoes?.quantidade_minima_itens && (
                            <div>Mínimo {coupon.restricoes.quantidade_minima_itens} itens</div>
                          )}
                          {coupon.restricoes?.frete_gratis_acima && (
                            <div>Frete grátis acima de R$ {coupon.restricoes.frete_gratis_acima}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="font-mono text-lg font-bold px-3 py-2 rounded border border-blue-200 text-blue-700 bg-blue-50">
                          {coupon.code}
                        </span>
                      {getCouponStateDisplay(coupon).canApply && (
                        <button
                          onClick={() => copyToClipboard(coupon.code)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Copiar código"
                        >
                          <FaCopy />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedCoupon(coupon);
                          setIsDetailsModalOpen(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <FaEye />
                      </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FaTicketAlt className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-medium text-slate-900 mb-2">Nenhum cupom disponível</h3>
                <p className="text-slate-600 mb-6">Você ainda não possui cupons de desconto. Aguarde os vendedores distribuírem cupons para você!</p>
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

      {/* Modal de detalhes do cupom */}
      <CouponDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        coupon={selectedCoupon}
      />
    </div>
  );
}

export default MeusCuponsPage;
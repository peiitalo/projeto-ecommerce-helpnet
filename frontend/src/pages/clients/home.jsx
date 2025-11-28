import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { produtoService, favoritoService } from '../../services/api';
import { log } from '../../utils/logger';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useDebounce from '../../hooks/useDebounce';
import apiCache from '../../utils/cache';
import LazyImage from '../../components/LazyImage';
import ProductDetailsModal from '../../components/ProductDetailsModal';
import CategoryFilter from '../../components/CategoryFilter';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ProductCarousel from '../../components/ProductCarousel';
import LoginRegisterModal from '../../components/LoginRegisterModal';
import PromotionalCard from '../../components/PromotionalCard';
import { buildImageUrl, buildImageUrls, getFirstValidImage } from '../../utils/imageUtils';
import { useNotifications } from '../../hooks/useNotifications';
import { useCounters } from '../../context/CountersContext';
import {
  FaShoppingCart,
  FaUser,
  FaHeart,
  FaBell,
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaTruck,
  FaPercent,
  FaFilter,
  FaCheck,
  FaSignOutAlt,
  FaRegHeart,
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
  FiClock,
  FiChevronDown
} from 'react-icons/fi';

function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);

  // Estados para pesquisa e filtros
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  const { count: cartCount, addItem, removeItem, items } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useNotifications();
  const { favoritesCount, notificationsCount } = useCounters();
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(null);
  const [productModalId, setProductModalId] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const logoConfig = {
    useImage: true,
    imageUrl: '/logo-vertical.png',
    altText: 'HelpNet Logo',
    textLogo: 'HelpNet'
  };

  const clienteMenu = [
    { label: 'Explore', to: '/explorer', icon: <FiSearch className="text-slate-500" />, requiresAuth: true },
    { label: 'Pedidos', to: '/meus-pedidos', icon: <FiPackage className="text-slate-500" />, requiresAuth: true },
    { label: 'Histórico', to: '/historico', icon: <FiClock className="text-slate-500" />, requiresAuth: true },
    { label: 'Meus Cupons', to: '/cupons', icon: <FiCreditCard className="text-slate-500" />, requiresAuth: true },
    { label: 'Endereços', to: '/enderecos', icon: <FiMapPin className="text-slate-500" />, requiresAuth: true },
    { label: 'Suporte', to: '/suporte', icon: <FiHelpCircle className="text-slate-500" />, requiresAuth: true },
    { label: 'Configurações', to: '/configuracoes', icon: <FiSettings className="text-slate-500" />, requiresAuth: true },
  ];

  const slides = [
    {
      id: 1,
      title: 'Ofertas da Semana',
      subtitle: 'Descontos exclusivos em eletrônicos e acessórios',
      cta: { label: 'Ver Ofertas', to: '/promocoes' },
      image: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1600&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'Novidades em Moda',
      subtitle: 'Coleção outono com até 40%',
      cta: { label: 'Explorar Moda', to: '/categoria/moda' },
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'Casa e Decoração',
      subtitle: 'Renove seus ambientes com estilo e economia',
      cta: { label: 'Ver Casa & Decor', to: '/categoria/casa-decoracao' },
      image: 'https://images.unsplash.com/photo-1505692794403-34d4982f88aa?q=80&w=1600&auto=format&fit=crop'
    }
  ];

  const carouselRef = useRef(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Function to update current slide based on scroll position
  const updateCurrentSlide = () => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const slideWidth = container.clientWidth;
      const scrollLeft = container.scrollLeft;
      const newIndex = Math.round(scrollLeft / slideWidth);
      setCurrentSlideIndex(Math.min(newIndex, slides.length - 1));
    }
  };

  // Function to scroll to specific slide
  const scrollToSlide = (index) => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const slideWidth = container.clientWidth;
      container.scrollTo({
        left: index * slideWidth,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const container = carouselRef.current;
    if (container) {
      container.addEventListener('scroll', updateCurrentSlide);
      return () => container.removeEventListener('scroll', updateCurrentSlide);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const container = carouselRef.current;
        const slideWidth = container.clientWidth;
        const maxScroll = container.scrollWidth - container.clientWidth;

        if (container.scrollLeft >= maxScroll - slideWidth / 2) {
          // Go back to first slide
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Scroll to next slide
          container.scrollBy({ left: slideWidth, behavior: 'smooth' });
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    carregarProdutos();
    carregarFavoritos();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, selectedFilters, sortBy]);

  const carregarProdutos = async () => {
    const cacheKey = 'home_products';
    const cachedProducts = apiCache.get(cacheKey);
    if (cachedProducts) {
      setProducts(cachedProducts);
      setLoading(false);
      log.info('home_products_cache_hit', { total: cachedProducts.length });
      return;
    }

    try {
      setLoading(true);
      log.info('home_products_fetch_start');
      const response = await produtoService.listar({ status: 'ativo' });

      const produtosMapeados = (response.produtos || response).map(produto => ({
        id: produto.ProdutoID || produto.id,
        name: produto.Nome || produto.name,
        price: produto.Preco || produto.price,
        originalPrice: produto.PrecoOriginal || produto.originalPrice,
        image: getFirstValidImage(produto.Imagens),
        images: buildImageUrls(produto.Imagens),
        rating: produto.avaliacoes && produto.avaliacoes.length > 0 
          ? produto.avaliacoes.reduce((acc, av) => acc + av.Nota, 0) / produto.avaliacoes.length 
          : 0,
        reviewCount: produto.avaliacoes ? produto.avaliacoes.length : 0,
        sales: produto.avaliacoes ? produto.avaliacoes.length * 10 + Math.floor(Math.random() * 100) : Math.floor(Math.random() * 100),
        category: produto.categoria?.Nome || produto.category || 'Geral',
        freeShipping: produto.FreteGratis || produto.freeShipping || false,
        discount: produto.Desconto || produto.discount || 0,
        breveDescricao: produto.BreveDescricao || produto.breveDescricao || '',
        vendedorNome: produto.vendedor?.Nome || null,
        empresaNome: produto.empresa?.Nome || null,
        estoque: produto.Estoque || 0
      }));

      setProducts(produtosMapeados);
      apiCache.set(cacheKey, produtosMapeados, 10 * 60 * 1000);
      log.info('home_products_fetch_success', { total: produtosMapeados.length });
    } catch (error) {
      log.error('home_products_fetch_error', { error: { message: error?.message } });
      setProducts([
        {
          id: 'p1',
          name: 'Fone Bluetooth Noise Cancelling',
          price: 399.9,
          originalPrice: 499.9,
          image: 'https://images.unsplash.com/photo-1518444028785-8f6f1a1a79f0?q=80&w=1200&auto=format&fit=crop',
          rating: 4.6,
          sales: 1240,
          category: 'Eletrônicos',
          freeShipping: true,
          discount: 20,
          vendedorNome: null,
          empresaNome: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const carregarFavoritos = async () => {
    const cacheKey = 'home_favorites';
    const cachedFavorites = apiCache.get(cacheKey);
    if (cachedFavorites) {
      setFavorites(cachedFavorites);
      setFavoritesLoading(false);
      log.info('home_favorites_cache_hit', { total: cachedFavorites.length });
      return;
    }

    try {
      setFavoritesLoading(true);
      const response = await favoritoService.listar();
      const favoritesData = response.favoritos || [];
      setFavorites(favoritesData);
      apiCache.set(cacheKey, favoritesData, 2 * 60 * 1000);
    } catch (error) {
      log.error('home_favorites_fetch_error', { error: error.message });
      setFavorites([]);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const removeFilter = (filterValue) => {
    setSelectedFilters(selectedFilters.filter(f => f.value !== filterValue));
  };

  const clearAllFilters = () => {
    setSelectedFilters([]);
    setQuery('');
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Deseja realmente sair da conta?');
    if (confirmed) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-x-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center">
            {logoConfig.useImage ? (
              <img src={logoConfig.imageUrl} alt={logoConfig.altText} className="h-8 w-auto" />
            ) : (
              <span className="text-lg font-semibold text-blue-700">{logoConfig.textLogo}</span>
            )}
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200" aria-label="Fechar menu">
            <FiX />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Navegação</p>
          {clienteMenu.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (item.requiresAuth && !user?.id) {
                  setShowLoginModal(true);
                } else {
                  navigate(item.to);
                }
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-colors text-left"
            >
              <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          {user && user.id ? (
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200">
              <FaSignOutAlt />
              <span className="text-sm font-medium">Sair da conta</span>
            </button>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200">
              <FaUser />
              <span className="text-sm font-medium">Entre já</span>
            </button>
          )}
        </div>
      </div>

      <aside className="hidden md:flex md:w-72 bg-white border-r border-slate-200 flex-col fixed h-screen">
        <div className="h-16 px-6 border-b border-slate-200 flex items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            {logoConfig.useImage ? (
              <img src={logoConfig.imageUrl} alt={logoConfig.altText} className="h-8 w-auto" />
            ) : (
              <span className="text-xl font-semibold text-blue-700">{logoConfig.textLogo}</span>
            )}
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Navegação</p>
          {clienteMenu.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (item.requiresAuth && !user?.id) {
                  setShowLoginModal(true);
                } else {
                  navigate(item.to);
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-colors text-left"
            >
              <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          {user && user.id ? (
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200">
              <FaSignOutAlt />
              <span className="text-sm font-medium">Sair da conta</span>
            </button>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200">
              <FaUser />
              <span className="text-sm font-medium">Entre já</span>
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:ml-72 min-w-0">
        <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between gap-4 h-16">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200" aria-label="Abrir menu">
                <FiMenu />
              </button>
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <img src="/logo-horizontal.png" alt="HelpNet Logo" className="h-6 w-auto" />
              </div>
              <div className="md:hidden shrink-0">
                <img src="/logo-horizontal.png" alt="HelpNet Logo" className="h-6 w-auto" />
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    if (!user?.id) {
                      setShowLoginModal(true);
                    } else {
                      navigate('/favoritos');
                    }
                  }}
                  className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <FaHeart />
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                      {favoritesCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (!user?.id) {
                      setShowLoginModal(true);
                    } else {
                      navigate('/notificacoes');
                    }
                  }}
                  className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <FaBell />
                  {notificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                      {notificationsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (!user?.id) {
                      setShowLoginModal(true);
                    } else {
                      navigate('/carrinho');
                    }
                  }}
                  className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <FaShoppingCart />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                      {cartCount}
                    </span>
                  )}
                </button>
                {user && user.id && (
                  <Link to="/perfil" className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">
                    <FaUser />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-slate-50">
          <div className="px-4 sm:px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3 relative rounded-xl overflow-hidden border border-slate-200">
                <div ref={carouselRef} className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory">
                  {slides.map((slide) => (
                    <div key={slide.id} className="flex-shrink-0 w-full snap-center relative">
                      <img src={slide.image} alt={slide.title} className="w-full h-[200px] sm:h-[240px] lg:h-[280px] object-cover" onError={(e) => { e.target.src = '/placeholder-image.svg'; e.target.alt = 'Imagem não disponível'; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent" />
                      <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end">
                        <h2 className="text-lg sm:text-2xl font-bold text-white drop-shadow">{slide.title}</h2>
                        <p className="text-slate-100 mt-1 text-sm max-w-lg">{slide.subtitle}</p>
                        <div className="mt-3">
                          <Link to={slide.cta.to} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-blue-700 font-semibold hover:shadow-md transition text-sm">
                            {slide.cta.label}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress indicators */}
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 z-10">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToSlide(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentSlideIndex
                          ? 'w-6 bg-white'
                          : 'w-2 bg-white/50 hover:bg-white/70'
                      }`}
                      aria-label={`Ir para slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="hidden lg:flex lg:col-span-1 flex-col gap-3 h-[200px] sm:h-[240px] lg:h-[280px]">
                <PromotionalCard
                  type="offers"
                  onRequireAuth={() => setShowLoginModal(true)}
                />
                <PromotionalCard
                  type="free_shipping"
                  onRequireAuth={() => setShowLoginModal(true)}
                />
              </div>
            </div>

            <div className="mt-8 space-y-8">
              <ProductCarousel
                title="Mais Vendidos"
                products={products.sort((a, b) => b.sales - a.sales).slice(0, 10)}
                loading={loading}
                favorites={favorites}
                favoriteLoading={favoriteLoading}
                onToggleFavorite={() => {}}
                setProductModalId={setProductModalId}
                setShowProductModal={setShowProductModal}
                onRequireAuth={() => setShowLoginModal(true)}
              />
              <ProductCarousel
                title="Bem Avaliados"
                products={products.filter(p => p.rating >= 4).sort((a, b) => b.rating - a.rating).slice(0, 10)}
                loading={loading}
                favorites={favorites}
                favoriteLoading={favoriteLoading}
                onToggleFavorite={() => {}}
                setProductModalId={setProductModalId}
                setShowProductModal={setShowProductModal}
                onRequireAuth={() => setShowLoginModal(true)}
              />
              <ProductCarousel
                title="Produtos Recentes"
                products={products.slice().reverse().slice(0, 10)}
                loading={loading}
                favorites={favorites}
                favoriteLoading={favoriteLoading}
                onToggleFavorite={() => {}}
                setProductModalId={setProductModalId}
                setShowProductModal={setShowProductModal}
                onRequireAuth={() => setShowLoginModal(true)}
              />
            </div>
          </div>
        </main>

        <ProductDetailsModal productId={productModalId} isOpen={showProductModal} onClose={() => { setShowProductModal(false); setProductModalId(null); }} />

        <LoginRegisterModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

        <footer className="bg-slate-900 text-slate-300">
          <div className="px-4 sm:px-6 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <p className="text-xs">© {new Date().getFullYear()} HelpNet. Todos os direitos reservados.</p>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs">
                <Link to="/termos" className="hover:text-white transition-colors">Termos</Link>
                <Link to="/politica-privacidade" className="hover:text-white transition-colors">Privacidade</Link>
                <Link to="/suporte" className="hover:text-white transition-colors">Suporte</Link>
                <Link to="/contato" className="hover:text-white transition-colors">Contato</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Home;
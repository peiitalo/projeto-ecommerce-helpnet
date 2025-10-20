import { useEffect, useMemo, useState } from 'react';
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
import { buildImageUrl, buildImageUrls, getFirstValidImage } from '../../utils/imageUtils';
import { useNotifications } from '../../hooks/useNotifications';
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
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useNotifications();
  const [savedCount, setSavedCount] = useState(0);
  const [notifCount] = useState(3);
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(null);
  const [productModalId, setProductModalId] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const logoConfig = {
    useImage: true,
    imageUrl: '/logo-vertical.png',
    altText: 'HelpNet Logo',
    textLogo: 'HelpNet'
  };

  const clienteMenu = [
    { label: 'Explore', to: '/explorer', icon: <FiSearch className="text-slate-500" /> },
    { label: 'Pedidos', to: '/meus-pedidos', icon: <FiPackage className="text-slate-500" /> },
    { label: 'Histórico', to: '/historico', icon: <FiClock className="text-slate-500" /> },
    { label: 'Meus Cupons', to: '/cupons', icon: <FiCreditCard className="text-slate-500" /> },
    { label: 'Endereços', to: '/enderecos', icon: <FiMapPin className="text-slate-500" /> },
    { label: 'Suporte', to: '/suporte', icon: <FiHelpCircle className="text-slate-500" /> },
    { label: 'Configurações', to: '/configuracoes', icon: <FiSettings className="text-slate-500" /> },
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
      subtitle: 'Coleção outono com até 40% OFF',
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

  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const goPrev = () => setActiveSlide((activeSlide - 1 + slides.length) % slides.length);
  const goNext = () => setActiveSlide((activeSlide + 1) % slides.length);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) goNext();
    if (isRightSwipe) goPrev();
  };

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
      setSavedCount(cachedFavorites.length);
      setFavoritesLoading(false);
      log.info('home_favorites_cache_hit', { total: cachedFavorites.length });
      return;
    }

    try {
      setFavoritesLoading(true);
      const response = await favoritoService.listar();
      const favoritesData = response.favoritos || [];
      setFavorites(favoritesData);
      setSavedCount(favoritesData.length);
      apiCache.set(cacheKey, favoritesData, 2 * 60 * 1000);
    } catch (error) {
      log.error('home_favorites_fetch_error', { error: error.message });
      setFavorites([]);
      setSavedCount(0);
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

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    selectedFilters.forEach(filter => {
      switch (filter.type) {
        case 'category':
          filtered = filtered.filter(p => p.category === filter.value);
          break;
        case 'price':
          if (filter.value === 'price-100') {
            filtered = filtered.filter(p => p.price <= 100);
          } else if (filter.value === 'price-100-500') {
            filtered = filtered.filter(p => p.price > 100 && p.price <= 500);
          } else if (filter.value === 'price-500-1000') {
            filtered = filtered.filter(p => p.price > 500 && p.price <= 1000);
          } else if (filter.value === 'price-1000+') {
            filtered = filtered.filter(p => p.price > 1000);
          }
          break;
        case 'rating':
          if (filter.value === 'rating-4+') {
            filtered = filtered.filter(p => p.rating >= 4);
          } else if (filter.value === 'rating-4.5+') {
            filtered = filtered.filter(p => p.rating >= 4.5);
          }
          break;
        case 'shipping':
          if (filter.value === 'free-shipping') {
            filtered = filtered.filter(p => p.freeShipping);
          }
          break;
        case 'discount':
          if (filter.value === 'with-discount') {
            filtered = filtered.filter(p => p.discount > 0);
          }
          break;
      }
    });

    let result = filtered;
    if (['price-low','price-high','rating','sales'].includes(sortBy)) {
      result = [...filtered];
      switch (sortBy) {
        case 'price-low':
          result.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          result.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          result.sort((a, b) => b.rating - a.rating);
          break;
        case 'sales':
          result.sort((a, b) => b.sales - a.sales);
          break;
      }
    }

    return result;
  }, [products, debouncedQuery, selectedFilters, sortBy]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, currentPage, productsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const renderStars = (rating) => {
    const stars = [];
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
    const empty = 5 - full - (hasHalf ? 1 : 0);
    for (let i = 0; i < full; i++) stars.push(<FaStar key={`f-${i}`} className="text-yellow-400" />);
    if (hasHalf) stars.push(<FaStarHalfAlt key="h" className="text-yellow-400" />);
    for (let i = 0; i < empty; i++) stars.push(<FaRegStar key={`e-${i}`} className="text-yellow-400" />);
    return <div className="flex items-center gap-1 text-xs">{stars}</div>;
  };

  const formatPrice = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleAddToCart = (product) => {
    addItem(product, 1);
    showSuccess(`${product.name} adicionado ao carrinho!`);
  };

  const handleRemoveFromCart = (productId) => {
    removeItem(productId);
    showWarning('Produto removido do carrinho');
  };

  const isInCart = (productId) => items.some(item => item.id === productId);
  const isFavorited = (productId) => favorites.some(fav => fav.produto?.ProdutoID === productId);

  const handleToggleFavorite = async (productId) => {
    if (favoriteLoading === productId) return;

    setFavoriteLoading(productId);
    try {
      if (isFavorited(productId)) {
        await favoritoService.remover(productId);
        setFavorites(prev => prev.filter(fav => fav.produto?.ProdutoID !== productId));
        setSavedCount(prev => prev - 1);
        apiCache.delete('home_favorites');
        showSuccess('Produto removido dos favoritos');
      } else {
        await favoritoService.adicionar(productId);
        // Atualizar estado imediatamente ao invés de recarregar
        const product = products.find(p => p.id === productId);
        if (product) {
          const newFavorite = {
            produto: {
              ProdutoID: productId,
              Nome: product.name
            }
          };
          setFavorites(prev => [...prev, newFavorite]);
          setSavedCount(prev => prev + 1);
        }
        apiCache.delete('home_favorites');
        showSuccess('Produto adicionado aos favoritos');
      }
    } catch (error) {
      log.error('home_toggle_favorite_error', { productId, error: error.message });
      showError('Erro ao alterar favorito');
      // Reverter estado em caso de erro
      await carregarFavoritos();
    } finally {
      setFavoriteLoading(null);
    }
  };

  const handleLogout = () => {
    showWarning('Deseja realmente sair?', {
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      onClose: () => {
        logout();
        navigate('/login');
      }
    });
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
            <Link key={item.label} to={item.to} onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-colors">
              <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200">
            <FaSignOutAlt />
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
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
            <Link key={item.label} to={item.to} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-colors">
              <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200">
            <FaSignOutAlt />
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
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
                <Link to="/favoritos" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <FaHeart />
                  {savedCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                      {savedCount}
                    </span>
                  )}
                </Link>
                <Link to="/notificacoes" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <FaBell />
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                      {notifCount}
                    </span>
                  )}
                </Link>
                <Link to="/carrinho" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <FaShoppingCart />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link to="/perfil" className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">
                  <FaUser />
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-slate-50">
          <div className="px-4 sm:px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3 relative rounded-xl overflow-hidden border border-slate-200" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                {slides.map((slide, idx) => (
                  <div key={slide.id} className={`absolute inset-0 transition-opacity duration-700 ${idx === activeSlide ? 'opacity-100' : 'opacity-0'}`} aria-hidden={idx !== activeSlide}>
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

                <button onClick={goPrev} aria-label="Anterior" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 text-slate-700 hover:bg-white shadow">
                  <FiChevronLeft className="text-sm" />
                </button>
                <button onClick={goNext} aria-label="Próximo" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 text-slate-700 hover:bg-white shadow">
                  <FiChevronRight className="text-sm" />
                </button>

                <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1 z-10">
                  {slides.map((_, i) => (
                    <button key={i} onClick={() => setActiveSlide(i)} className={`h-1.5 rounded-full transition-all ${i === activeSlide ? 'w-4 bg-white' : 'w-1.5 bg-white/70 hover:bg-white'}`} aria-label={`Ir para slide ${i + 1}`} />
                  ))}
                </div>

                <div className="invisible">
                  <img src={slides[0].image} alt="placeholder" className="w-full h-[200px] sm:h-[240px] lg:h-[280px] object-cover" onError={(e) => { e.target.src = '/placeholder-image.svg'; e.target.alt = 'Imagem não disponível'; }} />
                </div>
              </div>

              <div className="hidden lg:flex lg:col-span-1 flex-col gap-3 h-[200px] sm:h-[240px] lg:h-[280px]">
                <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-gradient-to-br from-orange-300 to-orange-400 text-white flex-1">
                  <div className="p-3 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <FaPercent className="text-orange-100 text-xs" />
                        <span className="text-xs font-bold">OFERTA</span>
                      </div>
                      <h3 className="text-sm font-bold mb-1">Até 70% OFF</h3>
                      <p className="text-xs opacity-90 mb-2">Produtos selecionados</p>
                    </div>
                    <Link to="/ofertas" className="inline-block px-3 py-1 bg-white text-orange-600 text-xs font-semibold rounded hover:bg-orange-50 transition-colors self-start">
                      Ver Ofertas
                    </Link>
                  </div>
                </div>

                <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-gradient-to-br from-emerald-300 to-emerald-400 text-white flex-1">
                  <div className="p-3 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <FaTruck className="text-emerald-100 text-xs" />
                        <span className="text-xs font-bold">FRETE GRÁTIS</span>
                      </div>
                      <h3 className="text-sm font-bold mb-1">Entrega Grátis</h3>
                      <p className="text-xs opacity-90 mb-2">Acima de R$ 99</p>
                    </div>
                    <Link to="/frete-gratis" className="inline-block px-3 py-1 bg-white text-emerald-600 text-xs font-semibold rounded hover:bg-emerald-50 transition-colors self-start">
                      Aproveitar
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-8">
              <ProductCarousel 
                title="Mais Vendidos" 
                products={products.sort((a, b) => b.sales - a.sales).slice(0, 10)} 
                loading={loading}
                favorites={favorites}
                favoriteLoading={favoriteLoading}
                onToggleFavorite={handleToggleFavorite}
                setProductModalId={setProductModalId}
                setShowProductModal={setShowProductModal}
              />
              <ProductCarousel 
                title="Bem Avaliados" 
                products={products.filter(p => p.rating >= 4).sort((a, b) => b.rating - a.rating).slice(0, 10)} 
                loading={loading}
                favorites={favorites}
                favoriteLoading={favoriteLoading}
                onToggleFavorite={handleToggleFavorite}
                setProductModalId={setProductModalId}
                setShowProductModal={setShowProductModal}
              />
              <ProductCarousel 
                title="Produtos Recentes" 
                products={products.slice().reverse().slice(0, 10)} 
                loading={loading}
                favorites={favorites}
                favoriteLoading={favoriteLoading}
                onToggleFavorite={handleToggleFavorite}
                setProductModalId={setProductModalId}
                setShowProductModal={setShowProductModal}
              />
            </div>
          </div>
        </main>

        <ProductDetailsModal productId={productModalId} isOpen={showProductModal} onClose={() => { setShowProductModal(false); setProductModalId(null); }} />

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
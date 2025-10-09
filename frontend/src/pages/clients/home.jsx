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
  const debouncedQuery = useDebounce(query, 300); // 300ms debounce
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Contadores (mock)
  // Contador real do carrinho a partir do contexto
  const { count: cartCount, addItem, removeItem, items } = useCart();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useNotifications();
  const [savedCount, setSavedCount] = useState(0);
  const [notifCount] = useState(3);
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(null); // productId being toggled
  const [productModalId, setProductModalId] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // Logo configuration - you can change this to use an image
  const logoConfig = {
    useImage: true, // Set to true to use image instead of text
    imageUrl: '/logo-vertical.png', // Path to your logo image
    altText: 'HelpNet Logo',
    textLogo: 'HelpNet'
  };

  // Category filter options are now handled by the CategoryFilter component

  // Menu lateral do cliente (sem perfil/carrinho/favoritos)
  const clienteMenu = [
    { label: 'Explore', to: '/explorer', icon: <FiSearch className="text-slate-500" /> },
    { label: 'Pedidos', to: '/meus-pedidos', icon: <FiPackage className="text-slate-500" /> },
    { label: 'Histórico', to: '/historico', icon: <FiClock className="text-slate-500" /> },
    { label: 'Meus Cupons', to: '/cupons', icon: <FiCreditCard className="text-slate-500" /> },
    { label: 'Endereços', to: '/enderecos', icon: <FiMapPin className="text-slate-500" /> },
    { label: 'Suporte', to: '/suporte', icon: <FiHelpCircle className="text-slate-500" /> },
    { label: 'Configurações', to: '/configuracoes', icon: <FiSettings className="text-slate-500" /> },
  ];

  // Slides do carrossel - banners funcionais com links para categorias ou promoções
  const slides = [
    {
      id: 1,
      title: 'Ofertas da Semana',
      subtitle: 'Descontos exclusivos em eletrônicos e acessórios',
      cta: { label: 'Ver Ofertas', to: '/promocoes' }, // Link para página de promoções
      image: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1600&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'Novidades em Moda',
      subtitle: 'Coleção outono com até 40% OFF',
      cta: { label: 'Explorar Moda', to: '/categoria/moda' }, // Link para categoria moda
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'Casa e Decoração',
      subtitle: 'Renove seus ambientes com estilo e economia',
      cta: { label: 'Ver Casa & Decor', to: '/categoria/casa-decoracao' }, // Link para categoria casa e decoração
      image: 'https://images.unsplash.com/photo-1505692794403-34d4982f88aa?q=80&w=1600&auto=format&fit=crop'
    }
  ];

  const [activeSlide, setActiveSlide] = useState(0);

  // Estados para funcionalidade de swipe no mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50; // Distância mínima para considerar swipe

  // Rotação automática do carrossel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Funções de navegação do carrossel
  const goPrev = () => setActiveSlide((activeSlide - 1 + slides.length) % slides.length);
  const goNext = () => setActiveSlide((activeSlide + 1) % slides.length);

  // Handlers para swipe no mobile
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
    if (isLeftSwipe) goNext(); // Swipe para esquerda = próximo slide
    if (isRightSwipe) goPrev(); // Swipe para direita = slide anterior
  };

  // Carregar produtos e favoritos da API
  useEffect(() => {
    carregarProdutos();
    carregarFavoritos();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, selectedFilters, sortBy]);

  const carregarProdutos = async () => {
    const cacheKey = 'home_products';

    // Check cache first
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

      // Mapear produtos da API para o formato esperado pelo frontend
      const produtosMapeados = (response.produtos || response).map(produto => ({
        id: produto.ProdutoID || produto.id,
        name: produto.Nome || produto.name,
        price: produto.Preco || produto.price,
        originalPrice: produto.PrecoOriginal || produto.originalPrice,
        image: getFirstValidImage(produto.Imagens),
        images: buildImageUrls(produto.Imagens), // Array of full URLs
        rating: 4.5, // Mock rating - pode ser implementado depois
        sales: Math.floor(Math.random() * 2000) + 100, // Mock sales - pode ser implementado depois
        category: produto.categoria?.Nome || produto.category || 'Geral',
        freeShipping: produto.FreteGratis || produto.freeShipping || false,
        discount: produto.Desconto || produto.discount || 0,
        breveDescricao: produto.BreveDescricao || produto.breveDescricao || '',
        vendedorNome: produto.vendedor?.Nome || null,
        empresaNome: produto.empresa?.Nome || null,
        estoque: produto.Estoque || 0
      }));

      setProducts(produtosMapeados);
      // Cache the results for 10 minutes
      apiCache.set(cacheKey, produtosMapeados, 10 * 60 * 1000);
      log.info('home_products_fetch_success', { total: produtosMapeados.length });
    } catch (error) {
      log.error('home_products_fetch_error', { error: { message: error?.message } });
      // Fallback para produtos mockados em caso de erro
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

    // Check cache first
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
      // Cache favorites for 2 minutes (shorter TTL since favorites change more frequently)
      apiCache.set(cacheKey, favoritesData, 2 * 60 * 1000);
    } catch (error) {
      log.error('home_favorites_fetch_error', { error: error.message });
      setFavorites([]);
      setSavedCount(0);
    } finally {
      setFavoritesLoading(false);
    }
  };

  // Funções para gerenciar filtros
  const removeFilter = (filterValue) => {
    setSelectedFilters(selectedFilters.filter(f => f.value !== filterValue));
  };

  const clearAllFilters = () => {
    setSelectedFilters([]);
    setQuery('');
  };

  // Filtros aplicados
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filtro por texto (usando valor debounced para performance)
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Aplicar filtros selecionados
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

    // Ordenação (evita mutar o array original)
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

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, currentPage, productsPerPage]);

  // Total pages
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

  // Função para adicionar ao carrinho
  const handleAddToCart = (product) => {
    addItem(product, 1);
    showSuccess(`${product.name} adicionado ao carrinho!`);
  };

  // Função para remover do carrinho
  const handleRemoveFromCart = (productId) => {
    removeItem(productId);
    showWarning('Produto removido do carrinho');
  };

  // Verificar se produto está no carrinho
  const isInCart = (productId) => items.some(item => item.id === productId);

  // Verificar se produto está nos favoritos
  const isFavorited = (productId) => favorites.some(fav => fav.produto.ProdutoID === productId);

  // Toggle favorito
  const handleToggleFavorite = async (productId) => {
    if (favoriteLoading) return; // Prevent multiple clicks

    setFavoriteLoading(productId);
    try {
      if (isFavorited(productId)) {
        await favoritoService.remover(productId);
        setFavorites(prev => prev.filter(fav => fav.produto.ProdutoID !== productId));
        setSavedCount(prev => prev - 1);
        // Clear favorites cache since data changed
        apiCache.delete('home_favorites');
      } else {
        await favoritoService.adicionar(productId);
        // Since we don't have the full product data here, we'll just reload favorites
        await carregarFavoritos();
      }
    } catch (error) {
      log.error('home_toggle_favorite_error', { productId, error: error.message });
      // Could show a toast or alert here
    } finally {
      setFavoriteLoading(null);
    }
  };

  // Função para logout
  const handleLogout = () => {
    // Usar notificação em vez de confirm
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
        {/* Header com busca e ícones */}
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

              {/* Barra de pesquisa (desktop) */}
              <div className="flex-1 hidden md:flex items-center max-w-2xl gap-2">
                <div className="relative flex-1">
                  {query && (
                    <button
                      onClick={() => {
                        setQuery('');
                        setSearchResultsOpen(false);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                      aria-label="Voltar"
                    >
                      <FiChevronLeft />
                    </button>
                  )}
                  <FiSearch className={`absolute ${query ? 'left-10' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`} />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSearchResultsOpen(e.target.value.trim().length > 0);
                    }}
                    onFocus={() => query.trim() && setSearchResultsOpen(true)}
                    type="search"
                    placeholder="Buscar produtos, marcas e categorias"
                    className={`w-full ${query ? 'pl-16' : 'pl-10'} pr-4 py-3 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-700 transition-all`}
                  />
                  
                  {/* Dropdown de resultados de pesquisa */}
                  {searchResultsOpen && query.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-700">
                          {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''} para "{query}"
                        </p>
                      </div>
                      {filteredProducts.slice(0, 5).map((product) => (
                        <Link
                          key={product.id}
                          to={`/produto/${product.id}`}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
                          onClick={() => setSearchResultsOpen(false)}
                        >
                          <LazyImage
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg"
                            fallback="/placeholder-image.svg"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-900 truncate">{product.name}</h4>
                            <p className="text-sm text-blue-600 font-semibold">{formatPrice(product.price)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {renderStars(product.rating)}
                          </div>
                        </Link>
                      ))}
                      {filteredProducts.length > 5 && (
                        <div className="p-3 border-t border-slate-100">
                          <Link
                            to={`/explorer?q=${encodeURIComponent(query)}`}
                            className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                            onClick={() => setSearchResultsOpen(false)}
                          >
                            Ver todos os {filteredProducts.length} resultados
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Botão de filtros com dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className="p-3 rounded-full border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    aria-label="Filtros"
                  >
                    <FaFilter />
                  </button>
                  
                  {/* Dropdown de filtros */}
                  {filtersOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-700">Filtros</p>
                      </div>
                      <div className="p-2">
                        {/* Reusable CategoryFilter component for standardized category filtering */}
                        <CategoryFilter
                          selectedCategories={selectedFilters}
                          onCategoryChange={setSelectedFilters}
                          multiSelect={true}
                          showAllOption={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ícones de ação */}
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

            {/* Busca em mobile */}
            <div className="pb-4 md:hidden">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  {query && (
                    <button
                      onClick={() => {
                        setQuery('');
                        setSearchResultsOpen(false);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                      aria-label="Voltar"
                    >
                      <FiChevronLeft />
                    </button>
                  )}
                  <FiSearch className={`absolute ${query ? 'left-10' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`} />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSearchResultsOpen(e.target.value.trim().length > 0);
                    }}
                    onFocus={() => query.trim() && setSearchResultsOpen(true)}
                    type="search"
                    placeholder="Buscar produtos, marcas e categorias"
                    className={`w-full ${query ? 'pl-16' : 'pl-10'} pr-4 py-3 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-700 transition-all`}
                  />
                  
                  {/* Dropdown de resultados de pesquisa mobile */}
                  {searchResultsOpen && query.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-700">
                          {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''} para "{query}"
                        </p>
                      </div>
                      {filteredProducts.slice(0, 5).map((product) => (
                        <Link
                          key={product.id}
                          to={`/produto/${product.id}`}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
                          onClick={() => setSearchResultsOpen(false)}
                        >
                          <LazyImage
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg"
                            fallback="/placeholder-image.svg"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-900 truncate">{product.name}</h4>
                            <p className="text-sm text-blue-600 font-semibold">{formatPrice(product.price)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {renderStars(product.rating)}
                          </div>
                        </Link>
                      ))}
                      {filteredProducts.length > 5 && (
                        <div className="p-3 border-t border-slate-100">
                          <Link
                            to={`/explorer?q=${encodeURIComponent(query)}`}
                            className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                            onClick={() => setSearchResultsOpen(false)}
                          >
                            Ver todos os {filteredProducts.length} resultados
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Botão de filtros mobile */}
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="p-3 rounded-full border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  aria-label="Filtros"
                >
                  <FaFilter />
                </button>
              </div>
            </div>

            {/* Tags de filtros selecionados */}
            {(selectedFilters.length > 0 || query.trim()) && (
              <div className="py-3 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  {query.trim() && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      Busca: "{query}"
                      <button
                        onClick={() => setQuery('')}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedFilters.map((filter) => (
                    <span
                      key={filter.value}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full"
                    >
                      {filter.label}
                      <button
                        onClick={() => removeFilter(filter.value)}
                        className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {(selectedFilters.length > 0 || query.trim()) && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Limpar todos
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Carrossel com Ofertas */}
        <section className="bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Carrossel Principal - com navegação por botões e swipe no mobile */}
              <div
                className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-slate-200"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
              {/* Renderização dos slides do carrossel */}
              {slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${idx === activeSlide ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden={idx !== activeSlide}
                >
                  {/* Imagem do slide com fallback para acessibilidade */}
                  <img
                    src={slide.image}
                    alt={slide.title} // Alt text para acessibilidade
                    className="w-full h-[260px] sm:h-[360px] lg:h-[440px] object-cover"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.svg';
                      e.target.alt = 'Imagem não disponível';
                    }}
                  />
                  {/* Overlay gradiente para melhor legibilidade do texto */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent" />
                  {/* Conteúdo do slide com título, subtítulo e botão de ação */}
                  <div className="absolute inset-0 p-6 sm:p-10 lg:p-14 flex flex-col justify-end">
                    <h2 className="text-2xl sm:text-4xl font-bold text-white drop-shadow">{slide.title}</h2>
                    <p className="text-slate-100 mt-1 sm:mt-2 text-sm sm:text-base max-w-xl">{slide.subtitle}</p>
                    <div className="mt-4">
                      {/* Link para categoria ou promoções usando React Router */}
                      <Link
                        to={slide.cta.to}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-blue-700 font-semibold hover:shadow-md hover:scale-[1.02] transition"
                      >
                        {slide.cta.label}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Controles */}
              <button
                onClick={goPrev}
                aria-label="Anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/90 text-slate-700 hover:bg-white shadow"
              >
                <FiChevronLeft />
              </button>
              <button
                onClick={goNext}
                aria-label="Próximo"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/90 text-slate-700 hover:bg-white shadow"
              >
                <FiChevronRight />
              </button>

              {/* Indicadores */}
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 z-10">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={`h-2 rounded-full transition-all ${i === activeSlide ? 'w-6 bg-white' : 'w-2 bg-white/70 hover:bg-white'}`}
                    aria-label={`Ir para slide ${i + 1}`}
                  />)
                )}
              </div>

              {/* Espaço reservando altura para o carrossel */}
              <div className="invisible">
                <img
                  src={slides[0].image}
                  alt="placeholder"
                  className="w-full h-[260px] sm:h-[360px] lg:h-[440px] object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.svg';
                    e.target.alt = 'Imagem não disponível';
                  }}
                />
              </div>
            </div>

            {/* Containers de Ofertas Desktop */}
            <div className="hidden lg:flex lg:col-span-1 flex-col gap-4 h-[260px] sm:h-[360px] lg:h-[440px]">
              {/* Oferta 1 */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-br from-orange-300 to-orange-400 text-white flex-1">
                <div className="p-4 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FaPercent className="text-orange-100" />
                      <span className="text-sm font-bold">SUPER OFERTA</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1">Até 70% OFF</h3>
                    <p className="text-sm opacity-90 mb-3">Em produtos selecionados</p>
                  </div>
                  <Link
                    to="/ofertas"
                    className="inline-block px-4 py-2 bg-white text-orange-600 text-sm font-semibold rounded-lg hover:bg-orange-50 transition-colors self-start"
                  >
                    Ver Ofertas
                  </Link>
                </div>
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full"></div>
                <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-white/20 rounded-full"></div>
              </div>

              {/* Oferta 2 */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-br from-emerald-300 to-emerald-400 text-white flex-1">
                <div className="p-4 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FaTruck className="text-emerald-100" />
                      <span className="text-sm font-bold">FRETE GRÁTIS</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1">Entrega Grátis</h3>
                    <p className="text-sm opacity-90 mb-3">Em compras acima de R$ 99</p>
                  </div>
                  <Link
                    to="/frete-gratis"
                    className="inline-block px-4 py-2 bg-white text-emerald-600 text-sm font-semibold rounded-lg hover:bg-emerald-50 transition-colors self-start"
                  >
                    Aproveitar
                  </Link>
                </div>
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full"></div>
                <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-white/20 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Containers de Ofertas Mobile - Lado a lado abaixo do carrossel */}
          <div className="lg:hidden mt-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-3">
              {/* Oferta 1 Mobile */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-br from-orange-300 to-orange-400 text-white">
                <div className="p-3 h-full flex flex-col justify-between min-h-[120px]">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <FaPercent className="text-orange-100 text-xs" />
                      <span className="text-xs font-bold">OFERTA</span>
                    </div>
                    <h3 className="text-sm font-bold mb-1">Até 70% OFF</h3>
                    <p className="text-xs opacity-90 mb-2">Produtos selecionados</p>
                  </div>
                  <Link
                    to="/ofertas"
                    className="inline-block px-3 py-1.5 bg-white text-orange-600 text-xs font-semibold rounded-md hover:bg-orange-50 transition-colors self-start"
                  >
                    Ver Ofertas
                  </Link>
                </div>
                <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-white/10 rounded-full"></div>
                <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-white/20 rounded-full"></div>
              </div>

              {/* Oferta 2 Mobile */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-br from-emerald-300 to-emerald-400 text-white">
                <div className="p-3 h-full flex flex-col justify-between min-h-[120px]">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <FaTruck className="text-emerald-100 text-xs" />
                      <span className="text-xs font-bold">FRETE GRÁTIS</span>
                    </div>
                    <h3 className="text-sm font-bold mb-1">Entrega Grátis</h3>
                    <p className="text-xs opacity-90 mb-2">Compras acima de R$ 99</p>
                  </div>
                  <Link
                    to="/frete-gratis"
                    className="inline-block px-3 py-1.5 bg-white text-emerald-600 text-xs font-semibold rounded-md hover:bg-emerald-50 transition-colors self-start"
                  >
                    Aproveitar
                  </Link>
                </div>
                <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-white/10 rounded-full"></div>
                <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-white/20 rounded-full"></div>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* Filtros e Produtos */}
        <section className="py-6 sm:py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Cabeçalho com filtros */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Produtos em Destaque</h3>
                <p className="text-slate-500 text-sm">
                  {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Botão de filtros mobile */}
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="sm:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <FaFilter className="text-xs" />
                  <span className="text-sm">Filtros</span>
                </button>

                {/* Ordenação */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="relevance">Relevância</option>
                  <option value="price-low">Menor preço</option>
                  <option value="price-high">Maior preço</option>
                  <option value="rating">Melhor avaliado</option>
                  <option value="sales">Mais vendidos</option>
                </select>
              </div>
            </div>

            
            {/* Loading de produtos */}
            {loading ? (
              <LoadingSkeleton type="product-grid" />
            ) : (
              /* Grid de produtos */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {paginatedProducts.map((p) => (
            // Card de produto - clicável com efeitos de hover para melhor UX
            <div key={p.id} className="group bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-200 flex flex-col h-full">
            {/* Imagem do produto com link para página individual */}
            <Link to={`/produto/${p.id}`} className="relative aspect-square overflow-hidden">
            <LazyImage
              src={p.image}
              alt={p.name} // Alt text para acessibilidade descrevendo o produto
              className="w-full h-full group-hover:scale-105 transition-transform duration-300"
              fallback="/placeholder-image.svg"
              onError={(e) => {
                console.warn('Failed to load product image:', p.image);
                e.target.src = '/placeholder-image.svg';
              }}
            />

            {/* Badges informativos sobre desconto e frete */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
            {p.discount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded flex items-center gap-0.5 shadow-sm">
            <FaPercent className="text-[8px]" />
            {p.discount}%
            </span>
            )}
            {p.freeShipping && (
            <span className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded flex items-center gap-0.5 shadow-sm">
            <FaTruck className="text-[8px]" />
            Grátis
            </span>
            )}
            {p.estoque <= 0 && (
            <span className="px-1.5 py-0.5 bg-gray-500 text-white text-[10px] font-bold rounded shadow-sm">
            Esgotado
            </span>
            )}
            </div>

            {/* Botão para abrir modal de detalhes do produto */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setProductModalId(p.id);
                setShowProductModal(true);
              }}
              className="absolute top-2 right-12 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm hover:shadow-md transition-all text-slate-700 hover:text-blue-600"
              aria-label="Ver detalhes do produto"
            >
              <FaEye className="text-xs" />
            </button>

            {/* Botão de favorito com estados loading e toggle */}
            <button
            onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleToggleFavorite(p.id);
            }}
            disabled={favoriteLoading === p.id}
            className={`absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm hover:shadow-md transition-all ${
              isFavorited(p.id) ? 'text-red-500' : 'text-slate-700'
            } ${favoriteLoading === p.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isFavorited(p.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
            {favoriteLoading === p.id ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
            ) : isFavorited(p.id) ? (
              <FaHeart className="text-xs fill-current" />
            ) : (
              <FaRegHeart className="text-xs" />
            )}
            </button>
            </Link>
            
            {/* Conteúdo textual do card do produto */}
            <div className="p-3 flex flex-col flex-1">
            {/* Título do produto com link para página individual */}
            <Link to={`/produto/${p.id}`}>
            <h4 className="font-medium text-slate-900 text-sm leading-tight mb-2 line-clamp-2 min-h-[2.5rem] flex-shrink-0 hover:text-blue-700 transition-colors">{p.name}</h4>
            </Link>

            {/* Descrição breve se disponível */}
            {p.breveDescricao && (
              <p className="text-slate-600 text-xs leading-tight mb-2 line-clamp-2 flex-shrink-0">{p.breveDescricao}</p>
            )}

            {/* Avaliação por estrelas e número de vendas */}
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
            {renderStars(p.rating)}
            <span className="text-[10px] text-slate-500">({p.sales.toLocaleString('pt-BR')})</span>
            </div>

            {/* Preço e botão de adicionar ao carrinho */}
            <div className="mt-auto">
            {p.originalPrice && (
            <div className="mb-1">
            <span className="text-[10px] text-slate-400 line-through">{formatPrice(p.originalPrice)}</span>
            </div>
            )}
            <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-blue-700 flex-1 mr-2">{formatPrice(p.price)}</span>
            {/* Botão de carrinho com estados para adicionar/remover */}
            <button
            onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (p.estoque <= 0) return; // Prevent action if out of stock
            if (isInCart(p.id)) {
              handleRemoveFromCart(p.id);
            } else {
              handleAddToCart(p);
            }
            }}
            disabled={p.estoque <= 0}
            className={`p-1.5 rounded-lg text-white transition-colors shadow-sm hover:shadow-md flex-shrink-0 ${
              p.estoque <= 0
                ? 'bg-gray-400 cursor-not-allowed'
                : isInCart(p.id)
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            aria-label={p.estoque <= 0 ? "Produto esgotado" : isInCart(p.id) ? "Remover do carrinho" : "Adicionar ao carrinho"}
            >
            {isInCart(p.id) ? (
              <FaCheck className="text-xs" />
            ) : (
              <FaShoppingCart className="text-xs" />
            )}
            </button>
            </div>
            </div>
            </div>
            </div>
            ))}
            </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && !loading && filteredProducts.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg border ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            )}

            {/* Caso não encontre produtos */}
            {!loading && filteredProducts.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <p className="text-lg mb-2">Nenhum produto encontrado</p>
                <p className="text-sm">Tente ajustar os filtros ou buscar por outros termos</p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Product Details Modal */}
        <ProductDetailsModal
          productId={productModalId}
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setProductModalId(null);
          }}
        />

        {/* Footer simples */}
        <footer className="bg-slate-900 text-slate-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm">© {new Date().getFullYear()} HelpNet. Todos os direitos reservados.</p>
              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-5 text-sm">
                <Link to="/termos" className="hover:text-white transition-colors">Termos</Link>
                <Link to="/politica-privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
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
import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { categoriaService, produtoService, favoritoService } from '../../services/api';
import { log } from '../../utils/logger';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import LazyImage from '../../components/LazyImage';
import ProductDetailsModal from '../../components/ProductDetailsModal';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  FaShoppingCart,
  FaUser,
  FaHeart,
  FaBell,
  FaSearch,
  FaFilter,
  FaCheck,
  FaArrowLeft,
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaSignOutAlt,
  FaPercent,
  FaTruck,
  FaTimes,
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

function ExplorePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { count: cartCount, addItem, removeItem, items } = useCart();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Helper to build full image URL
  const buildImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-image.svg';
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `/api/${cleanPath}`;
  };

  // Estados para busca e filtros na categoria
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [stockMin, setStockMin] = useState('');
  const [stockMax, setStockMax] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [favorites, setFavorites] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [productModalId, setProductModalId] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

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

  // Opções de filtros para categoria
  const categoryFilterOptions = [
    { type: 'price', label: 'Até R$ 100', value: 'price-0-100' },
    { type: 'price', label: 'R$ 100 - R$ 500', value: 'price-100-500' },
    { type: 'price', label: 'R$ 500 - R$ 1000', value: 'price-500-1000' },
    { type: 'price', label: 'Acima de R$ 1000', value: 'price-1000-999999' },
    { type: 'stock', label: 'Em estoque', value: 'stock-1-999999' },
    { type: 'stock', label: 'Estoque baixo (1-10)', value: 'stock-1-10' },
    { type: 'stock', label: 'Estoque alto (50+)', value: 'stock-50-999999' },
    { type: 'rating', label: '4+ estrelas', value: 'rating-4+' },
    { type: 'rating', label: '4.5+ estrelas', value: 'rating-4.5+' },
  ];

  // Carregar categorias e favoritos
  useEffect(() => {
    carregarCategorias();
    carregarFavoritos();
  }, []);

  // Verificar se há categoria na URL
  useEffect(() => {
    const categoriaParam = searchParams.get('categoria');
    if (categoriaParam && categories.length > 0) {
      const category = categories.find(cat => cat.Nome?.toLowerCase() === categoriaParam.toLowerCase());
      if (category) {
        handleCategorySelect(category);
      }
    }
  }, [searchParams, categories]);

  // Read initial filters from URL params
  useEffect(() => {
    if (selectedCategory) {
      const busca = searchParams.get('busca') || '';
      const precoMin = searchParams.get('precoMin') || '';
      const precoMax = searchParams.get('precoMax') || '';
      const estoqueMin = searchParams.get('estoqueMin') || '';
      const estoqueMax = searchParams.get('estoqueMax') || '';

      setCategorySearchQuery(busca);
      setPriceMin(precoMin);
      setPriceMax(precoMax);
      setStockMin(estoqueMin);
      setStockMax(estoqueMax);

      // Reconstruct categoryFilters from params
      const newFilters = [];
      if (precoMin || precoMax) {
        // Find matching price filter
        const priceFilter = categoryFilterOptions.find(f =>
          f.type === 'price' &&
          f.value === `price-${precoMin || '0'}-${precoMax || '999999'}`
        );
        if (priceFilter) newFilters.push(priceFilter);
      }
      if (estoqueMin || estoqueMax) {
        const stockFilter = categoryFilterOptions.find(f =>
          f.type === 'stock' &&
          f.value === `stock-${estoqueMin || '0'}-${estoqueMax || '999999'}`
        );
        if (stockFilter) newFilters.push(stockFilter);
      }
      setCategoryFilters(newFilters);

      // Fetch with initial filters
      if (busca || precoMin || precoMax || estoqueMin || estoqueMax) {
        fetchProductsWithFilters();
      }
    }
  }, [selectedCategory, searchParams]);

  // Aplicar filtros quando produtos mudam
  useEffect(() => {
    if (products.length > 0) {
      setFilteredProducts(products);
    }
  }, [products]);

  // Debounce para busca
  const handleSearchChange = (value) => {
    setCategorySearchQuery(value);

    // Limpar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Definir novo timeout
    const timeout = setTimeout(() => {
      updateUrlParams();
      fetchProductsWithFilters();
    }, 300);

    setSearchTimeout(timeout);
  };

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      log.info('explore_categories_fetch_start');
      const response = await categoriaService.listar();

      // Mapear categorias da API para o formato esperado pelo ExplorePage
      const categoriasMapeadas = (response.categorias || response).map(categoria => ({
        id: categoria.CategoriaID || categoria.id,
        name: categoria.Nome || categoria.nome,
        description: categoria.Descricao || categoria.descricao || '',
        image: categoria.Imagem || categoria.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=400&auto=format&fit=crop'
      }));

      setCategories(categoriasMapeadas);
      log.info('explore_categories_fetch_success', { total: categoriasMapeadas.length });
    } catch (error) {
      log.error('explore_categories_fetch_error', { error: error.message });
      // Fallback para categorias mockadas se a API falhar
      setCategories([
        {
          id: 'cat1',
          name: 'Eletrônicos',
          description: 'Celulares, tablets, computadores e acessórios',
          image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=400&auto=format&fit=crop'
        },
        {
          id: 'cat2',
          name: 'Casa e Decoração',
          description: 'Móveis, decoração e itens para o lar',
          image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=400&auto=format&fit=crop'
        },
        {
          id: 'cat3',
          name: 'Moda e Acessórios',
          description: 'Roupas, calçados e acessórios',
          image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=400&auto=format&fit=crop'
        },
        {
          id: 'cat4',
          name: 'Esportes e Lazer',
          description: 'Equipamentos esportivos e artigos de lazer',
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&auto=format&fit=crop'
        },
        {
          id: 'cat5',
          name: 'Beleza e Saúde',
          description: 'Produtos de beleza, higiene e saúde',
          image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=400&auto=format&fit=crop'
        },
        {
          id: 'cat6',
          name: 'Livros e Entretenimento',
          description: 'Livros, filmes, música e jogos',
          image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=400&auto=format&fit=crop'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const carregarFavoritos = async () => {
    try {
      const response = await favoritoService.listar();
      const favoritosIds = (response.favoritos || []).map(fav => fav.ProdutoID || fav.produtoId);
      setFavorites(favoritosIds);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      setFavorites([]);
    }
  };

  const fetchProductsWithFilters = async () => {
    if (!selectedCategory) return;

    setLoadingProducts(true);

    try {
      log.info('explore_products_fetch_start', { categoryId: selectedCategory.id });

      // Build filters object
      const filtros = {
        categoria: selectedCategory.name,
        status: 'ativo',
        busca: categorySearchQuery.trim() || undefined,
        precoMin: priceMin || undefined,
        precoMax: priceMax || undefined,
        estoqueMin: stockMin || undefined,
        estoqueMax: stockMax || undefined,
      };

      const response = await produtoService.listar(filtros);

      // Mapear produtos da API
      const produtosMapeados = (response.produtos || response).map(produto => ({
        id: produto.ProdutoID || produto.id,
        name: produto.Nome || produto.name,
        price: produto.Preco || produto.price,
        originalPrice: produto.PrecoOriginal || produto.originalPrice,
        image: buildImageUrl(produto.Imagens && produto.Imagens[0]),
        images: (produto.Imagens || []).map(img => buildImageUrl(img)), // Array of full URLs
        rating: 4.5,
        sales: Math.floor(Math.random() * 2000) + 100,
        category: produto.categoria?.Nome || produto.category || selectedCategory.name,
        freeShipping: produto.FreteGratis || produto.freeShipping || false,
        discount: produto.Desconto || produto.discount || 0,
        breveDescricao: produto.BreveDescricao || produto.breveDescricao || '',
        vendedorNome: produto.vendedor?.Nome || null,
        empresaNome: produto.empresa?.Nome || null,
        estoque: produto.Estoque || 0
      }));

      setProducts(produtosMapeados);
      setFilteredProducts(produtosMapeados); // Since API already filters, set both
      log.info('explore_products_fetch_success', { total: produtosMapeados.length });
    } catch (error) {
      log.error('explore_products_fetch_error', { categoryId: selectedCategory.id, error: error.message });
      // Fallback para produtos mockados
      setProducts([
        {
          id: 'p1',
          name: 'Produto Exemplo 1',
          price: 99.90,
          originalPrice: 129.90,
          image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=400&auto=format&fit=crop',
          rating: 4.5,
          sales: 1240,
          category: selectedCategory.name,
          freeShipping: true,
          discount: 23,
          vendedorNome: null,
          empresaNome: null,
          estoque: 10
        }
      ]);
      setFilteredProducts(products);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    // Reset filters when selecting new category
    setCategorySearchQuery('');
    setCategoryFilters([]);
    setPriceMin('');
    setPriceMax('');
    setStockMin('');
    setStockMax('');
    setSortBy('relevance');
    // Update URL params
    setSearchParams({ categoria: category.name });
    // Fetch products
    await fetchProductsWithFilters();
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setProducts([]);
    setFilteredProducts([]);
    setCategorySearchQuery('');
    setCategoryFilters([]);
    setSortBy('relevance');
    setSearchParams({});
  };

  // Função para logout
  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair?')) {
      logout();
      navigate('/login');
    }
  };


  const updateUrlParams = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('categoria', selectedCategory.name);
    if (categorySearchQuery.trim()) params.set('busca', categorySearchQuery.trim());
    if (priceMin) params.set('precoMin', priceMin);
    if (priceMax) params.set('precoMax', priceMax);
    if (stockMin) params.set('estoqueMin', stockMin);
    if (stockMax) params.set('estoqueMax', stockMax);
    setSearchParams(params);
  };

  const removeCategoryFilter = (filterValue) => {
    const newFilters = categoryFilters.filter(f => f.value !== filterValue);
    setCategoryFilters(newFilters);

    // Reset price/stock if removing the last filter of that type
    const filterToRemove = categoryFilters.find(f => f.value === filterValue);
    if (filterToRemove) {
      if (filterToRemove.type === 'price' && !newFilters.some(f => f.type === 'price')) {
        setPriceMin('');
        setPriceMax('');
      } else if (filterToRemove.type === 'stock' && !newFilters.some(f => f.type === 'stock')) {
        setStockMin('');
        setStockMax('');
      }
    }

    updateUrlParams();
    fetchProductsWithFilters();
  };

  const clearCategoryFilters = () => {
    setCategoryFilters([]);
    setCategorySearchQuery('');
    setPriceMin('');
    setPriceMax('');
    setStockMin('');
    setStockMax('');
    updateUrlParams();
    fetchProductsWithFilters();
  };


  const renderStars = (rating) => {
    const stars = [];
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
    const empty = 5 - full - (hasHalf ? 1 : 0);
    for (let i = 0; i < full; i++) stars.push(<FaStar key={`f-${i}`} className="text-yellow-400 text-xs" />);
    if (hasHalf) stars.push(<FaStarHalfAlt key="h" className="text-yellow-400 text-xs" />);
    for (let i = 0; i < empty; i++) stars.push(<FaRegStar key={`e-${i}`} className="text-yellow-400 text-xs" />);
    return <div className="flex items-center gap-1">{stars}</div>;
  };

  const formatPrice = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleAddToCart = (product) => {
    addItem(product, 1);
  };

  const isInCart = (productId) => items.some(item => item.id === productId);

  const isFavorite = (productId) => favorites.includes(productId);

  const toggleFavorite = async (productId) => {
    try {
      if (isFavorite(productId)) {
        await favoritoService.remover(productId);
        setFavorites(prev => prev.filter(id => id !== productId));
      } else {
        await favoritoService.adicionar(productId);
        setFavorites(prev => [...prev, productId]);
      }
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="flex-1 flex items-center justify-center">
          <LoadingSkeleton type="page" message="Carregando categorias..." />
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

        {/* Conteúdo da página */}
        <main className="flex-1 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            {selectedCategory && (
              <div className="mb-6">
                <button
                  onClick={handleBackToCategories}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
                >
                  <FaArrowLeft />
                  <span>Voltar</span>
                </button>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{selectedCategory.name}</h1>
                <p className="text-slate-600 mt-1">{selectedCategory.description}</p>
              </div>
            )}

            {!selectedCategory ? (
              /* Grid de Categorias */
              <>
                <div className="mb-8">
                  <Link
                    to="/home"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
                  >
                    <FaArrowLeft />
                    <span>Voltar para home</span>
                  </Link>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Explore Categorias</h1>
                  <p className="text-slate-600">Descubra produtos incríveis em todas as categorias</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                          {category.description}
                        </p>
                        <div className="flex items-center text-blue-600 font-medium">
                          <span>Ver produtos</span>
                          <FiChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Grid de Produtos da Categoria */
              <>
                {loadingProducts ? (
                  <LoadingSkeleton type="product-grid" />
                ) : (
                  <>
                    {/* Barra de busca e filtros para categoria */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Barra de busca */}
                        <div className="flex-1">
                          <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="search"
                              placeholder={`Buscar em ${selectedCategory.name}...`}
                              value={categorySearchQuery}
                              onChange={(e) => handleSearchChange(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                            />
                          </div>
                        </div>

                        {/* Filtros */}
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <select
                              multiple
                              value={categoryFilters.map(f => f.value)}
                              onChange={(e) => {
                                const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                                const newFilters = categoryFilterOptions.filter(option => selectedValues.includes(option.value));
                                setCategoryFilters(newFilters);

                                // Update price/stock states
                                const priceFilter = newFilters.find(f => f.type === 'price');
                                const stockFilter = newFilters.find(f => f.type === 'stock');

                                if (priceFilter) {
                                  const [min, max] = priceFilter.value.replace('price-', '').split('-').map(v => v === '999999' ? '' : v);
                                  setPriceMin(min || '');
                                  setPriceMax(max || '');
                                } else {
                                  setPriceMin('');
                                  setPriceMax('');
                                }

                                if (stockFilter) {
                                  const [min, max] = stockFilter.value.replace('stock-', '').split('-').map(v => v === '999999' ? '' : v);
                                  setStockMin(min || '');
                                  setStockMax(max || '');
                                } else {
                                  setStockMin('');
                                  setStockMax('');
                                }

                                updateUrlParams();
                                fetchProductsWithFilters();
                              }}
                              className="px-4 py-3 rounded-lg border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-w-[200px]"
                              size="1"
                            >
                              <option value="" disabled>Filtros</option>
                              {categoryFilterOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Ordenação */}
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 rounded-lg border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="relevance">Relevância</option>
                            <option value="price-low">Menor preço</option>
                            <option value="price-high">Maior preço</option>
                            <option value="rating">Melhor avaliado</option>
                            <option value="sales">Mais vendidos</option>
                          </select>
                        </div>
                      </div>

                      {/* Tags de filtros aplicados */}
                      {(categoryFilters.length > 0 || categorySearchQuery.trim()) && (
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                          {categorySearchQuery.trim() && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                              Busca: "{categorySearchQuery}"
                              <button
                                onClick={() => setCategorySearchQuery('')}
                                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                              >
                                <FaTimes className="w-3 h-3" />
                              </button>
                            </span>
                          )}
                          {categoryFilters.map((filter) => (
                            <span
                              key={filter.value}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full"
                            >
                              {filter.label}
                              <button
                                onClick={() => removeCategoryFilter(filter.value)}
                                className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                              >
                                <FaTimes className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          {(categoryFilters.length > 0 || categorySearchQuery.trim()) && (
                            <button
                              onClick={clearCategoryFilters}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Limpar todos
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <p className="text-slate-600">
                        {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                        {categorySearchQuery.trim() || categoryFilters.length > 0 ? ' (filtrados)' : ''}
                      </p>
                    </div>

                    {filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                        {filteredProducts.map((product) => (
                          <div key={product.id} className="group bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition flex flex-col h-full">
                            <Link to={`/produto/${product.id}`} className="relative aspect-square overflow-hidden">
                              <LazyImage src={product.image} alt={product.name} className="w-full h-full group-hover:scale-105 transition-transform duration-300" fallback="/placeholder-image.svg" />

                              {/* Badges */}
                              <div className="absolute top-2 left-2 flex flex-col gap-1">
                                {product.discount > 0 && (
                                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded flex items-center gap-0.5 shadow-sm">
                                    <FaPercent className="text-[8px]" />
                                    {product.discount}%
                                  </span>
                                )}
                                {product.freeShipping && (
                                  <span className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded flex items-center gap-0.5 shadow-sm">
                                    <FaTruck className="text-[8px]" />
                                    Grátis
                                  </span>
                                )}
                                {product.estoque <= 0 && (
                                  <span className="px-1.5 py-0.5 bg-gray-500 text-white text-[10px] font-bold rounded shadow-sm">
                                    Esgotado
                                  </span>
                                )}
                              </div>

                              {/* Eye button */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setProductModalId(product.id);
                                  setShowProductModal(true);
                                }}
                                className="absolute top-2 right-12 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm hover:shadow-md transition-all text-slate-700 hover:text-blue-600"
                                aria-label="Ver detalhes do produto"
                              >
                                <FaEye className="text-xs" />
                              </button>

                              {/* Favorite Button */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleFavorite(product.id);
                                }}
                                className={`absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm hover:shadow-md transition-all ${
                                  isFavorite(product.id) ? 'text-red-500' : 'text-slate-700'
                                }`}
                                aria-label={isFavorite(product.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                              >
                                <FaHeart className={`text-xs ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                              </button>
                            </Link>

                            <div className="p-3 flex flex-col flex-1">
                              <Link to={`/produto/${product.id}`}>
                                <h4 className="font-medium text-slate-900 text-sm leading-tight mb-2 line-clamp-2 min-h-[2.5rem] flex-shrink-0 hover:text-blue-700 transition-colors">
                                  {product.name}
                                </h4>
                              </Link>

                              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                                {renderStars(product.rating)}
                                <span className="text-[10px] text-slate-500">({product.sales.toLocaleString('pt-BR')})</span>
                              </div>

                              <div className="mt-auto">
                                {product.originalPrice && (
                                  <div className="mb-1">
                                    <span className="text-[10px] text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-blue-700 flex-1 mr-2">{formatPrice(product.price)}</span>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (product.estoque <= 0) return; // Prevent action if out of stock
                                      if (isInCart(product.id)) {
                                        removeItem(product.id);
                                      } else {
                                        handleAddToCart(product);
                                      }
                                    }}
                                    disabled={product.estoque <= 0}
                                    className={`p-1.5 rounded-lg text-white transition-colors shadow-sm hover:shadow-md flex-shrink-0 ${
                                      product.estoque <= 0
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : isInCart(product.id)
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                    aria-label={product.estoque <= 0 ? "Produto esgotado" : isInCart(product.id) ? "Remover do carrinho" : "Adicionar ao carrinho"}
                                  >
                                    {isInCart(product.id) ? (
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
                    ) : (
                      <div className="text-center py-16">
                        <p className="text-lg text-slate-600 mb-2">
                          {categorySearchQuery.trim() || categoryFilters.length > 0
                            ? 'Nenhum produto encontrado com os filtros aplicados'
                            : 'Nenhum produto encontrado nesta categoria'
                          }
                        </p>
                        <p className="text-sm text-slate-500">
                          {categorySearchQuery.trim() || categoryFilters.length > 0
                            ? 'Tente ajustar os filtros ou remover a busca'
                            : 'Tente explorar outras categorias'
                          }
                        </p>
                        {(categorySearchQuery.trim() || categoryFilters.length > 0) && (
                          <button
                            onClick={clearCategoryFilters}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Limpar filtros
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>

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
              <div className="flex items-center gap-5 text-sm">
                <Link to="/termos" className="hover:text-white">Termos</Link>
                <Link to="/privacidade" className="hover:text-white">Privacidade</Link>
                <Link to="/contato" className="hover:text-white">Contato</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default ExplorePage;

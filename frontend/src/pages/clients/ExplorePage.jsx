import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { categoriaService, produtoService, favoritoService } from '../../services/api';
import { log } from '../../utils/logger';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import LazyImage from '../../components/LazyImage';
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
  FaTruck
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
  const [sortBy, setSortBy] = useState('relevance');
  const [favorites, setFavorites] = useState([]);

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

  // Opções de filtros para categoria (apenas preço e estrelas)
  const categoryFilterOptions = [
    { type: 'price', label: 'Até R$ 100', value: 'price-100' },
    { type: 'price', label: 'R$ 100 - R$ 500', value: 'price-100-500' },
    { type: 'price', label: 'R$ 500 - R$ 1000', value: 'price-500-1000' },
    { type: 'price', label: 'Acima de R$ 1000', value: 'price-1000+' },
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

  // Aplicar filtros quando produtos mudam
  useEffect(() => {
    if (products.length > 0) {
      setFilteredProducts(products);
      applyFiltersAndSearch();
    }
  }, [products]);

  // Reaplicar filtros quando busca, filtros ou ordenação mudam
  useEffect(() => {
    if (products.length > 0) {
      applyFiltersAndSearch();
    }
  }, [categorySearchQuery, categoryFilters, sortBy]);

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      log.info('explore_categories_fetch_start');
      const response = await categoriaService.listar();

      // Mapear categorias da API
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
      // Fallback para categorias mockadas
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

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setLoadingProducts(true);

    try {
      log.info('explore_products_fetch_start', { categoryId: category.id });
      const response = await produtoService.listar({
        categoria: category.name,
        status: 'ativo'
      });

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
        category: produto.categoria?.Nome || produto.category || category.name,
        freeShipping: produto.FreteGratis || produto.freeShipping || false,
        discount: produto.Desconto || produto.discount || 0,
        breveDescricao: produto.BreveDescricao || produto.breveDescricao || '',
        vendedorNome: produto.vendedor?.Nome || null,
        empresaNome: produto.empresa?.Nome || null
      }));

      setProducts(produtosMapeados);
      log.info('explore_products_fetch_success', { total: produtosMapeados.length });
    } catch (error) {
      log.error('explore_products_fetch_error', { categoryId: category.id, error: error.message });
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
          category: category.name,
          freeShipping: true,
          discount: 23,
          vendedorNome: null,
          empresaNome: null
        }
      ]);
    } finally {
      setLoadingProducts(false);
    }
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

  // Funções para filtros e busca na categoria
  const addCategoryFilter = (filter) => {
    if (!categoryFilters.find(f => f.value === filter.value)) {
      setCategoryFilters([...categoryFilters, filter]);
    }
  };

  const removeCategoryFilter = (filterValue) => {
    setCategoryFilters(categoryFilters.filter(f => f.value !== filterValue));
  };

  const clearCategoryFilters = () => {
    setCategoryFilters([]);
    setCategorySearchQuery('');
  };

  // Aplicar filtros e busca aos produtos
  const applyFiltersAndSearch = () => {
    let filtered = [...products];

    // Filtro por texto
    if (categorySearchQuery.trim()) {
      const q = categorySearchQuery.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.breveDescricao?.toLowerCase().includes(q) ||
        p.vendedorNome?.toLowerCase().includes(q)
      );
    }

    // Aplicar filtros selecionados
    categoryFilters.forEach(filter => {
      switch (filter.type) {
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
      }
    });

    // Ordenação
    if (['price-low','price-high','rating','sales'].includes(sortBy)) {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'price-low':
            return a.price - b.price;
          case 'price-high':
            return b.price - a.price;
          case 'rating':
            return b.rating - a.rating;
          case 'sales':
            return b.sales - a.sales;
          default:
            return 0;
        }
      });
    }

    setFilteredProducts(filtered);
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando categorias...</p>
          </div>
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
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-slate-600">Carregando produtos...</p>
                    </div>
                  </div>
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
                              onChange={(e) => setCategorySearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                            />
                          </div>
                        </div>

                        {/* Filtros */}
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <button
                              onClick={() => setCategoryFilters(categoryFilters.length > 0 ? [] : categoryFilterOptions.slice(0, 4))}
                              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                              <FaFilter className="text-sm" />
                              <span>Filtros</span>
                            </button>

                            {/* Dropdown de filtros */}
                            {categoryFilters.length > 0 && (
                              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                                <div className="p-3 border-b border-slate-100">
                                  <p className="text-sm font-medium text-slate-700">Filtros disponíveis</p>
                                </div>
                                <div className="p-2">
                                  {categoryFilterOptions.map((option) => (
                                    <button
                                      key={option.value}
                                      onClick={() => addCategoryFilter(option)}
                                      disabled={categoryFilters.find(f => f.value === option.value)}
                                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
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
                              </div>

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
                                      if (isInCart(product.id)) {
                                        removeItem(product.id);
                                      } else {
                                        handleAddToCart(product);
                                      }
                                    }}
                                    className={`p-1.5 rounded-lg text-white transition-colors shadow-sm hover:shadow-md flex-shrink-0 ${
                                      isInCart(product.id)
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
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

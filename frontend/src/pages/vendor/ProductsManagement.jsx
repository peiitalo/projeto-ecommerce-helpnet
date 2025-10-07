import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VendorLayout from '../../layouts/VendorLayout';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import LazyImage from '../../components/LazyImage';
import ProductDetailsModal from '../../components/ProductDetailsModal';
import { FiPlus, FiEdit, FiTrash2, FiPackage, FiArchive, FiSearch, FiFilter, FiGrid, FiList } from 'react-icons/fi';
import { FaEye } from 'react-icons/fa';
import { produtoService } from '../../services/api';
import { buildImageUrl } from '../../utils/imageUtils';

function ProductsManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('todos');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [productModalId, setProductModalId] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);


  const [tabs, setTabs] = useState([
    { id: 'todos', label: 'Todos os Produtos', count: 0 },
    { id: 'ativos', label: 'Ativos', count: 0 },
    { id: 'estoque', label: 'Estoque Baixo', count: 0 },
    { id: 'inativos', label: 'Inativos', count: 0 },
  ]);

  const categories = [
    { id: 'todas', label: 'Todas as Categorias' },
    { id: 'eletronicos', label: 'Eletrônicos' },
    { id: 'roupas', label: 'Roupas' },
    { id: 'casa', label: 'Casa e Jardim' },
    { id: 'esportes', label: 'Esportes' },
  ];

  const handleViewProduct = (productId) => {
    setProductModalId(productId);
    setShowProductModal(true);
  };

  const loadProductsForTab = async (tab) => {
    if (!user?.empresaId) return;

    try {
      let filters = {};
      if (tab === 'ativos') filters.status = 'ativo';
      else if (tab === 'estoque') filters = {}; // Carregar todos e filtrar depois
      else if (tab === 'inativos') filters.status = 'inativo';

      const response = await produtoService.listarVendedor(user.empresaId, {
        ...filters,
        pagina: 1,
        limit: 50
      });

      let productsData = response.produtos || [];

      // Filtrar estoque baixo se necessário
      if (tab === 'estoque') {
        productsData = productsData.filter(p => p.Estoque < 10);
      }

      // Mapear dados para o formato esperado pelo componente
      const mappedProducts = productsData.map(product => {
        // Filtrar URLs de blob inválidas e pegar a primeira imagem válida
        const validImages = (product.Imagens || []).filter(img =>
          img && !img.startsWith('blob:') && img.trim() !== ''
        );
        const image = buildImageUrl(validImages[0]);

        return {
          id: product.ProdutoID,
          name: product.Nome,
          price: product.Preco,
          stock: product.Estoque,
          category: product.categoria?.Nome || 'Sem categoria',
          status: product.Ativo ? 'ativo' : 'inativo',
          image: image,
          sku: product.SKU
        };
      });

      setProducts(mappedProducts);
      setTotalProducts(tab === 'estoque' ? productsData.length : response.total || 0);
    } catch (error) {
      console.error('Erro ao carregar produtos da aba:', error);
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      if (!user?.empresaId) return;

      try {
        // Carregar contagens para as abas
        const [allResponse, activeResponse, inactiveResponse] = await Promise.all([
          produtoService.listarVendedor(user.empresaId, { limit: 1000 }),
          produtoService.listarVendedor(user.empresaId, { status: 'ativo', limit: 1000 }),
          produtoService.listarVendedor(user.empresaId, { status: 'inativo', limit: 1000 })
        ]);

        // Calcular contagem de estoque baixo
        const allProducts = allResponse.produtos || [];
        const lowStockCount = allProducts.filter(p => p.Estoque < 10).length;

        // Atualizar contagens das abas
        setTabs([
          { id: 'todos', label: 'Todos os Produtos', count: allResponse.total || 0 },
          { id: 'ativos', label: 'Ativos', count: activeResponse.total || 0 },
          { id: 'estoque', label: 'Estoque Baixo', count: lowStockCount },
          { id: 'inativos', label: 'Inativos', count: inactiveResponse.total || 0 },
        ]);

        // Carregar produtos da aba ativa
        await loadProductsForTab(activeTab);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [user?.empresaId]);

  // Recarregar produtos quando a aba muda
  useEffect(() => {
    if (user?.empresaId && !loading) {
      loadProductsForTab(activeTab);
    }
  }, [activeTab]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todas' || product.category === categories.find(c => c.id === selectedCategory)?.label;
    const matchesTab = activeTab === 'todos' ||
                      (activeTab === 'ativos' && product.status === 'ativo') ||
                      (activeTab === 'estoque' && product.stock < 10) ||
                      (activeTab === 'inativos' && product.status === 'inativo');

    return matchesSearch && matchesCategory && matchesTab;
  });

  const ProductCard = ({ product }) => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 relative">
        <LazyImage
          src={product.image}
          alt={product.name}
          className="w-full h-full"
          fallback="/placeholder-image.svg"
        />
        {product.stock < 10 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Estoque Baixo
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-1 truncate">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
        <p className="text-lg font-bold text-blue-600 mb-2">
          R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-gray-600 mb-3">
          Estoque: <span className={product.stock < 10 ? 'text-red-600 font-medium' : 'text-green-600'}>{product.stock}</span>
        </p>
        <div className="flex space-x-2">
          <Link
            to={`/vendedor/produtos/${product.id}/editar`}
            className="flex-1 bg-blue-600 text-white text-sm px-3 py-2 rounded hover:bg-blue-700 transition-colors text-center"
          >
            Editar
          </Link>
          <button
            onClick={() => handleViewProduct(product.id)}
            className="p-2 text-gray-600 hover:text-blue-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            title="Ver detalhes"
          >
            <FaEye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const ProductRow = ({ product }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center space-x-4">
        <LazyImage
          src={product.image}
          alt={product.name}
          className="w-16 h-16 rounded"
          fallback="/placeholder-image.svg"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
          <p className="text-sm text-gray-600">{product.category}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-blue-600">
            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-600">
            Estoque: <span className={product.stock < 10 ? 'text-red-600' : 'text-green-600'}>{product.stock}</span>
          </p>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/vendedor/produtos/${product.id}/editar`}
            className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Editar
          </Link>
          <button
            onClick={() => handleViewProduct(product.id)}
            className="p-2 text-gray-600 hover:text-blue-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            title="Ver detalhes"
          >
            <FaEye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <VendorLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
            <p className="mt-2 text-gray-600">Gerencie seu catálogo de produtos</p>
          </div>
          <Link
            to="/vendedor/produtos/novo"
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <FiPlus className="w-4 h-4" />
            <span>Adicionar Produto</span>
          </Link>
        </div>

        {/* Tabs - Fixed positioning */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filters and Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <FiFilter className="text-gray-400 w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <FiGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {loading ? (
          <LoadingSkeleton type="product-grid" />
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {totalProducts} produto{totalProducts !== 1 ? 's' : ''} encontrado{totalProducts !== 1 ? 's' : ''}
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </div>
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tente ajustar os filtros ou adicione um novo produto.
                </p>
                <div className="mt-6">
                  <Link
                    to="/vendedor/produtos/novo"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Adicionar Produto
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Details Modal */}
      <ProductDetailsModal
        productId={productModalId}
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setProductModalId(null);
        }}
      />
    </VendorLayout>
  );
}

export default ProductsManagement;

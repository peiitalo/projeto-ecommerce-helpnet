import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { produtoService } from '../../services/api';
import VendorLayout from '../../components/VendorLayout.jsx';
import {
  FaSearch,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaBox,
  FaShoppingCart,
  FaExclamationTriangle
} from 'react-icons/fa';

function VendorProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  // Statistics
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.status === 'ativo').length;
    const outOfStock = products.filter(p => p.estoque <= 0).length;

    return { total, active, outOfStock };
  }, [products]);

  useEffect(() => {
    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    if (!user?.empresaId) return;

    try {
      setLoading(true);
      const response = await produtoService.listarVendedor(user.empresaId);
      setProducts(response.produtos || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(product =>
      product.Nome?.toLowerCase().includes(query) ||
      product.SKU?.toLowerCase().includes(query) ||
      product.categoria?.Nome?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleDelete = async (productId) => {
    if (!user?.empresaId) return;

    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await produtoService.excluirVendedor(user.empresaId, productId);
        setProducts(prev => prev.filter(p => p.ProdutoID !== productId));
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto');
      }
    }
  };

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Gerenciar produtos</h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base">
                {stats.total} produto{stats.total !== 1 ? 's' : ''} encontrado{stats.total !== 1 ? 's' : ''}
              </p>
            </div>
            <Link
              to="/vendedor/produtos/novo"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <FaPlus className="text-sm" />
              Novo produto
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, SKU ou categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                <FaBox className="text-blue-600 text-lg sm:text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-600">Total de produtos</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                <FaShoppingCart className="text-green-600 text-lg sm:text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-600">Produtos ativos</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-red-100 rounded-lg flex-shrink-0">
                <FaExclamationTriangle className="text-red-600 text-lg sm:text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-600">Sem estoque</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.outOfStock}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table/List */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Carregando produtos...</p>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="p-8 text-center">
              <FaBox className="text-6xl text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
              </h3>
              <p className="text-slate-600 mb-4">
                {searchQuery
                  ? 'Tente ajustar sua busca'
                  : 'Comece adicionando seu primeiro produto'
                }
              </p>
              {!searchQuery && (
                <Link
                  to="/vendedor/produtos/novo"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPlus className="text-sm" />
                  Adicionar produto
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Preço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Estoque
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Vendas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {paginatedProducts.map((product) => (
                      <tr key={product.ProdutoID} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-lg object-cover"
                                src={product.Imagens?.[0] || '/placeholder-image.svg'}
                                alt={product.Nome}
                                onError={(e) => {
                                  e.target.src = '/placeholder-image.svg';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900">
                                {product.Nome}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {formatPrice(product.Preco)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {product.estoque || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {product.vendas || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {product.SKU || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {product.categoria?.Nome || 'Sem categoria'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.status === 'ativo'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/vendedor/produtos/${product.ProdutoID}`}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Ver"
                            >
                              <FaEye />
                            </Link>
                            <Link
                              to={`/vendedor/produtos/${product.ProdutoID}/editar`}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Editar"
                            >
                              <FaEdit />
                            </Link>
                            <button
                              onClick={() => handleDelete(product.ProdutoID)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Excluir"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-200">
                {paginatedProducts.map((product) => (
                  <div key={product.ProdutoID} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start gap-3">
                      <img
                        className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                        src={product.Imagens?.[0] || '/placeholder-image.svg'}
                        alt={product.Nome}
                        onError={(e) => {
                          e.target.src = '/placeholder-image.svg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-slate-900 truncate">
                              {product.Nome}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                              {product.SKU || 'Sem SKU'} • {product.categoria?.Nome || 'Sem categoria'}
                            </p>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 flex-shrink-0 ${
                            product.status === 'ativo'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">Preço:</span>
                            <span className="ml-1 font-medium text-slate-900">{formatPrice(product.Preco)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Estoque:</span>
                            <span className="ml-1 font-medium text-slate-900">{product.estoque || 0}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Vendas:</span>
                            <span className="ml-1 font-medium text-slate-900">{product.vendas || 0}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Link
                              to={`/vendedor/produtos/${product.ProdutoID}`}
                              className="text-blue-600 hover:text-blue-900 p-2"
                              title="Ver"
                            >
                              <FaEye className="text-sm" />
                            </Link>
                            <Link
                              to={`/vendedor/produtos/${product.ProdutoID}/editar`}
                              className="text-green-600 hover:text-green-900 p-2"
                              title="Editar"
                            >
                              <FaEdit className="text-sm" />
                            </Link>
                            <button
                              onClick={() => handleDelete(product.ProdutoID)}
                              className="text-red-600 hover:text-red-900 p-2"
                              title="Excluir"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-slate-700 text-center sm:text-left">
                  Mostrando {((currentPage - 1) * productsPerPage) + 1} a{' '}
                  {Math.min(currentPage * productsPerPage, filteredProducts.length)} de{' '}
                  {filteredProducts.length} resultados
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-slate-700 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </VendorLayout>
  );
}

export default VendorProductsPage;
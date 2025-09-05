import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { produtoService, categoriaService } from '../../services/api';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaTruck,
  FaPercent,
  FaImage,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import {
  FiPackage,
  FiTag,
  FiDollarSign,
  FiBox,
  FiCalendar,
  FiMoreVertical,
  FiChevronDown,
  FiX
} from 'react-icons/fi';

function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [error, setError] = useState('');

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
  }, []);

  // Recarregar produtos quando filtros mudarem
  useEffect(() => {
    if (!loading) {
      carregarProdutos();
    }
  }, [searchTerm, filterCategory, filterStatus]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError('');

      // Carregar categorias e produtos em paralelo
      const [categoriasResponse, produtosResponse] = await Promise.all([
        categoriaService.listar(),
        produtoService.listar()
      ]);

      setCategories(categoriasResponse);
      setProducts(produtosResponse.produtos || produtosResponse);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const carregarProdutos = async () => {
    try {
      const filtros = {};
      
      if (searchTerm) filtros.busca = searchTerm;
      if (filterCategory) filtros.categoria = filterCategory;
      if (filterStatus) filtros.status = filterStatus;

      const response = await produtoService.listar(filtros);
      setProducts(response.produtos || response);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setError('Erro ao carregar produtos.');
    }
  };

  const filteredProducts = products.filter(product => {
    // Suporte a diferentes formatos vindos do backend
    const nome = product.nome || product.Nome || '';
    const sku = product.sku || product.SKU || '';
    const categoriaId = product.categoriaId || product.CategoriaID || product.categoriaId || '';
    const ativo = product.ativo !== undefined ? product.ativo : (product.Ativo !== undefined ? product.Ativo : true);
    const estoque = product.estoque !== undefined ? product.estoque : (product.Estoque !== undefined ? product.Estoque : 0);

    const matchesSearch = (nome?.toLowerCase().includes(searchTerm.toLowerCase()) || sku?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !filterCategory || categoriaId.toString() === filterCategory;
    const matchesStatus = !filterStatus || 
      (filterStatus === 'ativo' && ativo) ||
      (filterStatus === 'inativo' && !ativo) ||
      (filterStatus === 'sem-estoque' && estoque === 0);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkAction = (action) => {
    console.log(`Ação em lote: ${action} para produtos:`, selectedProducts);
    // Implementar ações em lote
    setSelectedProducts([]);
    setShowBulkActions(false);
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const formatPrice = (price) => {
  const value = Number(price);
  if (isNaN(value) || value == null) return "R$ 0,00";
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

  const getStatusBadge = (product) => {
    if (!product.ativo) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Inativo</span>;
    }
    if (product.estoque === 0) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Sem estoque</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Ativo</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Gerenciar Produtos</h1>
              <p className="text-slate-600 mt-1">
                {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <FaFilter className="text-sm" />
                Filtros
              </button>
              <Link
                to="/admin/produtos/novo"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus className="text-sm" />
                Novo Produto
              </Link>
            </div>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Filtros</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <FiX />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map(cat => (
                    <option key={cat.CategoriaID || cat.id} value={cat.CategoriaID || cat.id}>
                      {cat.Nome || cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os status</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="sem-estoque">Sem estoque</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterCategory('');
                    setFilterStatus('');
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barra de pesquisa */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Ações em lote */}
        {selectedProducts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 font-medium">
                {selectedProducts.length} produto{selectedProducts.length !== 1 ? 's' : ''} selecionado{selectedProducts.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('ativar')}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Ativar
                </button>
                <button
                  onClick={() => handleBulkAction('desativar')}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Desativar
                </button>
                <button
                  onClick={() => handleBulkAction('excluir')}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Excluir
                </button>
                <button
                  onClick={() => setSelectedProducts([])}
                  className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de produtos */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Vendas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                          {Array.isArray(product.imagens) && product.imagens.length > 0 && product.imagens[0] ? (
                            <img
                              src={product.imagens[0]}
                              alt={product.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FaImage className="text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 truncate">{product.nome}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {product.freteGratis && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                <FaTruck className="text-xs" />
                                Frete Grátis
                              </span>
                            )}
                            {product.desconto > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                <FaPercent className="text-xs" />
                                {product.desconto}% OFF
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-600">{product.sku}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-slate-900">{formatPrice(product.preco)}</span>
                        {product.precoOriginal && (
                          <div className="text-sm text-slate-500 line-through">
                            {formatPrice(product.precoOriginal)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${product.estoque === 0 ? 'text-red-600' : product.estoque < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {product.estoque}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600">{product.categoria}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(product)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600">{product.vendas.toLocaleString('pt-BR')}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/produto/${product.id}`}
                          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Visualizar"
                        >
                          <FaEye />
                        </Link>
                        <Link
                          to={`/admin/produtos/${product.id}/editar`}
                          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
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

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <FiPackage className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-slate-500 mb-6">
                {searchTerm || filterCategory || filterStatus
                  ? 'Tente ajustar os filtros ou termo de busca.'
                  : 'Comece adicionando seu primeiro produto.'}
              </p>
              <Link
                to="/admin/produtos/novo"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus className="text-sm" />
                Adicionar Produto
              </Link>
            </div>
          )}
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiPackage className="text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-900">{products.length}</p>
                <p className="text-slate-600 text-sm">Total de Produtos</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaCheck className="text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-900">
                  {products.filter(p => p.ativo).length}
                </p>
                <p className="text-slate-600 text-sm">Produtos Ativos</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiBox className="text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-900">
                  {products.filter(p => p.estoque === 0).length}
                </p>
                <p className="text-slate-600 text-sm">Sem Estoque</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiDollarSign className="text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-900">
                  {products.reduce((sum, p) => sum + p.vendas, 0).toLocaleString('pt-BR')}
                </p>
                <p className="text-slate-600 text-sm">Total de Vendas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default ProductsManagement;
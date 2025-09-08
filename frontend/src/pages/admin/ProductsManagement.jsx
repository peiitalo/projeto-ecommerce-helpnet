import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Link, useLocation } from "react-router-dom";
import {
  FaPlus,
  FaFilter,
  FaSearch,
  FaTruck,
  FaPercent,
  FaImage,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheck,
} from "react-icons/fa";
import { FiX, FiPackage, FiBox, FiDollarSign } from "react-icons/fi";
import { produtoService, categoriaService } from "../../services/api";

// Modo vendedor: pegar empresaId do usuário logado
const storedUserPM = (() => { try { return JSON.parse(localStorage.getItem('auth:user') || 'null'); } catch { return null; } })();
const EMPRESA_ID_MVP = storedUserPM?.empresaId || 1;

function ProductsManagement() {
  const location = useLocation();
  const isVendor = location.pathname.startsWith('/vendedor');
  const basePath = isVendor ? '/vendedor' : '/admin';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (!loading) {
      carregarProdutos();
    }
  }, [searchTerm, filterCategory, filterStatus]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError("");

      const [categoriasResponse, produtosResponse] = await Promise.all([
        categoriaService.listar(),
        produtoService.listarVendedor(EMPRESA_ID_MVP),
      ]);

      setCategories(categoriasResponse);
      setProducts(produtosResponse.produtos || produtosResponse);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar dados. Tente novamente.");
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

      const response = await produtoService.listarVendedor(EMPRESA_ID_MVP, filtros);
      setProducts(response.produtos || response);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setError("Erro ao carregar produtos.");
    }
  };

  const filteredProducts = products.filter((product) => {
    const nome = product.nome ?? product.Nome ?? "";
    const sku = product.sku ?? product.SKU ?? "";
    const categoriaId = product.categoriaId ?? product.CategoriaID ?? "";
    const ativo = product.ativo ?? product.Ativo ?? true;
    const estoque = product.estoque ?? product.Estoque ?? 0;

    const matchesSearch =
      nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !filterCategory || categoriaId.toString() === filterCategory;
    const matchesStatus =
      !filterStatus ||
      (filterStatus === "ativo" && ativo) ||
      (filterStatus === "inativo" && !ativo) ||
      (filterStatus === "sem-estoque" && estoque === 0);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSelectProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id ?? p.ProdutoID));
    }
  };

  const handleBulkAction = (action) => {
    try {
      console.log(`Ação em lote: ${action} para produtos:`, selectedProducts);
      // TODO: implementar ações em lote (ativar, desativar, excluir)
      setSelectedProducts([]);
    } catch (error) {
      console.error("Erro na ação em lote:", error);
      setError("Erro ao executar ação em lote. Tente novamente.");
    }
  };

   const handleDeleteProduct = async (productId) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        setError("");

        // Chama API para excluir/desativar o produto no backend
        const result = await produtoService.excluirVendedor(EMPRESA_ID_MVP, productId);

        // Recarrega a lista a partir do servidor para refletir o estado real
        await carregarProdutos();

        // Limpa seleção do item removido
        setSelectedProducts((prev) => prev.filter((id) => id !== productId));

        // Feedback para o usuário (pode vir "Produto desativado" se houver pedidos)
        if (result?.mensagem) {
          alert(result.mensagem);
        } else {
          alert("Produto excluído com sucesso!");
        }
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
        setError("Erro ao excluir produto. Tente novamente.");
      }
    }
  };

  const formatPrice = (price) => {
    const value = Number(price);
    if (isNaN(value) || value == null) return "R$ 0,00";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getStatusBadge = (product) => {
    const ativo = product.ativo ?? product.Ativo ?? true;
    const estoque = product.estoque ?? product.Estoque ?? 0;

    if (!ativo) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
          Inativo
        </span>
      );
    }
    if (estoque === 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
          Sem estoque
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
        Ativo
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Gerenciar Produtos
              </h1>
              <p className="text-slate-600 mt-1">
                {filteredProducts.length} produto
                {filteredProducts.length !== 1 ? "s" : ""} encontrado
                {filteredProducts.length !== 1 ? "s" : ""}
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
                to={`${basePath}/produtos/novo`}
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categoria
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((cat) => (
                    <option
                      key={cat.CategoriaID ?? cat.id}
                      value={cat.CategoriaID ?? cat.id}
                    >
                      {cat.Nome ?? cat.name ?? "—"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
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
                    setFilterCategory("");
                    setFilterStatus("");
                    setSearchTerm("");
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
                {selectedProducts.length} produto
                {selectedProducts.length !== 1 ? "s" : ""} selecionado
                {selectedProducts.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction("ativar")}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Ativar
                </button>
                <button
                  onClick={() => handleBulkAction("desativar")}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Desativar
                </button>
                <button
                  onClick={() => handleBulkAction("excluir")}
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
                      checked={
                        selectedProducts.length === filteredProducts.length &&
                        filteredProducts.length > 0
                      }
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
                {filteredProducts.map((product, index) => {
                  const productId = product.id ?? product.ProdutoID ?? index;
                  const nome = product.nome ?? product.Nome ?? "";
                  const sku = product.sku ?? product.SKU ?? "";
                  const preco = Number(product.preco ?? product.Preco ?? product.precoUnitario ?? 0);
                  const vendas = product.vendas ?? 0;
                  const estoque = product.estoque ?? product.Estoque ?? 0;
                  const categoriaNome =
                    product.categoria?.Nome ?? product.categoria?.name ?? "—";

                  return (
                    <tr key={productId} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(productId)}
                          onChange={() => handleSelectProduct(productId)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                            {Array.isArray(product.imagens) &&
                            product.imagens.length > 0 &&
                            product.imagens[0] ? (
                              <img
                                src={product.imagens[0]}
                                alt={nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FaImage className="text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 truncate">
                              {nome}
                            </p>
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
                        <span className="font-mono text-sm text-slate-600">
                          {sku}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-slate-900">
                            {formatPrice(preco)}
                          </span>
                          {product.precoOriginal && (
                            <div className="text-sm text-slate-500 line-through">
                              {formatPrice(product.precoOriginal)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-medium ${
                            estoque === 0
                              ? "text-red-600"
                              : estoque < 10
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {estoque}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600">{categoriaNome}</span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(product)}</td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600">
                          {vendas.toLocaleString("pt-BR")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/produto/${productId}`}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Visualizar"
                          >
                            <FaEye />
                          </Link>
                          <Link
                            to={`${basePath}/produtos/${productId}/editar`}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(productId)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <FiPackage className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-slate-500 mb-6">
                {searchTerm || filterCategory || filterStatus
                  ? "Tente ajustar os filtros ou termo de busca."
                  : "Comece adicionando seu primeiro produto."}
              </p>
              <Link
                to={`${basePath}/produtos/novo`}
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
                <p className="text-2xl font-bold text-slate-900">
                  {products.length}
                </p>
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
                  {products.filter((p) => p.ativo ?? p.Ativo ?? true).length}
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
                  {
                    products.filter((p) => (p.estoque ?? p.Estoque ?? 0) === 0)
                      .length
                  }
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
                  {products
                    .reduce((sum, p) => sum + (p.vendas ?? 0), 0)
                    .toLocaleString("pt-BR")}
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

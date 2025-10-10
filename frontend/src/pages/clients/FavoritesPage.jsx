import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaHeart,
  FaShoppingCart,
  FaArrowLeft,
  FaRegHeart,
  FaTrash,
} from 'react-icons/fa';
import { favoritoService } from '../../services/api';
import { log } from '../../utils/logger';
import { useCart } from '../../context/CartContext';
import { buildImageUrl } from '../../utils/imageUtils';

function FavoritesPage() {
  const navigate = useNavigate();
  const { addItem, removeItem, items } = useCart();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingIds, setRemovingIds] = useState(new Set());

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    setError('');
    try {
      log.info('favorites_fetch_start');
      const data = await favoritoService.listar();
      setFavorites(data.favoritos || []);
      log.info('favorites_fetch_success', { count: data.favoritos?.length || 0 });
    } catch (err) {
      log.error('favorites_fetch_error', { error: err?.message });
      setError(err.message || 'Erro ao carregar favoritos');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (produtoId) => {
    setRemovingIds(prev => new Set(prev).add(produtoId));
    try {
      await favoritoService.remover(produtoId);
      setFavorites(prev => prev.filter(fav => fav.produto.ProdutoID !== produtoId));
      log.info('favorite_removed', { produtoId });
    } catch (err) {
      log.error('favorite_remove_error', { produtoId, error: err?.message });
      setError('Erro ao remover dos favoritos');
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(produtoId);
        return newSet;
      });
    }
  };

  const handleAddToCart = (produto) => {
    const mapped = {
      id: produto.ProdutoID,
      name: produto.Nome,
      price: Number(produto.Preco),
      image: Array.isArray(produto.Imagens) ? produto.Imagens[0] : null,
      sku: produto.SKU,
      estoque: produto.Estoque,
    };
    addItem(mapped, 1);
  };

  const isInCart = (produtoId) => {
    return items.some(item => item.id === produtoId);
  };

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando favoritos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchFavorites}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-slate-600 hover:text-blue-700 transition-colors"
              aria-label="Voltar"
            >
              <FaArrowLeft className="text-lg" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">Meus Favoritos</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <FaRegHeart className="text-6xl text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Nenhum favorito ainda</h2>
            <p className="text-slate-600 mb-6">Adicione produtos aos seus favoritos para vê-los aqui.</p>
            <Link
              to="/home"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explorar produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite) => {
              const produto = favorite.produto;
              const isRemoving = removingIds.has(produto.ProdutoID);
              const inCart = isInCart(produto.ProdutoID);

              return (
                <div
                  key={produto.ProdutoID}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Correção: Padronização de URLs de imagem usando buildImageUrl para consistência */}
                  <div className="relative aspect-square">
                    <Link to={`/produto/${produto.ProdutoID}`}>
                      {produto.Imagens && produto.Imagens.length > 0 ? (
                        <img
                          src={buildImageUrl(produto.Imagens[0])}
                          alt={produto.Nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <span className="text-slate-400">Sem imagem</span>
                        </div>
                      )}
                    </Link>

                    {/* Botão remover favorito */}
                    <button
                      onClick={() => handleRemoveFavorite(produto.ProdutoID)}
                      disabled={isRemoving}
                      className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors disabled:opacity-50"
                      title="Remover dos favoritos"
                    >
                      {isRemoving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <FaHeart className="text-red-500 text-sm" />
                      )}
                    </button>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4">
                    <Link to={`/produto/${produto.ProdutoID}`}>
                      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                        {produto.Nome}
                      </h3>
                    </Link>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-blue-700">
                        {formatPrice(produto.Preco)}
                      </span>
                      {produto.SKU && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {produto.SKU}
                        </span>
                      )}
                    </div>

                    {/* Botão adicionar ao carrinho */}
                    <button
                      onClick={() => handleAddToCart(produto)}
                      disabled={inCart}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        inCart
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <FaShoppingCart className="text-sm" />
                      <span>{inCart ? 'No carrinho' : 'Adicionar'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FavoritesPage;
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import LazyImage from './LazyImage';
import {
  FaShoppingCart,
  FaHeart,
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaTruck,
  FaPercent,
  FaCheck,
  FaRegHeart,
  FaEye,
  FaImage
} from 'react-icons/fa';

function ProductCarousel({ title, products, loading, favorites = [], favoriteLoading = null, onToggleFavorite, setProductModalId, setShowProductModal, onRequireAuth }) {
  const { addItem, removeItem, items } = useCart();
  const { user } = useAuth();
  const { showSuccess, showWarning } = useNotifications();

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
    console.log('[ProductCarousel] Add to cart clicked for product:', product.id);
    if (!user) {
      console.log('[ProductCarousel] User not logged in, showing auth modal');
      onRequireAuth && onRequireAuth();
      return;
    }
    console.log('[ProductCarousel] User logged in, adding to cart');
    addItem(product, 1);
    showSuccess(`${product.name} adicionado ao carrinho!`);
  };

  const handleRemoveFromCart = (productId) => {
    removeItem(productId);
    showWarning('Produto removido do carrinho');
  };

  const isInCart = (productId) => items.some(item => item.id === productId);

  const isFavorite = (productId) => favorites.some(fav => fav.produto?.ProdutoID === productId || fav.ProdutoID === productId || fav.produtoId === productId);

  if (loading) {
    return (
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 animate-pulse">
              <div className="aspect-square bg-slate-200 rounded mb-2"></div>
              <div className="h-3 bg-slate-200 rounded mb-1"></div>
              <div className="h-2 bg-slate-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>

      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 pb-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 w-48"
            >
              {/* Container principal do produto - SEMPRE navega para a página */}
              <Link 
                to={`/produto/${product.id}`} 
                className="relative aspect-square overflow-hidden block cursor-pointer"
                onClick={() => console.log('[ProductCarousel] Product link clicked:', product.id)}
              >
                {product.images && product.images.length > 0 ? (
                  <LazyImage
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    fallback="/placeholder-image.svg"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <FaImage className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sem imagem</p>
                    </div>
                  </div>
                )}

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

                {/* Botão de visualização rápida - APENAS abre o modal */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[ProductCarousel] Quick view button clicked for product:', product.id);
                    setProductModalId && setProductModalId(product.id);
                    setShowProductModal && setShowProductModal(true);
                  }}
                  className="absolute top-2 right-12 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm hover:shadow-md transition-all text-slate-700 hover:text-blue-600 z-10"
                  aria-label="Ver detalhes do produto"
                  title="Visualização rápida"
                >
                  <FaEye className="text-xs" />
                </button>

                {onToggleFavorite && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('[ProductCarousel] Favorite button clicked for product:', product.id);
                      if (!user) {
                        console.log('[ProductCarousel] User not logged in for favorite, showing auth modal');
                        onRequireAuth && onRequireAuth();
                        return;
                      }
                      console.log('[ProductCarousel] User logged in for favorite, toggling');
                      onToggleFavorite(product.id);
                    }}
                    disabled={favoriteLoading === product.id}
                    className={`absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm hover:shadow-md transition-all z-10 ${
                      isFavorite(product.id) ? 'text-red-500' : 'text-slate-700'
                    } ${favoriteLoading === product.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label={isFavorite(product.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  >
                    <FaHeart className={`text-xs ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                  </button>
                )}
              </Link>

              <div className="p-3">
                <Link to={`/produto/${product.id}`}>
                  <h4 
                    className="font-medium text-slate-900 text-sm leading-tight mb-2 line-clamp-2 min-h-[2.5rem] flex-shrink-0 hover:text-blue-700 transition-colors cursor-pointer"
                    title="Clique para ver detalhes completos"
                    onClick={() => console.log('[ProductCarousel] Product name clicked:', product.id)}
                  >
                    {product.name}
                  </h4>
                </Link>

                <div className="flex items-center justify-between mb-2">
                  {renderStars(product.rating)}
                  <span className="text-[10px] text-slate-500">({product.reviewCount || 0})</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-700">{formatPrice(product.price)}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isInCart(product.id)) {
                        handleRemoveFromCart(product.id);
                      } else {
                        handleAddToCart(product);
                      }
                    }}
                    className={`p-1.5 rounded-lg text-white transition-colors shadow-sm hover:shadow-md ${
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
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductCarousel;
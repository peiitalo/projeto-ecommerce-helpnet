import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
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
  FaEye
} from 'react-icons/fa';
import {
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

function ProductCarousel({ title, products, loading, favorites = [], favoriteLoading = null, onToggleFavorite, setProductModalId, setShowProductModal }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { addItem, removeItem, items } = useCart();
  const { showSuccess, showWarning } = useNotifications();

  const getItemsPerView = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 4;
      if (window.innerWidth >= 768) return 3;
      if (window.innerWidth >= 640) return 2;
      return 2;
    }
    return 4;
  };

  const [itemsPerView, setItemsPerView] = useState(getItemsPerView());

  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView());
      setActiveIndex(0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, Math.ceil(products.length / itemsPerView) - 1);

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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {products.length > itemsPerView && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              className="p-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronLeft className="text-sm" />
            </button>
            <button
              onClick={() => setActiveIndex(Math.min(maxIndex, activeIndex + 1))}
              disabled={activeIndex === maxIndex}
              className="p-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronRight className="text-sm" />
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden">
        <div className="flex gap-3 transition-transform duration-300 ease-in-out">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex-shrink-0 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 w-48"
              style={{
                transform: `translateX(-${activeIndex * (192 + 12)}px)`
              }}
            >
              <Link to={`/produto/${product.id}`} className="relative aspect-square overflow-hidden block">
                <LazyImage
                  src={product.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=400&auto=format&fit=crop'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  fallback="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=400&auto=format&fit=crop"
                />

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

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setProductModalId && setProductModalId(product.id);
                    setShowProductModal && setShowProductModal(true);
                  }}
                  className="absolute top-2 right-12 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm hover:shadow-md transition-all text-slate-700 hover:text-blue-600"
                  aria-label="Ver detalhes do produto"
                >
                  <FaEye className="text-xs" />
                </button>

                {onToggleFavorite && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleFavorite(product.id);
                    }}
                    disabled={favoriteLoading === product.id}
                    className={`absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm hover:shadow-md transition-all ${
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
                  <h4 className="font-medium text-slate-900 text-sm leading-tight mb-2 line-clamp-2 min-h-[2.5rem] flex-shrink-0 hover:text-blue-700 transition-colors">
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

      {products.length > itemsPerView && (
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? 'w-4 bg-blue-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductCarousel;
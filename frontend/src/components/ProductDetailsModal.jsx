import { useState, useEffect } from 'react';
import { FaTimes, FaEye, FaSpinner } from 'react-icons/fa';
import LazyImage from './LazyImage';
import { produtoService } from '../services/api';
import { buildImageUrl } from '../utils/imageUtils';

const ProductDetailsModal = ({ productId, isOpen, onClose }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen && productId) {
      fetchProductDetails();
    }
  }, [isOpen, productId]);

  const fetchProductDetails = async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await produtoService.buscarPorId(productId);
      setProduct(response);
      setCurrentImageIndex(0);
    } catch (err) {
      console.error('Erro ao buscar detalhes do produto:', err);
      setError('Erro ao carregar detalhes do produto');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setProduct(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaEye className="text-blue-600" />
              Detalhes do Produto
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Fechar"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FaSpinner className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Carregando detalhes do produto...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchProductDetails}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Product Details */}
          {product && !loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Images Section */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="aspect-square bg-gray-100 relative rounded-lg overflow-hidden">
                  <LazyImage
                    src={buildImageUrl(product.Imagens?.[currentImageIndex])}
                    alt={product.Nome}
                    className="w-full h-full object-cover"
                    fallback="/placeholder-image.svg"
                  />
                </div>

                {/* Thumbnail Images */}
                {product.Imagens && product.Imagens.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.Imagens.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                          currentImageIndex === index ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <LazyImage
                          src={buildImageUrl(image)}
                          alt={`${product.Nome} ${index + 1}`}
                          className="w-full h-full object-cover"
                          fallback="/placeholder-image.svg"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="space-y-4">
                {/* Basic Info */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.Nome}</h3>
                  <p className="text-sm text-gray-600">SKU: {product.SKU}</p>
                  {product.categoria && (
                    <p className="text-sm text-gray-600">Categoria: {product.categoria.Nome}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    R$ {product.Preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {product.PrecoOriginal && product.PrecoOriginal > product.Preco && (
                    <p className="text-sm text-gray-400 line-through">
                      R$ {product.PrecoOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                {/* Stock */}
                <div>
                  <p className="text-sm text-gray-600">
                    Estoque: <span className={product.Estoque > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {product.Estoque} unidade{product.Estoque !== 1 ? 's' : ''}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: <span className={product.Ativo ? 'text-green-600' : 'text-red-600'}>
                      {product.Ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </p>
                </div>

                {/* Description */}
                {product.Descricao && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Descrição</h4>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {product.Descricao}
                    </div>
                  </div>
                )}

                {/* Brief Description */}
                {product.BreveDescricao && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Descrição Breve</h4>
                    <p className="text-sm text-gray-700">{product.BreveDescricao}</p>
                  </div>
                )}

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {product.Marca && (
                    <div>
                      <span className="font-medium text-gray-900">Marca:</span>
                      <span className="text-gray-700 ml-1">{product.Marca}</span>
                    </div>
                  )}
                  {product.Modelo && (
                    <div>
                      <span className="font-medium text-gray-900">Modelo:</span>
                      <span className="text-gray-700 ml-1">{product.Modelo}</span>
                    </div>
                  )}
                  {product.Cor && (
                    <div>
                      <span className="font-medium text-gray-900">Cor:</span>
                      <span className="text-gray-700 ml-1">{product.Cor}</span>
                    </div>
                  )}
                  {product.Peso && (
                    <div>
                      <span className="font-medium text-gray-900">Peso:</span>
                      <span className="text-gray-700 ml-1">{product.Peso}</span>
                    </div>
                  )}
                  {product.Dimensoes && (
                    <div>
                      <span className="font-medium text-gray-900">Dimensões:</span>
                      <span className="text-gray-700 ml-1">{product.Dimensoes}</span>
                    </div>
                  )}
                  {product.Garantia && (
                    <div>
                      <span className="font-medium text-gray-900">Garantia:</span>
                      <span className="text-gray-700 ml-1">{product.Garantia}</span>
                    </div>
                  )}
                  {product.Origem && (
                    <div>
                      <span className="font-medium text-gray-900">Origem:</span>
                      <span className="text-gray-700 ml-1">{product.Origem}</span>
                    </div>
                  )}
                  {product.Condicao && (
                    <div>
                      <span className="font-medium text-gray-900">Condição:</span>
                      <span className="text-gray-700 ml-1">{product.Condicao}</span>
                    </div>
                  )}
                </div>

                {/* Seller Info */}
                {product.vendedor && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Vendedor</h4>
                    <p className="text-sm text-gray-700">{product.vendedor.Nome}</p>
                    {product.vendedor.Email && (
                      <p className="text-sm text-gray-600">{product.vendedor.Email}</p>
                    )}
                  </div>
                )}

                {/* Company Info */}
                {product.empresa && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Empresa</h4>
                    <p className="text-sm text-gray-700">{product.empresa.Nome}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;
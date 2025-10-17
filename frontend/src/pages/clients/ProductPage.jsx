import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaShoppingCart,
  FaHeart,
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaTruck,
  FaPercent,
  FaArrowLeft,
  FaThumbsUp,
  FaTrash,
  FaUser,
  FaRegHeart,
  FaImage,
  FaSearchPlus
} from 'react-icons/fa';
import {
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiSend
} from 'react-icons/fi';
import { produtoService, favoritoService, avaliacaoService } from '../../services/api';
import { log } from '../../utils/logger';
import { useCart } from '../../context/CartContext.jsx';
import LazyImage from '../../components/LazyImage';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { buildImageUrl, buildImageUrls, getFirstValidImage } from '../../utils/imageUtils';
import { useNotifications } from '../../hooks/useNotifications';


function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, removeItem, items } = useCart();
  const [buttonState, setButtonState] = useState('add'); // 'add', 'added', 'remove'
  const [addedToCartTimeout, setAddedToCartTimeout] = useState(null);
  const { showSuccess, showError, showWarning } = useNotifications();
  
  // Estados para avaliações
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [minhaAvaliacao, setMinhaAvaliacao] = useState(null);
  const [loadingAvaliacoes, setLoadingAvaliacoes] = useState(false);
  const [submittingAvaliacao, setSubmittingAvaliacao] = useState(false);
  
  // Estados para vendedor e produtos sugeridos
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [produtosSugeridos, setProdutosSugeridos] = useState([]);
  const [loadingProdutosSugeridos, setLoadingProdutosSugeridos] = useState(false);
  const [activeSuggestedIndex, setActiveSuggestedIndex] = useState(0);

  // Responsive items per view for carousel
  const getItemsPerView = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1280) return 6; // xl
      if (window.innerWidth >= 1024) return 5; // lg
      if (window.innerWidth >= 768) return 4; // md
      if (window.innerWidth >= 640) return 3; // sm
      return 2; // mobile
    }
    return 4; // default
  };

  const [itemsPerView, setItemsPerView] = useState(getItemsPerView());

  // Update items per view on resize
  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView());
      setActiveSuggestedIndex(0); // Reset to first slide on resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Estados para parcelas e preço à vista
  const [showInstallments, setShowInstallments] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState(null);
  const [cashDiscount] = useState(0.05); // 5% de desconto à vista


  // Mock do endereço do usuário (em produção, puxar do contexto do usuário logado)
  const userAddress = {
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01001-000',
    bairro: 'Centro',
    rua: 'Rua Exemplo',
  };

  // Função para calcular prazo de entrega baseado no endereço (mock)
  const calcularPrazoEntrega = (cep) => {
    if (!cep) return 'Indisponível';
    if (cep.startsWith('01')) return '1-2 dias úteis';
    if (cep.startsWith('2')) return '2-4 dias úteis';
    return '3-7 dias úteis';
  };

  // Função para calcular promoção baseada no endereço (mock)
  const calcularPromocao = (cep) => {
    if (!cep) return null;
    if (cep.startsWith('01')) return 'Frete Grátis para São Paulo!';
    if (cep.startsWith('2')) return '10% OFF no frete para Sudeste!';
    return null;
  };

  // Estados
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('info'); // info, specs, reviews
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [showImageModal, setShowImageModal] = useState(false);


  // Estado para produto real
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        log.info('product_fetch_start', { id });
        const data = await produtoService.buscarPorId(id);
        setProduct(data);
        log.info('product_fetch_success', { id });
      } catch (err) {
        log.error('product_fetch_error', { id, error: { message: err?.message } });
        setError(err.message || 'Erro ao carregar produto');
      } finally {
        setLoading(false);
      }
    };

    const checkFavoriteStatus = async () => {
      try {
        const favorites = await favoritoService.listar();
        const isFav = (favorites.favoritos || []).some(fav => fav.produto.ProdutoID === parseInt(id));
        setIsFavorite(isFav);
      } catch (error) {
        log.error('product_check_favorite_error', { id, error: error.message });
        setIsFavorite(false);
      }
    };

    fetchProduct();
    checkFavoriteStatus();
  }, [id]);

  // Check if product is in cart
  const isInCart = items.some(item => item.id === (product?.ProdutoID || product?.id || id));

  // Update button state based on cart status
  useEffect(() => {
    if (isInCart) {
      setButtonState('remove');
    } else {
      setButtonState('add');
    }
  }, [isInCart]);

  // Carregar avaliações
  useEffect(() => {
    const carregarAvaliacoes = async () => {
      if (!id) return;
      
      setLoadingAvaliacoes(true);
      try {
        const [avaliacoesResponse, minhaAvaliacaoResponse] = await Promise.all([
          avaliacaoService.listarPorProduto(id),
          avaliacaoService.minhaDoProduto(id).catch(() => null) // Pode não existir avaliação do usuário
        ]);

        setAvaliacoes(avaliacoesResponse.data || []);
        setMinhaAvaliacao(minhaAvaliacaoResponse?.data || null);
      } catch (error) {
        log.error('avaliacoes_load_error', { produtoId: id, error: error.message });
        console.warn('Erro ao carregar avaliações:', error);
      } finally {
        setLoadingAvaliacoes(false);
      }
    };

    carregarAvaliacoes();
  }, [id]);

  // Carregar produtos sugeridos
  useEffect(() => {
    const carregarProdutosSugeridos = async () => {
      if (!product?.CategoriaID && !product?.VendedorID) return;
      
      setLoadingProdutosSugeridos(true);
      try {
        const filtros = {
          categoria: product.CategoriaID,
          limit: 6,
          exclude: id // Excluir o produto atual
        };
        
        const response = await produtoService.listar(filtros);
        setProdutosSugeridos(response.data?.produtos || []);
      } catch (error) {
        log.error('produtos_sugeridos_load_error', { produtoId: id, error: error.message });
        console.warn('Erro ao carregar produtos sugeridos:', error);
      } finally {
        setLoadingProdutosSugeridos(false);
      }
    };

    carregarProdutosSugeridos();
  }, [product, id]);


  // Mapeamento dos campos do produto para o JSX
  const images = buildImageUrls(product?.Imagens || []);
  const name = product?.Nome || product?.nome || '';
  const price = product?.Preco || product?.preco || 0;
  const originalPrice = product?.PrecoOriginal || product?.precoOriginal || null;
  const description = product?.Descricao || product?.descricao || '';
  const breveDescricao = product?.BreveDescricao || product?.breveDescricao || '';
  const discount = product?.Desconto || product?.desconto || 0;
  const freeShipping = product?.FreteGratis || product?.freteGratis || false;
  const estoque = product?.Estoque || product?.estoque || 0;
  const sku = product?.SKU || product?.sku || '';
  const marca = product?.Marca || product?.marca || '';
  const modelo = product?.Modelo || product?.modelo || '';
  const cor = product?.Cor || product?.cor || '';
  const peso = product?.Peso || product?.peso || '';
  const dimensoes = product?.Dimensoes || product?.dimensoes || '';
  const garantia = product?.Garantia || product?.garantia || '';
  const origem = product?.Origem || product?.origem || '';
  const condicao = product?.Condicao || product?.condicao || '';
  const prazoEntrega = product?.PrazoEntrega || product?.prazoEntrega || calcularPrazoEntrega(userAddress.cep);
  const categoria = (product?.categoria && (product.categoria.Nome || product.categoria.nome)) || '';
  const vendedorNome = product?.vendedor?.Nome || null;
  const vendedorId = product?.vendedor?.VendedorID || null;
  const empresaNome = product?.empresa?.Nome || null;
  const empresaId = product?.empresa?.EmpresaID || null;
  const features = product?.Caracteristicas || product?.features || [];
  const entregaPromocao = product?.entregaPromocao || calcularPromocao(userAddress.cep);
  // Specs para aba de especificações
  const specs = {
    codigo: sku,
    estoque: `${estoque} unidades`,
    prazoEntrega,
    categoria,
    enderecoEntrega: `${userAddress.rua}, ${userAddress.bairro}, ${userAddress.cidade} - ${userAddress.estado}`,
    ...(marca && { marca }),
    ...(modelo && { modelo }),
    ...(cor && { cor }),
    ...(garantia && { garantia }),
    ...(origem && { origem }),
    ...(condicao && { condicao }),
    ...(peso && { peso }),
    ...(dimensoes && { dimensoes })
  };

  // Avaliação e reviews (mock se não vier do backend)
  const rating = product?.Avaliacao || product?.rating || 4.5;
  const reviewCount = product?.NumeroAvaliacoes || product?.reviewCount || 0;

  if (loading) {
    return <LoadingSkeleton type="product-detail" />;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }
  if (!product) {
    return null;
  }

  const renderStars = (rating, size = 'text-sm') => {
    const stars = [];
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.5;
    const empty = 5 - full - (hasHalf ? 1 : 0);
    
    for (let i = 0; i < full; i++) {
      stars.push(<FaStar key={`f-${i}`} className={`text-yellow-400 ${size}`} />);
    }
    if (hasHalf) {
      stars.push(<FaStarHalfAlt key="h" className={`text-yellow-400 ${size}`} />);
    }
    for (let i = 0; i < empty; i++) {
      stars.push(<FaRegStar key={`e-${i}`} className={`text-yellow-400 ${size}`} />);
    }
    return <div className="flex items-center gap-1">{stars}</div>;
  };

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Calcular parcelas para cartão de crédito
  const calculateInstallments = (amount) => {
    const installments = [];
    for (let i = 2; i <= 12; i++) {
      const installmentValue = amount / i;
      installments.push({
        installments: i,
        value: installmentValue,
        total: amount,
        label: `${i}x de R$ ${installmentValue.toFixed(2)}`
      });
    }
    return installments;
  };

  // Calcular preço à vista com desconto
  const calculateCashPrice = (amount) => {
    const discount = amount * cashDiscount;
    return {
      original: amount,
      discount: discount,
      final: amount - discount,
      discountPercent: (cashDiscount * 100).toFixed(0)
    };
  };

  const handleAddToCart = () => {
    const mapped = {
      id: product?.ProdutoID || product?.id || id,
      name: product?.Nome || product?.nome || name,
      price: Number(product?.Preco ?? product?.preco ?? price ?? 0),
      image: Array.isArray(product?.Imagens) ? product.Imagens[0] : null,
      sku: product?.SKU || product?.sku || sku,
      estoque: product?.Estoque ?? product?.estoque ?? estoque ?? 0,
    };
    addItem(mapped, quantity);
    setButtonState('added');
    showSuccess(`${mapped.name} adicionado ao carrinho!`);
    if (addedToCartTimeout) {
      clearTimeout(addedToCartTimeout);
    }
    setAddedToCartTimeout(setTimeout(() => setButtonState('remove'), 3000));
  };

  const handleRemoveFromCart = () => {
    removeItem(product?.ProdutoID || product?.id || id);
    setButtonState('add');
    showWarning('Produto removido do carrinho');
  };

  const handleToggleFavorite = async () => {
    try {
      const produtoId = product?.ProdutoID || product?.id || id;
      if (isFavorite) {
        await favoritoService.remover(produtoId);
        setIsFavorite(false);
      } else {
        await favoritoService.adicionar(produtoId);
        setIsFavorite(true);
      }
    } catch (error) {
      log.error('product_toggle_favorite_error', { produtoId: product?.ProdutoID || id, error: error.message });
      // Could show error message
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !newRating) return;
    
    setSubmittingAvaliacao(true);
    try {
      await avaliacaoService.avaliar(id, newRating, newComment.trim());
      
      // Recarregar avaliações
      const [avaliacoesResponse, minhaAvaliacaoResponse] = await Promise.all([
        avaliacaoService.listarPorProduto(id),
        avaliacaoService.minhaDoProduto(id).catch(() => null)
      ]);
      
      setAvaliacoes(avaliacoesResponse.data || []);
      setMinhaAvaliacao(minhaAvaliacaoResponse?.data || null);
      
      setNewComment('');
      setNewRating(5);
      showSuccess('Avaliação enviada com sucesso!');
    } catch (error) {
      log.error('avaliacao_submit_error', { produtoId: id, error: error.message });
      showError('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setSubmittingAvaliacao(false);
    }
  };

  const handleDeleteComment = async () => {
    showWarning('Tem certeza que deseja apagar a avaliação?', {
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      onClose: async () => {
        try {
          await avaliacaoService.remover(id);

          // Recarregar avaliações
          const [avaliacoesResponse, minhaAvaliacaoResponse] = await Promise.all([
            avaliacaoService.listarPorProduto(id),
            avaliacaoService.minhaDoProduto(id).catch(() => null)
          ]);

          setAvaliacoes(avaliacoesResponse.data || []);
          setMinhaAvaliacao(minhaAvaliacaoResponse?.data || null);

          showSuccess('Avaliação removida com sucesso!');
        } catch (error) {
          log.error('avaliacao_delete_error', { produtoId: id, error: error.message });
          showError('Erro ao remover avaliação. Tente novamente.');
        }
      }
    });
  };


  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const maxSuggestedIndex = Math.max(0, Math.ceil(produtosSugeridos.length / itemsPerView) - 1);

  return (
    <div className="min-h-screen bg-white">
      {/* Header com botão voltar */}
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
            <h1 className="text-lg font-semibold text-slate-900 truncate">{name}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* Galeria de Imagens */}
          <div className="space-y-4">
            {/* Imagem Principal */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 max-w-xs sm:max-w-sm mx-auto lg:max-w-none cursor-pointer"
                 onClick={() => images.length > 0 && setShowImageModal(true)}>
              {images.length > 0 ? (
                <LazyImage
                  src={images[activeImageIndex]}
                  alt={name}
                  className="w-full h-full"
                  fallback="/placeholder-image.svg"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                  <FaImage className="text-4xl" />
                </div>
              )}
              
              {/* Zoom Icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageModal(true);
                }}
                className="absolute top-4 right-4 p-2 bg-white/90 text-slate-700 hover:bg-white rounded-full shadow-lg transition-all z-10"
                title="Ampliar imagem"
              >
                <FaSearchPlus className="text-lg" />
              </button>

              {/* Badges + Promoções de entrega */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {discount > 0 && (
                    <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-lg flex items-center gap-1 shadow-sm">
                      <FaPercent className="text-xs" />
                      {discount}% OFF
                    </span>
                  )}
                  {freeShipping && (
                    <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-lg flex items-center gap-1 shadow-sm">
                      <FaTruck className="text-xs" />
                      Frete Grátis
                    </span>
                  )}
                  {entregaPromocao && (
                    <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-lg flex items-center gap-1 shadow-sm">
                      {entregaPromocao}
                    </span>
                  )}
                </div>

              {/* Controles de navegação */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-slate-700 hover:bg-white shadow-lg transition-all"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev + 1) % images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-slate-700 hover:bg-white shadow-lg transition-all"
                  >
                    <FiChevronRight />
                  </button>
                </>
              )}
            </div>

            {/* Miniaturas */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.length > 0 ? (
                images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === activeImageIndex 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <LazyImage
                      src={image}
                      alt={`${name} ${index + 1}`}
                      className="w-full h-full"
                      fallback="/placeholder-image.svg"
                    />
                  </button>
                ))
              ) : (
                <div className="w-20 h-20 flex items-center justify-center bg-slate-100 text-slate-400 rounded-lg border-2 border-slate-200">
                  <FaImage className="text-2xl" />
                </div>
              )}
            </div>
          </div>

          {/* Informações do Produto */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{name}</h1>
              
              {/* Avaliações */}
              <div className="flex items-center gap-3 mb-4">
                {renderStars(rating)}
                <span className="text-sm text-slate-600">
                  {rating} ({reviewCount.toLocaleString('pt-BR')} avaliações)
                </span>
              </div>

              {/* Preços */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-blue-700">{formatPrice(price)}</span>
                {originalPrice && (
                  <span className="text-lg text-slate-400 line-through">{formatPrice(originalPrice)}</span>
                )}
              </div>

              {/* Preço à vista e parcelas */}
              <div className="mb-6 space-y-4">
                {/* Preço à vista com desconto */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Preço à vista</p>
                      <p className="text-xs text-green-600">
                        {calculateCashPrice(price).discountPercent}% de desconto
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-800">
                        {formatPrice(calculateCashPrice(price).final)}
                      </p>
                      <p className="text-xs text-green-600">
                        Economia de {formatPrice(calculateCashPrice(price).discount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parcelas */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-blue-800">Parcelas no cartão</h3>
                    <button
                      onClick={() => setShowInstallments(!showInstallments)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      {showInstallments ? 'Ocultar' : 'Ver parcelas'}
                    </button>
                  </div>
                  
                  {showInstallments && (
                    <div className="grid grid-cols-2 gap-2">
                      {calculateInstallments(price).slice(0, 6).map((installment, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedInstallments(installment.installments);
                            showSuccess(`Parcelamento em ${installment.installments}x selecionado`);
                          }}
                          className={`p-2 text-xs border rounded-lg transition-colors ${
                            selectedInstallments === installment.installments
                              ? 'border-blue-500 bg-blue-100 text-blue-700'
                              : 'border-blue-200 hover:border-blue-300 text-blue-600'
                          }`}
                        >
                          {installment.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Breve Descrição */}
              {breveDescricao && (
                <p className="text-slate-600 leading-relaxed mb-4">{breveDescricao}</p>
              )}

              {/* Informações do vendedor */}
              {(vendedorNome || empresaNome) && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                  <span className="text-sm">Vendido por: </span>
                  <button
                    onClick={() => setShowVendorModal(true)}
                    className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                  >
                    {vendedorNome && empresaNome && vendedorNome !== empresaNome
                      ? `${vendedorNome} (${empresaNome})`
                      : vendedorNome || empresaNome}
                  </button>
                </div>
              )}
            </div>

            {/* Controles de Compra */}
            <div className="border-t border-slate-200 pt-6">
              {/* Quantidade */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
                <span className="font-medium text-slate-900">Quantidade:</span>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900 font-medium"
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className="px-4 py-2 font-medium bg-slate-50 border-x border-slate-200 min-w-[60px] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900 font-medium"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-3">
                <button
                  onClick={buttonState === 'remove' ? handleRemoveFromCart : handleAddToCart}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 font-semibold rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 ${
                    buttonState === 'added'
                      ? 'bg-green-500 text-white'
                      : buttonState === 'remove'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {buttonState === 'added' ? (
                    <>
                      <FaShoppingCart className="text-lg" />
                      <span>Adicionado!</span>
                    </>
                  ) : buttonState === 'remove' ? (
                    <>
                      <FaTrash className="text-lg" />
                      <span>Remover do Carrinho</span>
                    </>
                  ) : (
                    <>
                      <FaShoppingCart className="text-lg" />
                      <span>Adicionar ao Carrinho</span>
                    </>
                  )}
                </button>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleToggleFavorite}
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 ${
                      isFavorite
                        ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {isFavorite ? <FaHeart className="text-lg" /> : <FaRegHeart className="text-lg" />}
                    <span className="hidden sm:inline">{isFavorite ? 'Favoritado' : 'Favoritar'}</span>
                    <span className="sm:hidden">{isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}</span>
                  </button>

                  <button
                    onClick={() => {
                      handleAddToCart();
                      navigate('/checkout');
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-green-300 bg-green-50 text-green-700 rounded-xl font-medium hover:bg-green-100 hover:border-green-400 transition-all duration-200"
                  >
                    <span>Comprar Agora</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Abas de Informações */}
        <div className="border-t border-slate-200 pt-8">
          {/* Navegação das Abas */}
          <div className="flex justify-center border-b border-slate-200 mb-6">
            <div className="flex">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'info'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Informações do Produto
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'specs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Especificações
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Avaliações ({avaliacoes.length})
              </button>
            </div>
          </div>

          {/* Conteúdo das Abas */}
          <div className="min-h-[400px] max-w-4xl mx-auto">
            {/* Aba Informações */}
            {activeTab === 'info' && (
              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Sobre o Produto</h3>
                <p className="text-slate-600 leading-relaxed mb-6">{description}</p>
              </div>
            )}

            {/* Aba Especificações */}
            {activeTab === 'specs' && (
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Especificações Técnicas</h3>
                <div className="mb-4">
                  <span className="font-medium text-slate-700">Entrega para seu endereço:</span>
                  <span className="ml-2 text-blue-700 font-semibold">{specs.prazoEntrega}</span>
                  <span className="ml-2 text-slate-500">({specs.enderecoEntrega})</span>
                </div>
                {/* Mobile: Tabela única */}
                <div className="md:hidden bg-slate-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {Object.entries(specs).map(([key, value], index) => (
                        key !== 'prazoEntrega' && key !== 'enderecoEntrega' && (
                          <tr key={key} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-6 py-4 font-medium text-slate-900 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </td>
                            <td className="px-6 py-4 text-slate-600">{value}</td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Desktop: Duas colunas */}
                <div className="hidden md:grid md:grid-cols-2 gap-6">
                  {/* Primeira coluna */}
                  <div className="bg-slate-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <tbody>
                        {Object.entries(specs).slice(0, Math.ceil(Object.entries(specs).length / 2)).map(([key, value], index) => (
                          key !== 'prazoEntrega' && key !== 'enderecoEntrega' && (
                            <tr key={key} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="px-6 py-4 font-medium text-slate-900 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </td>
                              <td className="px-6 py-4 text-slate-600">{value}</td>
                            </tr>
                          )
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Segunda coluna */}
                  <div className="bg-slate-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <tbody>
                        {Object.entries(specs).slice(Math.ceil(Object.entries(specs).length / 2)).map(([key, value], index) => (
                          key !== 'prazoEntrega' && key !== 'enderecoEntrega' && (
                            <tr key={key} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="px-6 py-4 font-medium text-slate-900 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </td>
                              <td className="px-6 py-4 text-slate-600">{value}</td>
                            </tr>
                          )
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Aba Avaliações */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">Avaliações dos Clientes</h3>
                  <div className="flex items-center gap-2">
                    {renderStars(rating, 'text-lg')}
                    <span className="text-lg font-semibold text-slate-900">{rating}</span>
                    <span className="text-slate-600">({avaliacoes.length} avaliações)</span>
                  </div>
                </div>

                {/* Formulário de Nova Avaliação - só mostra se não tiver avaliação do usuário */}
                {!minhaAvaliacao && (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-slate-900 mb-6">Deixe sua avaliação</h4>
                    
                    {/* Seletor de Estrelas */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                      <span className="text-sm font-medium text-slate-700">Sua nota:</span>
                      <div className="flex gap-1 p-2 bg-white rounded-lg border border-slate-200 w-fit">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewRating(star)}
                            className="text-xl hover:scale-110 transition-all duration-200 p-1"
                          >
                            {star <= newRating ? (
                              <FaStar className="text-yellow-400" />
                            ) : (
                              <FaRegStar className="text-slate-300 hover:text-yellow-300" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Campo de Comentário */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Compartilhe sua experiência com este produto..."
                        className="flex-1 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm transition-all"
                        rows="4"
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || submittingAvaliacao}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2 sm:self-start"
                      >
                        <FiSend className="text-lg" />
                        <span className="hidden sm:inline">
                          {submittingAvaliacao ? 'Enviando...' : 'Enviar'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Sua avaliação existente */}
                {minhaAvaliacao && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-blue-900">Sua Avaliação</h4>
                      <button
                        onClick={handleDeleteComment}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir avaliação"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      {renderStars(minhaAvaliacao.Nota, 'text-sm')}
                      <span className="text-sm text-blue-700 font-medium">{minhaAvaliacao.Nota}/5</span>
                    </div>
                    {minhaAvaliacao.Comentario && (
                      <p className="text-blue-800 leading-relaxed">{minhaAvaliacao.Comentario}</p>
                    )}
                  </div>
                )}

                {/* Lista de Avaliações */}
                <div className="space-y-6">
                  {loadingAvaliacoes ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-slate-600">Carregando avaliações...</p>
                    </div>
                  ) : avaliacoes.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <FaStar className="mx-auto text-4xl text-slate-300 mb-4" />
                      <p>Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
                    </div>
                  ) : (
                    avaliacoes.map((avaliacao) => (
                      <div key={avaliacao.AvaliacaoID} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm">
                              <FaUser className="text-blue-600" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-slate-900 mb-1">
                                {avaliacao.cliente?.Nome || 'Cliente'}
                              </h5>
                              <div className="flex items-center gap-3">
                                {renderStars(avaliacao.Nota, 'text-sm')}
                                <span className="text-sm text-slate-500">
                                  {new Date(avaliacao.CriadoEm).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {avaliacao.Comentario && (
                          <p className="text-slate-700 leading-relaxed mb-4 pl-16">{avaliacao.Comentario}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seção de Produtos Sugeridos */}
        {produtosSugeridos.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Produtos Sugeridos</h2>
            <div className="relative">
              {/* Carousel Container */}
              <div className="overflow-hidden">
                <div
                  className="flex gap-4 transition-transform duration-300 ease-in-out"
                  style={{
                    transform: `translateX(-${activeSuggestedIndex * (100 / itemsPerView)}%)`,
                    width: `${(produtosSugeridos.length / itemsPerView) * 100}%`
                  }}
                >
                  {produtosSugeridos.map((produto) => (
                    <div
                      key={produto.ProdutoID || produto.id}
                      className="flex-shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                      style={{ width: `${100 / itemsPerView}%` }}
                    >
                      <Link to={`/produto/${produto.ProdutoID || produto.id}`} className="block">
                        <div className="aspect-square relative overflow-hidden">
                          <LazyImage
                            src={getFirstValidImage(produto.Imagens)}
                            alt={produto.Nome || produto.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            fallback="/placeholder-image.svg"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                            {produto.Nome || produto.nome}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-blue-600">
                              {formatPrice(produto.Preco || produto.preco || 0)}
                            </span>
                            {produto.Avaliacao && (
                              <div className="flex items-center gap-1">
                                {renderStars(produto.Avaliacao, 'text-sm')}
                                <span className="text-sm text-slate-500">
                                  ({produto.NumeroAvaliacoes || 0})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              {produtosSugeridos.length > itemsPerView && (
                <>
                  <button
                    onClick={() => setActiveSuggestedIndex(Math.max(0, activeSuggestedIndex - 1))}
                    disabled={activeSuggestedIndex === 0}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white border border-slate-200 rounded-full p-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all z-10"
                    aria-label="Produtos anteriores"
                  >
                    <FiChevronLeft className="text-slate-600" />
                  </button>
                  <button
                    onClick={() => setActiveSuggestedIndex(Math.min(maxSuggestedIndex, activeSuggestedIndex + 1))}
                    disabled={activeSuggestedIndex === maxSuggestedIndex}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white border border-slate-200 rounded-full p-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all z-10"
                    aria-label="Próximos produtos"
                  >
                    <FiChevronRight className="text-slate-600" />
                  </button>
                </>
              )}

              {/* Indicators */}
              {produtosSugeridos.length > itemsPerView && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: maxSuggestedIndex + 1 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSuggestedIndex(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === activeSuggestedIndex ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`Ir para página ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Vendedor */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Informações do Vendedor</h3>
                <button
                  onClick={() => setShowVendorModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-slate-600">Nome:</span>
                  <p className="text-slate-900">{vendedorNome || 'Não informado'}</p>
                </div>
                
                {empresaNome && (
                  <div>
                    <span className="text-sm font-medium text-slate-600">Empresa:</span>
                    <p className="text-slate-900">{empresaNome}</p>
                  </div>
                )}
                
                <div>
                  <span className="text-sm font-medium text-slate-600">Email:</span>
                  <p className="text-slate-900">{product?.Vendedor?.email || 'Não informado'}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-slate-600">Telefone:</span>
                  <p className="text-slate-900">{product?.Vendedor?.telefone || 'Não informado'}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-slate-600">Endereço:</span>
                  <p className="text-slate-900">
                    {product?.Vendedor?.endereco ? 
                      `${product.Vendedor.endereco.rua}, ${product.Vendedor.endereco.cidade} - ${product.Vendedor.endereco.estado}` :
                      'Não informado'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Imagem */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white text-3xl p-2 rounded-full bg-black/50 hover:bg-black/75 transition-colors z-50"
            >
              <FiX />
            </button>

            {images.length > 0 && (
              <>
                <LazyImage
                  src={images[activeImageIndex]}
                  alt={name}
                  className="max-w-full max-h-full"
                  fallback="/placeholder-image.svg"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl p-3 rounded-full bg-black/50 hover:bg-black/75 transition-colors"
                    >
                      <FiChevronLeft />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl p-3 rounded-full bg-black/50 hover:bg-black/75 transition-colors"
                    >
                      <FiChevronRight />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductPage;

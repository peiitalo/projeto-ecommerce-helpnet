import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { clienteService, freteService } from '../../services/api';
import {
  FaShoppingCart,
  FaUser,
  FaHeart,
  FaBell,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaCreditCard,
  FaMoneyBillWave,
  FaBarcode,
  FaCheck,
  FaTruck,
  FaBox,
  FaReceipt,
  FaTrash
} from 'react-icons/fa';
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiX,
  FiPackage,
  FiTag,
  FiCreditCard as FiCreditCardIcon,
  FiMapPin,
  FiHelpCircle,
  FiSettings,
  FiClock
} from 'react-icons/fi';

function CheckoutPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, type: 'pix', amount: 0, label: 'PIX', active: true }
  ]);
  const [showAllMethods, setShowAllMethods] = useState(false);
  const allAvailableMethods = [
    { id: 1, type: 'pix', amount: 0, label: 'PIX' },
    { id: 2, type: 'cartao', amount: 0, label: 'Cartão de Crédito' },
    { id: 3, type: 'boleto', amount: 0, label: 'Boleto Bancário' }
  ];
  const [orderData, setOrderData] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const { items, count, clearCart, freight, calculateFreight, freightLoading, freightError, selectedAddress, setSelectedAddress, total, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

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
    { label: 'Meus Cupons', to: '/cupons', icon: <FiCreditCardIcon className="text-slate-500" /> },
    { label: 'Endereços', to: '/enderecos', icon: <FiMapPin className="text-slate-500" /> },
    { label: 'Suporte', to: '/suporte', icon: <FiHelpCircle className="text-slate-500" /> },
    { label: 'Configurações', to: '/configuracoes', icon: <FiSettings className="text-slate-500" /> },
  ];

  // Carregar dados necessários
  useEffect(() => {
    if (count === 0) {
      navigate('/carrinho');
      return;
    }
    carregarDadosCheckout();
  }, [count, navigate]);

  // Ler itens selecionados do sessionStorage
  const getSelectedItems = () => {
    try {
      const selected = sessionStorage.getItem('helpnet_checkout_selected');
      return selected ? JSON.parse(selected) : items.map(item => item.id);
    } catch {
      return items.map(item => item.id);
    }
  };

  // Atualizar orderData sempre que freight mudar (já que subtotal é baseado nos itens selecionados)
  useEffect(() => {
    if (orderData) {
      const selectedItemIds = getSelectedItems();
      const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
      const selectedSubtotal = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);

      const dadosAtualizados = {
        items: selectedItems,
        subtotal: selectedSubtotal,
        frete: freight.valor,
        total: selectedSubtotal + freight.valor
      };
      setOrderData(dadosAtualizados);

      // Atualizar valor do PIX se for o único método de pagamento
      if (paymentMethods.length === 1 && paymentMethods[0].type === 'pix') {
        setPaymentMethods(prev => prev.map(method => ({ ...method, amount: dadosAtualizados.total })));
      }
    }
  }, [freight.valor, items]);

  const carregarDadosCheckout = async () => {
    try {
      setLoading(true);

      // Obter itens selecionados
      const selectedItemIds = getSelectedItems();
      const selectedItems = items.filter(item => selectedItemIds.includes(item.id));

      // Carregar endereços do cliente
      const enderecosResponse = await clienteService.listarEnderecos();
      const enderecos = enderecosResponse.enderecos || [];
      setAddresses(enderecos);

      // Selecionar primeiro endereço como padrão se existir
      if (enderecos.length > 0) {
        setSelectedAddress(enderecos[0]);
        // Calcular frete automaticamente para o primeiro endereço e itens selecionados
        await calculateFreight(enderecos[0].EnderecoID, selectedItemIds);
      }

      // Calcular subtotal apenas dos itens selecionados
      const selectedSubtotal = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);

      // Preparar dados do pedido usando valores calculados
      const dadosPedido = {
        items: selectedItems,
        subtotal: selectedSubtotal,
        frete: freight.valor,
        total: selectedSubtotal + freight.valor
      };

      setOrderData(dadosPedido);

      // Definir valor total no PIX por padrão
      setPaymentMethods([{ id: 1, type: 'pix', amount: dadosPedido.total, label: 'PIX', active: true }]);

    } catch (error) {
      console.error('Erro ao carregar dados do checkout:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular subtotal
  const calcularSubtotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };


  // Atualizar valor do método de pagamento
  const updatePaymentAmount = (id, amount) => {
    const numericAmount = parseFloat(amount) || 0;
    setPaymentMethods(prev => prev.map(method =>
      method.id === id ? { ...method, amount: numericAmount } : method
    ));
  };

  // Adicionar método de pagamento
  const addPaymentMethod = (type) => {
    const methodExists = paymentMethods.find(m => m.type === type);
    if (methodExists) return;

    const methodTemplate = allAvailableMethods.find(m => m.type === type);
    if (!methodTemplate) return;

    setPaymentMethods(prev => [...prev, { ...methodTemplate, active: true }]);
  };

  // Remover método de pagamento
  const removePaymentMethod = (id) => {
    // Não permitir remover se for o último método
    if (paymentMethods.length <= 1) return;

    setPaymentMethods(prev => prev.filter(method => method.id !== id));
  };

  // Calcular total dos pagamentos
  const calcularTotalPagamentos = () => {
    return paymentMethods.reduce((total, method) => total + method.amount, 0);
  };

  // Calcular valor restante a ser pago
  const calcularValorRestante = () => {
    const totalPedido = orderData?.total || 0;
    const totalPagamentos = calcularTotalPagamentos();
    return Math.max(0, totalPedido - totalPagamentos);
  };

  // Distribuir valor automaticamente
  const distribuirValorAutomaticamente = () => {
    const totalPedido = orderData?.total || 0;
    const valorRestante = calcularValorRestante();
    if (valorRestante <= 0) return;

    const metodosAtivos = paymentMethods.filter(method => method.amount > 0);
    if (metodosAtivos.length === 0) {
      // Se nenhum método tem valor, colocar tudo no primeiro método (geralmente PIX)
      setPaymentMethods(prev => prev.map((method, index) =>
        index === 0 ? { ...method, amount: totalPedido } : { ...method, amount: 0 }
      ));
    } else {
      // Distribuir o valor restante entre métodos que já têm valor
      const valorPorMetodo = valorRestante / metodosAtivos.length;
      setPaymentMethods(prev => prev.map(method => {
        if (metodosAtivos.find(m => m.id === method.id)) {
          return { ...method, amount: method.amount + valorPorMetodo };
        }
        return method;
      }));
    }
  };

  // Atualizar endereço selecionado e recalcular frete
  const handleAddressChange = async (endereco) => {
    setSelectedAddress(endereco);

    if (endereco) {
      const selectedItemIds = getSelectedItems();
      // Calcular frete usando apenas os itens selecionados
      await calculateFreight(endereco.EnderecoID, selectedItemIds);

      // Recalcular dados do pedido
      const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
      const selectedSubtotal = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);

      setOrderData({
        items: selectedItems,
        subtotal: selectedSubtotal,
        frete: freight.valor,
        total: selectedSubtotal + freight.valor
      });

      // Ajustar valor do pagamento para o novo total (se apenas 1 método ativo)
      if (paymentMethods.length === 1) {
        setPaymentMethods(prev => prev.map(method => ({ ...method, amount: selectedSubtotal + freight.valor })));
      }
    }
  };

  // Finalizar pedido
  const handleFinalizarPedido = async () => {
    if (!selectedAddress) {
      alert('Selecione um endereço de entrega');
      return;
    }

    const metodosComValor = paymentMethods.filter(method => method.amount > 0);
    if (metodosComValor.length === 0) {
      alert('Adicione pelo menos um método de pagamento com valor');
      return;
    }

    const totalPagamentos = calcularTotalPagamentos();
    const totalPedido = orderData?.total || 0;

    if (Math.abs(totalPagamentos - totalPedido) > 0.01) {
      alert('O total dos pagamentos deve ser igual ao valor do pedido');
      return;
    }

    try {
      setProcessingOrder(true);

      // Preparar dados para a API - apenas itens selecionados
      const selectedItemIds = getSelectedItems();
      const selectedItems = items.filter(item => selectedItemIds.includes(item.id));

      const dadosPedido = {
        enderecoId: selectedAddress.EnderecoID,
        itens: selectedItems.map(item => ({
          produtoId: item.id,
          quantidade: item.quantity
        })),
        metodosPagamento: metodosComValor.map(method => ({
          tipo: method.type,
          valor: method.amount
        })),
        frete: orderData.frete,
        observacoes: ''
      };

      // Criar pedido via API
      const response = await clienteService.criarPedido(dadosPedido);

      if (response.data.paymentUrl) {
        // Redirecionar para Mercado Pago
        window.location.href = response.data.paymentUrl;
        return;
      }

      // Fallback: gerar dados do comprovante (se não houver URL de pagamento)
      const receipt = {
        orderId: `PED-${response.data.pedidoId}`,
        date: new Date().toLocaleString('pt-BR'),
        items: selectedItems,
        address: selectedAddress,
        paymentMethods: metodosComValor,
        subtotal: orderData.subtotal,
        frete: orderData.frete,
        total: orderData.total,
        clientName: user?.nome || 'Cliente'
      };

      setReceiptData(receipt);
      setOrderComplete(true);

      // Limpar carrinho
      clearCart();

    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      alert('Erro ao processar pedido: ' + (error.response?.data?.errors?.join('\n') || error.message));
    } finally {
      setProcessingOrder(false);
    }
  };

  // Compartilhar comprovante
  const handleCompartilharComprovante = () => {
    const paymentMethodsText = receiptData.paymentMethods
      .filter(method => method.amount > 0)
      .map(method => `${method.label}: R$ ${method.amount.toFixed(2)}`)
      .join('\n');

    const receiptText = `
 COMPROVANTE DE COMPRA - HelpNet
 ================================
 Pedido: ${receiptData.orderId}
 Data: ${receiptData.date}
 Cliente: ${receiptData.clientName}

 ITENS:
 ${receiptData.items.map(item => `${item.name} - R$ ${item.price.toFixed(2)} x ${item.quantity} = R$ ${(item.price * item.quantity).toFixed(2)}`).join('\n')}

 Subtotal: R$ ${receiptData.subtotal.toFixed(2)}
 Frete: R$ ${receiptData.frete.toFixed(2)}
 TOTAL: R$ ${receiptData.total.toFixed(2)}

 Endereço de entrega:
 ${receiptData.address.Nome}
 ${receiptData.address.CEP}, ${receiptData.address.Cidade} - ${receiptData.address.UF}

 MÉTODOS DE PAGAMENTO:
 ${paymentMethodsText}

 Obrigado pela compra!
     `.trim();

    if (navigator.share) {
      navigator.share({
        title: 'Comprovante de Compra - HelpNet',
        text: receiptText
      });
    } else {
      navigator.clipboard.writeText(receiptText);
      alert('Comprovante copiado para a área de transferência!');
    }
  };

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (orderComplete && receiptData) {
    return (
      <div className="min-h-screen bg-white flex">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-72 bg-white border-r border-slate-200 flex-col fixed h-screen">
          <div className="h-16 px-6 border-b border-slate-200 flex items-center sticky top-0 bg-white z-10">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold text-blue-700">{logoConfig.textLogo}</span>
            </Link>
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
        </aside>

        <div className="flex-1 flex flex-col md:ml-72">
          <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4 h-16">
                <div className="flex items-center gap-2">
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
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link to="/perfil" className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">
                    <FaUser />
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 bg-slate-50">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCheck className="text-green-600 text-2xl" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">Pedido Realizado com Sucesso!</h1>
                  <p className="text-slate-600">Seu pedido foi processado e será enviado em breve.</p>
                </div>

                <div className="border border-slate-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FaReceipt className="text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Comprovante</h2>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Pedido:</span>
                      <span className="font-medium">{receiptData.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Data:</span>
                      <span className="font-medium">{receiptData.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total:</span>
                      <span className="font-medium text-green-600">{formatPrice(receiptData.total)}</span>
                    </div>
                  </div>

                  {/* Métodos de pagamento */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h3 className="text-sm font-medium text-slate-900 mb-2">Métodos de Pagamento:</h3>
                    <div className="space-y-1">
                      {receiptData.paymentMethods
                        .filter(method => method.amount > 0)
                        .map((method, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-slate-600">{method.label}:</span>
                          <span className="font-medium">{formatPrice(method.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleCompartilharComprovante}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Compartilhar Comprovante
                  </button>
                  <Link
                    to="/explorer"
                    className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-lg hover:bg-slate-200 transition-colors font-medium text-center"
                  >
                    Continuar Comprando
                  </Link>
                </div>
              </div>
            </div>
          </main>
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

      {/* Sidebar Mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold text-blue-700">HelpNet</Link>
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
      </div>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-72 bg-white border-r border-slate-200 flex-col fixed h-screen">
        <div className="h-16 px-6 border-b border-slate-200 flex items-center sticky top-0 bg-white z-10">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold text-blue-700">{logoConfig.textLogo}</span>
          </Link>
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
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col md:ml-72">
        {/* Header */}
        <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 h-16">
              <div className="flex items-center gap-2">
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
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Link to="/carrinho" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <FaShoppingCart />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                      {count}
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

        {/* Conteúdo do Checkout */}
        <main className="flex-1 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <Link
                to="/carrinho"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
              >
                <FaArrowLeft />
                <span>Voltar ao carrinho</span>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Finalizar Compra</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Resumo do Pedido */}
              <div className="lg:col-span-2 space-y-6">
                {/* Itens do Carrinho */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Itens do Pedido</h2>
                  <div className="space-y-4">
                    {orderData?.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg">
                        <img
                          src={item.image || '/placeholder-image.png'}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = '/placeholder-image.png';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">{item.name}</h3>
                          <p className="text-sm text-slate-600">Quantidade: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                          <p className="text-sm text-slate-600">{formatPrice(item.price)} cada</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seleção de Endereço */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Endereço de Entrega</h2>
                  {addresses.length > 0 ? (
                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <div
                          key={address.EnderecoID}
                          onClick={() => handleAddressChange(address)}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedAddress?.EnderecoID === address.EnderecoID
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <FaMapMarkerAlt className="text-slate-400 mt-1" />
                              <div>
                                <h3 className="font-medium text-slate-900">{address.Nome}</h3>
                                <p className="text-sm text-slate-600">
                                  {address.CEP}, {address.Cidade} - {address.UF}
                                </p>
                                <p className="text-sm text-slate-600">
                                  {address.Bairro}, {address.Numero}
                                </p>
                              </div>
                            </div>
                            {selectedAddress?.EnderecoID === address.EnderecoID && (
                              <div className="flex items-center gap-2">
                                {freightLoading && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                )}
                                <FaCheck className="text-blue-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Exibir informações do frete */}
                      {selectedAddress && freight.valor > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <FaTruck className="text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Frete Calculado</span>
                          </div>
                          <div className="text-sm text-blue-800">
                            <p>Distância: {freight.distanciaKm} km</p>
                            <p>Prazo: {freight.prazo}</p>
                            <p className="font-medium">Valor: {formatPrice(freight.valor)}</p>
                          </div>
                        </div>
                      )}

                      {/* Exibir erro de cálculo de frete */}
                      {freightError && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-red-900">Erro no cálculo do frete</span>
                          </div>
                          <p className="text-sm text-red-800">{freightError}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FaMapMarkerAlt className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum endereço cadastrado</h3>
                      <p className="text-slate-600 mb-4">Adicione um endereço para continuar com a compra</p>
                      <Link
                        to="/enderecos"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <FaMapMarkerAlt />
                        <span>Adicionar Endereço</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Método de Pagamento */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-slate-900">Métodos de Pagamento</h2>
                    <div className="flex items-center gap-2">
                      {paymentMethods.length > 1 && (
                        <button
                          onClick={distribuirValorAutomaticamente}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Distribuir automaticamente
                        </button>
                      )}
                      {!showAllMethods && (
                        <button
                          onClick={() => setShowAllMethods(true)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <FaCreditCard className="text-xs" />
                          Adicionar método
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Modal/Seção para adicionar métodos */}
                  {showAllMethods && (
                    <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                      <h3 className="text-sm font-medium text-slate-900 mb-3">Escolha métodos adicionais:</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {allAvailableMethods.map((method) => {
                          const isSelected = paymentMethods.some(m => m.type === method.type);
                          return (
                            <button
                              key={method.type}
                              onClick={() => {
                                if (isSelected) {
                                  removePaymentMethod(paymentMethods.find(m => m.type === method.type)?.id);
                                } else {
                                  addPaymentMethod(method.type);
                                }
                              }}
                              disabled={isSelected && paymentMethods.length <= 1}
                              className={`p-3 border rounded-lg text-left transition-colors ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <div className="flex items-center gap-2">
                                {method.type === 'cartao' && <FaCreditCard className="text-slate-400" />}
                                {method.type === 'boleto' && <FaBarcode className="text-slate-400" />}
                                {method.type === 'pix' && <FaMoneyBillWave className="text-slate-400" />}
                                <div>
                                  <div className="text-sm font-medium">{method.label}</div>
                                  <div className="text-xs text-slate-500">
                                    {method.type === 'cartao' && 'Cartão de crédito'}
                                    {method.type === 'boleto' && 'Boleto bancário'}
                                    {method.type === 'pix' && 'PIX instantâneo'}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => setShowAllMethods(false)}
                          className="text-sm text-slate-600 hover:text-slate-700 font-medium"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {method.type === 'cartao' && <FaCreditCard className="text-slate-400" />}
                            {method.type === 'boleto' && <FaBarcode className="text-slate-400" />}
                            {method.type === 'pix' && <FaMoneyBillWave className="text-slate-400" />}
                            <div>
                              <h3 className="font-medium text-slate-900">{method.label}</h3>
                              <p className="text-sm text-slate-600">
                                {method.type === 'cartao' && 'Visa, Mastercard, Elo'}
                                {method.type === 'boleto' && 'Pagamento à vista'}
                                {method.type === 'pix' && 'Pagamento instantâneo'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {method.amount > 0 && (
                              <span className="text-sm font-medium text-green-600">
                                R$ {method.amount.toFixed(2)}
                              </span>
                            )}
                            {paymentMethods.length > 1 && (
                              <button
                                onClick={() => removePaymentMethod(method.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Remover método"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={method.amount || ''}
                            onChange={(e) => updatePaymentAmount(method.id, e.target.value)}
                            placeholder="0,00"
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumo dos pagamentos */}
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Total do pedido:</span>
                      <span className="font-medium">{formatPrice(orderData?.total || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Total dos pagamentos:</span>
                      <span className="font-medium">{formatPrice(calcularTotalPagamentos())}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className={calcularValorRestante() > 0 ? 'text-red-600' : 'text-green-600'}>
                        {calcularValorRestante() > 0 ? 'Valor restante:' : 'Valor coberto:'}
                      </span>
                      <span className={calcularValorRestante() > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatPrice(Math.abs(calcularValorRestante()))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo e Finalização */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Resumo do Pedido</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal ({orderData?.items?.length || 0} itens)</span>
                      <span className="font-medium">{formatPrice(orderData?.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Frete</span>
                      <span className="font-medium">
                        {freightLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-600"></div>
                            <span>Calculando...</span>
                          </div>
                        ) : (
                          formatPrice(freight.valor)
                        )}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span className="text-slate-900">Total</span>
                        <span className="text-blue-600">{formatPrice(orderData?.total || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleFinalizarPedido}
                    disabled={processingOrder || !selectedAddress || calcularTotalPagamentos() === 0 || Math.abs(calcularTotalPagamentos() - (orderData?.total || 0)) > 0.01}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {processingOrder ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processando...</span>
                      </div>
                    ) : (
                      'Finalizar Compra'
                    )}
                  </button>

                  {!selectedAddress && (
                    <p className="text-red-600 text-sm mt-2">Selecione um endereço de entrega</p>
                  )}
                  {calcularTotalPagamentos() === 0 && (
                    <p className="text-red-600 text-sm mt-2">Adicione valores aos métodos de pagamento</p>
                  )}
                  {calcularTotalPagamentos() > 0 && Math.abs(calcularTotalPagamentos() - (orderData?.total || 0)) > 0.01 && (
                    <p className="text-red-600 text-sm mt-2">
                      O total dos pagamentos deve ser igual a {formatPrice(orderData?.total || 0)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default CheckoutPage;
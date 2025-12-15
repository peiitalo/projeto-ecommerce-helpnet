import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { clienteService } from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import CheckoutSidebar from '../../components/checkout/CheckoutSidebar';
import CheckoutHeader from '../../components/checkout/CheckoutHeader';
import OrderItemsSection from '../../components/checkout/OrderItemsSection';
import AddressSelection from '../../components/checkout/AddressSelection';
import PaymentMethodsSection from '../../components/checkout/PaymentMethodsSection';
import OrderSummary from '../../components/checkout/OrderSummary';
import ReceiptPage from '../../components/checkout/ReceiptPage';
import CouponInput from '../../components/CouponInput';
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
  FiCreditCard,
  FiMapPin,
  FiHelpCircle,
  FiSettings,
  FiClock
} from 'react-icons/fi';

function CheckoutPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAllMethods, setShowAllMethods] = useState(false);
  const allAvailableMethods = [
    { id: 1, type: 'pix', amount: 0, label: 'PIX' },
    { id: 2, type: 'cartao', amount: 0, label: 'Cartão de Crédito' },
    { id: 3, type: 'debito', amount: 0, label: 'Cartão de Débito' },
    { id: 4, type: 'boleto', amount: 0, label: 'Boleto Bancário' }
  ];
  const [orderData, setOrderData] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [installments, setInstallments] = useState({});
  const [orderComplete, setOrderComplete] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  // Removed coupon-related state as it's now handled by CouponInput component
  const CASH_DISCOUNT_PERCENTAGE = 5; // Desconto fixo de 5% para pagamentos à vista

  // Calcular desconto atual baseado nos métodos de pagamento selecionados
  const getCurrentDiscountPercentage = () => {
    const hasCashPayment = paymentMethods.some(method =>
      (method.type === 'pix' || method.type === 'debito') && method.amount > 0
    );
    return hasCashPayment ? CASH_DISCOUNT_PERCENTAGE : 0;
  };

  const { items, count, clear, freight, freightOptions, selectedFreight, setSelectedFreight, calculateFreight, freightLoading, freightError, selectedAddress, setSelectedAddress, total, appliedCoupons, couponDiscount } = useCart();
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotifications();

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
    { label: 'Meus Cupons', to: '/cupons', icon: <FiCreditCard className="text-slate-500" /> },
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
      const checkoutData = sessionStorage.getItem('helpnet_checkout_data');
      if (checkoutData) {
        const parsed = JSON.parse(checkoutData);
        return parsed.selectedItems || [];
      }
      return items.map(item => item.id);
    } catch {
      return items.map(item => item.id);
    }
  };


  // Atualizar orderData sempre que freight, discountPercentage ou appliedCoupon mudar
  useEffect(() => {
    if (orderData) {
      const selectedItemIds = getSelectedItems();
      const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
      const selectedSubtotal = selectedItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);

      const currentDiscountPercentage = getCurrentDiscountPercentage();
      // Apply coupon discounts first, then payment discounts to the remaining amount
      const amountAfterCouponDiscount = selectedSubtotal - couponDiscount;
      const discountAmount = amountAfterCouponDiscount * (currentDiscountPercentage / 100);

      const freteCost = appliedCoupons.some(coupon => coupon.TipoDesconto === 'frete_gratis') ? 0 : freight.valor;
      const totalCalculado = amountAfterCouponDiscount - discountAmount + freteCost;
      const dadosAtualizados = {
        items: selectedItems,
        subtotal: selectedSubtotal,
        discountAmount: discountAmount,
        couponDiscountAmount: couponDiscount,
        frete: freteCost,
        total: Math.max(0, totalCalculado)
      };
      setOrderData(dadosAtualizados);

      console.log(`[DEBUG] Order total updated: R$ ${dadosAtualizados.total.toFixed(2)} (subtotal: R$ ${dadosAtualizados.subtotal.toFixed(2)}, coupon discount: R$ ${dadosAtualizados.couponDiscountAmount.toFixed(2)}, payment discount: R$ ${dadosAtualizados.discountAmount.toFixed(2)}, freight: R$ ${dadosAtualizados.frete.toFixed(2)})`);

      // Não atualizar automaticamente os valores - cliente deve escolher
      // setPaymentMethods(prev => prev);
    }
  }, [freight.valor, items, appliedCoupons, total]);

  // Auto-fill total amount when only one payment method is selected
  useEffect(() => {
    if (paymentMethods.length === 1 && orderData?.total > 0) {
      setPaymentMethods(prev => prev.map(method => ({ ...method, amount: orderData.total })));
    }
  }, [paymentMethods.length, orderData?.total]);

  const carregarDadosCheckout = async () => {
    try {
      setLoading(true);

      // Carregar dados do checkout do sessionStorage
      const checkoutData = JSON.parse(sessionStorage.getItem('helpnet_checkout_data') || '{}');

      // Aplicar cupons se existirem nos dados salvos
      if (checkoutData.appliedCoupons && Array.isArray(checkoutData.appliedCoupons)) {
        // Note: CartContext will handle loading coupons from storage
      }

      // Obter itens selecionados
      const selectedItemIds = checkoutData.selectedItems || getSelectedItems();
      const selectedItems = items.filter(item => selectedItemIds.includes(item.id));

      // Carregar endereços do cliente
      const enderecosResponse = await clienteService.listarEnderecos();
      const enderecos = enderecosResponse.enderecos || [];
      setAddresses(enderecos);

      // Selecionar endereço salvo ou primeiro como padrão
      let selectedAddressToUse = null;
      if (checkoutData.selectedAddressId && enderecos.length > 0) {
        selectedAddressToUse = enderecos.find(a => a.EnderecoID === checkoutData.selectedAddressId) || enderecos[0];
      } else if (enderecos.length > 0) {
        selectedAddressToUse = enderecos[0];
      }

      if (selectedAddressToUse) {
        console.log('[CheckoutPage] Setting selected address and calculating freight:', selectedAddressToUse.EnderecoID);
        setSelectedAddress(selectedAddressToUse);
        // Calcular frete automaticamente para o endereço selecionado e itens selecionados
        console.log('[CheckoutPage] Calling calculateFreight with:', selectedAddressToUse.EnderecoID, selectedItemIds);
        try {
          await calculateFreight(selectedAddressToUse.EnderecoID, selectedItemIds);
          console.log('[CheckoutPage] calculateFreight completed successfully');
        } catch (error) {
          console.error('[CheckoutPage] Error in calculateFreight:', error);
          showError('Erro ao calcular frete: ' + error.message);
        }
        setSelectedFreight(null); // Não selecionar frete automaticamente
      } else {
        console.log('[CheckoutPage] No address selected, skipping freight calculation');
        showInfo('Selecione um endereço para calcular o frete');
      }

      // Calcular subtotal apenas dos itens selecionados (usando preços já com desconto)
      const selectedSubtotal = selectedItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);

      // Calcular desconto à vista
      const currentDiscountPercentage = getCurrentDiscountPercentage();
      // Apply coupon discounts first, then payment discounts to the remaining amount
      const amountAfterCouponDiscount = selectedSubtotal - couponDiscount;
      const discountAmount = amountAfterCouponDiscount * (currentDiscountPercentage / 100);

      // Usar valores calculados do CartContext
      const freteCost = appliedCoupons.some(coupon => coupon.TipoDesconto === 'frete_gratis') ? 0 : freight.valor;

      // Calcular total correto
      const totalCalculado = amountAfterCouponDiscount - discountAmount + freteCost;

      // Preparar dados do pedido usando valores do CartContext
      const dadosPedido = {
        items: selectedItems,
        subtotal: selectedSubtotal,
        discountAmount: discountAmount,
        couponDiscountAmount: couponDiscount,
        frete: freteCost,
        total: Math.max(0, totalCalculado)
      };

      setOrderData(dadosPedido);

      // Não preencher automaticamente - cliente deve escolher

    } catch (error) {
      console.error('Erro ao carregar dados do checkout:', error);
    } finally {
      setLoading(false);
    }
  };


  // Atualizar valor do método de pagamento
  const updatePaymentAmount = (id, amount) => {
    const numericAmount = parseFloat(amount) || 0;
    setPaymentMethods(prev => prev.map(method => {
      return method.id === id ? { ...method, amount: numericAmount } : method;
    }));
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

  // Atualizar parcelas para um método de pagamento
  const updateInstallments = (methodId, installments) => {
    setInstallments(prev => ({
      ...prev,
      [methodId]: installments
    }));
  };

  // Adicionar método de pagamento
  const addPaymentMethod = (type) => {
    console.log(`[DEBUG] Adicionando método de pagamento: ${type}`);

    const methodExists = paymentMethods.find(m => m.type === type);
    if (methodExists) {
      console.log(`[DEBUG] Método ${type} já existe`);
      return;
    }

    const methodTemplate = allAvailableMethods.find(m => m.type === type);
    if (!methodTemplate) {
      console.log(`[DEBUG] Template para método ${type} não encontrado`);
      return;
    }

    const newMethod = { ...methodTemplate, active: true };

    setPaymentMethods(prev => [...prev, newMethod]);
  };

  // Remover método de pagamento
  const removePaymentMethod = (id) => {
    // Não permitir remover se for o último método
    if (paymentMethods.length <= 1) return;

    setPaymentMethods(prev => prev.filter(method => method.id !== id));
  };

  // Calcular total dos pagamentos (os valores já incluem descontos aplicados)
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
    console.log('[CheckoutPage] handleAddressChange chamado:', {
      enderecoId: endereco.EnderecoID,
      nome: endereco.Nome,
      cep: endereco.CEP,
      timestamp: new Date().toISOString()
    });

    setSelectedAddress(endereco);

    if (endereco) {
      const selectedItemIds = getSelectedItems();
      console.log('[CheckoutPage] Verificando produtos no carrinho antes de calcular frete:', {
        selectedItemIds,
        totalItens: selectedItemIds.length,
        hasItems: selectedItemIds.length > 0
      });

      if (selectedItemIds.length === 0) {
        console.log('[CheckoutPage] Nenhum produto no carrinho - pulando cálculo de frete');
        return;
      }

      console.log('[CheckoutPage] Chamando calculateFreight:', {
        enderecoId: endereco.EnderecoID,
        produtoIds: selectedItemIds,
        timestamp: new Date().toISOString()
      });

      await calculateFreight(endereco.EnderecoID, selectedItemIds);

      console.log('[CheckoutPage] calculateFreight concluído para endereço:', endereco.EnderecoID);

      // Aguardar um pouco para garantir que calculateFreight terminou de definir
      setTimeout(() => setSelectedFreight(null), 10);

      // Recalcular dados do pedido usando os valores calculados do CartContext
      const selectedItems = items.filter(item => selectedItemIds.includes(item.id));

      // Recalcular subtotal usando preços já com desconto
      const recalculatedSubtotal = selectedItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);

      const currentDiscountPercentage = getCurrentDiscountPercentage();
      // Apply coupon discounts first, then payment discounts to the remaining amount
      const amountAfterCouponDiscount = recalculatedSubtotal - couponDiscount;
      const discountAmount = amountAfterCouponDiscount * (currentDiscountPercentage / 100);

      const freteCost = appliedCoupons.some(coupon => coupon.TipoDesconto === 'frete_gratis') ? 0 : freight.valor;
      const totalCalculado = amountAfterCouponDiscount - discountAmount + freteCost;
      setOrderData({
        items: selectedItems,
        subtotal: recalculatedSubtotal,
        discountAmount: discountAmount,
        couponDiscountAmount: couponDiscount,
        frete: freteCost,
        total: Math.max(0, totalCalculado)
      });

      // Ajustar valor do pagamento para o novo total (se apenas 1 método ativo)
      if (paymentMethods.length === 1) {
        setPaymentMethods(prev => prev.map(method => ({ ...method, amount: total })));
      }
    }
  };


  // Finalizar pedido
  const handleFinalizarPedido = async () => {
    console.log('[DEBUG] Iniciando finalização do pedido');

    if (!selectedAddress) {
      console.log('[DEBUG] Erro: Nenhum endereço selecionado');
      showError('Selecione um endereço de entrega');
      return;
    }

    // Verificar se frete foi selecionado ou há cupom de frete grátis
    const hasFreeShippingCoupon = appliedCoupons.some(coupon => coupon.TipoDesconto === 'frete_gratis');

    if (!selectedFreight && !hasFreeShippingCoupon) {
      console.log('[DEBUG] Erro: Nenhum frete selecionado e nenhum cupom de frete grátis');
      showError('Selecione uma opção de frete ou aplique um cupom de frete grátis válido');
      return;
    }

    const metodosComValor = paymentMethods.filter(method => method.amount > 0);
    console.log(`[DEBUG] Métodos de pagamento com valor: ${metodosComValor.length}`, metodosComValor);

    if (metodosComValor.length === 0) {
      console.log('[DEBUG] Erro: Nenhum método de pagamento com valor');
      showError('Adicione pelo menos um método de pagamento com valor');
      return;
    }

    const totalPagamentos = calcularTotalPagamentos();
    const totalPedido = orderData?.total || 0;

    console.log(`[DEBUG] Total pagamentos: R$ ${totalPagamentos.toFixed(2)}, Total pedido: R$ ${totalPedido.toFixed(2)}`);

    if (Math.abs(totalPagamentos - totalPedido) > 0.01) {
      console.log(`[DEBUG] Erro: Total dos pagamentos não corresponde ao total do pedido`);
      showError('O total dos pagamentos deve ser igual ao valor do pedido');
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
          quantidade: item.quantity,
          precoUnitario: item.price // Send discounted price
        })),
        metodosPagamento: metodosComValor.map(method => ({
          tipo: method.type,
          valor: method.amount,
          descontoAplicado: method.type === 'pix' || method.type === 'debito'
        })),
        frete: selectedFreight ? selectedFreight.valor : 0, // O frete já é calculado apenas para produtos que não têm frete grátis
        descontoVista: getCurrentDiscountPercentage(),
        valorDescontoVista: orderData.discountAmount || 0,
        observacoes: '',
        cuponsAplicados: appliedCoupons.map(coupon => ({
          codigo: coupon.Codigo,
          itensAplicados: coupon.discountDetails?.itemDiscounts?.map(discount => ({
            produtoId: discount.productId,
            descontoAplicado: discount.discountAmount
          })) || []
        }))
      };

      console.log('[DEBUG] Dados do pedido preparados:', {
        enderecoId: dadosPedido.enderecoId,
        itensCount: dadosPedido.itens.length,
        metodosPagamento: dadosPedido.metodosPagamento,
        frete: dadosPedido.frete,
        total: totalPedido
      });

      // Criar pedido via API
      console.log('[DEBUG] Enviando pedido para API...');
      const response = await clienteService.criarPedido(dadosPedido);
      console.log('[DEBUG] Resposta da API:', response);

      // Redirecionar para tela de pagamento
      console.log('[DEBUG] Pedido criado, redirecionando para pagamento');
      
      // Limpar apenas os produtos comprados do carrinho
      const purchasedItemIds = selectedItems.map(item => item.id);
      clear(purchasedItemIds);
      
      showSuccess('Pedido criado! Redirecionando para pagamento...');
      
      // Redirecionar para tela de pagamento com ID do pedido
      setTimeout(() => {
        navigate(`/checkout/pagamento/${response.data.pedidoId}`);
      }, 1500);

    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      showError('Erro ao processar pedido: ' + (error.response?.data?.errors?.join('\n') || error.message));
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
      showSuccess('Comprovante copiado para a área de transferência!');
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
      <ReceiptPage
        receiptData={receiptData}
        handleCompartilharComprovante={handleCompartilharComprovante}
        logoConfig={logoConfig}
        clienteMenu={clienteMenu}
        formatPrice={formatPrice}
      />
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

      <CheckoutSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        logoConfig={logoConfig}
        clienteMenu={clienteMenu}
      />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col md:ml-72">
        <CheckoutHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          count={count}
        />

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
                <OrderItemsSection
                  orderData={orderData}
                  items={items}
                  getSelectedItems={getSelectedItems}
                />

                <AddressSelection
                  addresses={addresses}
                  selectedAddress={selectedAddress}
                  handleAddressChange={handleAddressChange}
                  freightLoading={freightLoading}
                  appliedCoupons={appliedCoupons}
                  freightOptions={freightOptions}
                  selectedFreight={selectedFreight}
                  setSelectedFreight={setSelectedFreight}
                  freightError={freightError}
                />
                <PaymentMethodsSection
                  paymentMethods={paymentMethods}
                  setPaymentMethods={setPaymentMethods}
                  showAllMethods={showAllMethods}
                  setShowAllMethods={setShowAllMethods}
                  allAvailableMethods={allAvailableMethods}
                  updatePaymentAmount={updatePaymentAmount}
                  calculateInstallments={calculateInstallments}
                  installments={installments}
                  updateInstallments={updateInstallments}
                  removePaymentMethod={removePaymentMethod}
                  addPaymentMethod={addPaymentMethod}
                  distribuirValorAutomaticamente={distribuirValorAutomaticamente}
                  orderData={orderData}
                  calcularTotalPagamentos={calcularTotalPagamentos}
                  calcularValorRestante={calcularValorRestante}
                  formatPrice={formatPrice}
                  showInfo={showInfo}
                />
              </div>

              <OrderSummary
                orderData={orderData}
                freightLoading={freightLoading}
                selectedFreight={selectedFreight}
                appliedCoupons={appliedCoupons}
                formatPrice={formatPrice}
                handleFinalizarPedido={handleFinalizarPedido}
                processingOrder={processingOrder}
                selectedAddress={selectedAddress}
                calcularTotalPagamentos={calcularTotalPagamentos}
                calcularValorRestante={calcularValorRestante}
                items={items}
                getSelectedItems={getSelectedItems}
                freightOptions={freightOptions}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default CheckoutPage;
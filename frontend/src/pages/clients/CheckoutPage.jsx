import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { clienteService } from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
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
    { id: 3, type: 'debito', amount: 0, label: 'Cartão de Débito' },
    { id: 4, type: 'boleto', amount: 0, label: 'Boleto Bancário' }
  ];
  const [orderData, setOrderData] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [installments, setInstallments] = useState({});
  const [orderComplete, setOrderComplete] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [showCouponSection, setShowCouponSection] = useState(false);
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

  // Carregar e filtrar cupons disponíveis baseado no carrinho
  useEffect(() => {
    if (items.length > 0 && orderData) {
      carregarCuponsDisponiveis();
    }
  }, [items, orderData]);

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

  // Carregar e filtrar cupons disponíveis
  const carregarCuponsDisponiveis = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // Buscar cupons disponíveis do cliente
      const response = await fetch('/api/cupons/meus', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      const userCoupons = data.success ? data.data : [];

      // Filtrar cupons baseado no conteúdo do carrinho atual
      const selectedItemIds = getSelectedItems();
      const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
      const cartTotal = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);

      const applicableCoupons = [];

      for (const coupon of userCoupons) {
        try {
          // Validar se o cupom é aplicável ao carrinho atual
          const validationResponse = await fetch('/api/cupons/validar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              codigo: coupon.code,
              itensCarrinho: selectedItemIds,
              valorTotal: cartTotal
            })
          });

          if (validationResponse.ok) {
            const validationData = await validationResponse.json();
            if (validationData.valido) {
              applicableCoupons.push({
                ...coupon,
                discountAmount: validationData.desconto,
                finalValue: validationData.valorFinal
              });
            }
          }
        } catch (error) {
          console.error('Erro ao validar cupom:', coupon.code, error);
        }
      }

      setAvailableCoupons(applicableCoupons);
    } catch (error) {
      console.error('Erro ao carregar cupons disponíveis:', error);
      setAvailableCoupons([]);
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

      // Atualizar valores dos métodos de pagamento baseado no novo total apenas se houver apenas 1 método
      setPaymentMethods(prev => {
        if (prev.length === 1) {
          // Se há apenas 1 método, definir o valor total
          return prev.map(method => ({ ...method, amount: dadosAtualizados.total }));
        }
        // Se há múltiplos métodos, manter os valores atuais (usuário pode ajustar manualmente)
        return prev;
      });
    }
  }, [freight.valor, items, appliedCoupons, total]);

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
        setSelectedAddress(selectedAddressToUse);
        // Calcular frete automaticamente para o endereço selecionado e itens selecionados
        await calculateFreight(selectedAddressToUse.EnderecoID, selectedItemIds);
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

      // Definir valor total no PIX por padrão
      setPaymentMethods([{ id: 1, type: 'pix', amount: dadosPedido.total, label: 'PIX', active: true }]);

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
    setSelectedAddress(endereco);

    if (endereco) {
      const selectedItemIds = getSelectedItems();
      await calculateFreight(endereco.EnderecoID, selectedItemIds);

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

  // Aplicar cupom da lista de disponíveis
  const handleApplyCouponFromList = async (couponCode) => {
    const success = await applyCoupon(couponCode, getSelectedItems());
    if (success) {
      setCouponInput('');
      setShowCouponSection(false);
      showSuccess('Cupom aplicado com sucesso!');
      // Recarregar cupons disponíveis para atualizar a lista
      setTimeout(() => carregarCuponsDisponiveis(), 500);
    }
  };

  // Aplicar cupom manualmente
  const handleApplyManualCoupon = async () => {
    if (!couponInput.trim()) {
      showError('Digite o código do cupom');
      return;
    }

    const success = await applyCoupon(couponInput.trim(), getSelectedItems());
    if (success) {
      setCouponInput('');
      setShowCouponSection(false);
      showSuccess('Cupom aplicado com sucesso!');
      // Recarregar cupons disponíveis para atualizar a lista
      setTimeout(() => carregarCuponsDisponiveis(), 500);
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
        cupomCodigos: appliedCoupons.map(coupon => coupon.Codigo)
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
                    {(orderData?.items?.length > 0 ? orderData.items : items.filter(item => getSelectedItems().includes(item.id))).map((item) => (
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
                          {/* Mostrar desconto e/ou frete gratis */}
                          {(() => {
                            const discountValue = Number(item.discount) || 0;
                            const hasFreeShipping = Boolean(item.freeShipping);

                            if (discountValue > 0 && hasFreeShipping) {
                              return <p className="text-sm text-green-600 font-medium">Frete grátis e Desconto {discountValue}%</p>;
                            } else if (discountValue > 0) {
                              return <p className="text-sm text-green-600 font-medium">Desconto {discountValue}%</p>;
                            } else if (hasFreeShipping) {
                              return <p className="text-sm text-green-600 font-medium">Frete gratis</p>;
                            }
                            return null;
                          })()}
                        </div>
                        <div className="text-right">
                          {(() => {
                            const discountValue = Number(item.discount) || 0;
                            const quantity = item.quantity || 1;
                            const totalPrice = item.price * quantity;

                            if (discountValue > 0) {
                              const originalPrice = item.originalPrice || (item.price / (1 - discountValue / 100));
                              const originalTotal = originalPrice * quantity;

                              return (
                                <div>
                                  <p className="font-semibold text-green-600">{formatPrice(totalPrice)}</p>
                                  <p className="text-sm text-slate-400 line-through">{formatPrice(originalTotal)}</p>
                                  <p className="text-sm text-slate-600">{formatPrice(item.price)} cada</p>
                                </div>
                              );
                            } else {
                              return (
                                <div>
                                  <p className="font-semibold text-slate-900">{formatPrice(totalPrice)}</p>
                                  <p className="text-sm text-slate-600">{formatPrice(item.price)} cada</p>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    ))}
                    {(!orderData?.items || orderData.items.length === 0) && items.filter(item => getSelectedItems().includes(item.id)).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-slate-600">Nenhum item selecionado para checkout.</p>
                      </div>
                    )}
                  </div>
 }
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

                      {/* Cupons e Opções de Frete */}
                      {selectedAddress && (
                        <div className="mt-4 space-y-4">
                          {/* Cupons Aplicados */}
                          {appliedCoupons.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <FiTag className="text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">Cupons Aplicados</span>
                              </div>
                              <div className="space-y-3">
                                {appliedCoupons.map((coupon, index) => (
                                  <div
                                    key={index}
                                    className={`p-4 border rounded-lg ${
                                      coupon.TipoDesconto === 'frete_gratis'
                                        ? 'border-green-500 bg-green-50 cursor-pointer'
                                        : 'border-blue-500 bg-blue-50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        {coupon.TipoDesconto === 'frete_gratis' ? (
                                          <FaTruck className="text-green-600" />
                                        )
                                        
                                         : (
                                          <FiTag className="text-blue-600" />
                                        )}
                                        <div>
                                          <h4 className="font-medium text-slate-900">{coupon.Codigo}</h4>
                                          <p className="text-sm text-slate-600">
                                            {coupon.TipoDesconto === 'porcentagem' ? `${coupon.ValorDesconto}% de desconto` :
                                             coupon.TipoDesconto === 'valor_fixo' ? `R$ ${coupon.ValorDesconto} de desconto` :
                                             coupon.TipoDesconto === 'frete_gratis' ? 'Frete grátis' :
                                             'Desconto aplicado'}
                                          </p>
                                          {coupon.TipoDesconto === 'frete_gratis' && (
                                            <p className="text-sm text-green-700 font-medium">Entrega gratuita</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        {coupon.TipoDesconto === 'frete_gratis' ? (
                                          <div>
                                            <p className="font-medium text-green-600">GRÁTIS</p>
                                            <p className="text-sm text-slate-600">Selecionado</p>
                                          </div>
                                         :
                                          <p className="font-medium text-blue-600">
                                            -{coupon.TipoDesconto === 'porcentagem' ? `${coupon.ValorDesconto}%` : formatPrice(coupon.ValorDesconto)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    {coupon.TipoDesconto === 'frete_gratis' && (
                                      <div className="flex items-center gap-2 mt-2">
                                        <FaCheck className="text-green-600" />
                                        <span className="text-sm text-green-600">Cupom de frete aplicado</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Opções de Frete */}
                          {(!appliedCoupons.some(coupon => coupon.TipoDesconto === 'frete_gratis')) && freightOptions.length > 0 && (
                            <>
                              <div className="flex items-center gap-2 mb-3">
                                <FaTruck className="text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">Opções de Frete</span>
                              </div>

                              {/* Mostrar opções de frete */}
                              {freightOptions.map((option) => (
                                <div
                                  key={option.id}
                                  onClick={() => setSelectedFreight(option)}
                                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                    selectedFreight?.id === option.id
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <FaTruck className="text-slate-400" />
                                      <div>
                                        <h4 className="font-medium text-slate-900">{option.nome}</h4>
                                        <p className="text-sm text-slate-600">{option.transportadora}</p>
                                        <p className="text-sm text-slate-600">{option.descricao}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium text-blue-600">{formatPrice(option.valor)}</p>
                                      <p className="text-sm text-slate-600">{option.prazo}</p>
                                    </div>
                                  </div>
                                  {selectedFreight?.id === option.id && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <FaCheck className="text-blue-600" />
                                      <span className="text-sm text-blue-600">Selecionado</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </>
                          )}

                          {/* Seção de Cupons */}
                          <div className="mt-6 border-t border-slate-200 pt-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <FiTag className="text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">Cupons Disponíveis</span>
                              </div>
                              <button
                                onClick={() => setShowCouponSection(!showCouponSection)}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {showCouponSection ? 'Ocultar' : 'Ver cupons'}
                              </button>
                            </div>

                            {showCouponSection && (
                              <div className="space-y-4">
                                {/* Lista de cupons aplicáveis */}
                                {availableCoupons.length > 0 ? (
                                  <div className="space-y-3">
                                    <p className="text-sm text-slate-600">Cupons aplicáveis ao seu carrinho:</p>
                                    {availableCoupons.map((coupon) => (
                                      <div
                                        key={coupon.id}
                                        className="p-4 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-mono text-sm font-bold px-2 py-1 rounded bg-blue-600 text-white">
                                                {coupon.code}
                                              </span>
                                              <span className="text-sm text-green-600 font-medium">
                                                {coupon.type === 'free_shipping' ? 'Frete Grátis' :
                                                 coupon.type === 'percentage' ? `${coupon.discount}% OFF` :
                                                 `R$ ${coupon.discount} OFF`}
                                              </span>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2">{coupon.description}</p>
                                            {coupon.discountAmount > 0 && (
                                              <p className="text-sm text-green-600 font-medium">
                                                Desconto: R$ {coupon.discountAmount.toFixed(2)}
                                              </p>
                                            )}
                                            {coupon.minValue > 0 && (
                                              <p className="text-xs text-slate-500">
                                                Valor mínimo: R$ {coupon.minValue}
                                              </p>
                                            )}
                                          </div>
                                          <button
                                            onClick={() => handleApplyCouponFromList(coupon.code)}
                                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                          >
                                            Aplicar
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )
                                : (
                                  <p className="text-sm text-slate-600">Nenhum cupom aplicável encontrado para os itens do seu carrinho.</p>
                                )}

                                {/* Aplicar cupom manualmente */}
                                <div className="border-t border-slate-200 pt-4">
                                  <p className="text-sm text-slate-600 mb-3">Ou digite o código de um cupom:</p>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={couponInput}
                                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                      placeholder="CÓDIGO DO CUPOM"
                                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm uppercase"
                                      onKeyPress={(e) => e.key === 'Enter' && handleApplyManualCoupon()}
                                    />
                                    <button
                                      onClick={handleApplyManualCoupon}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                      Aplicar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

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
                                {method.type === 'debito' && <FaCreditCard className="text-slate-400" />}
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
                                {method.type === 'debito' && 'Débito instantâneo'}
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

                        <div className="space-y-3">
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



                          {/* Opções de parcelas */}
                          {method.amount > 0 && method.type === 'cartao' && (
                            <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                              {/* Parcelas para cartão de crédito */}
                              <div>
                                <h4 className="text-sm font-medium text-slate-900 mb-2">Parcelas</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {calculateInstallments(method.amount).slice(0, 6).map((installment, index) => (
                                    <button
                                      key={index}
                                      onClick={() => {
                                        updateInstallments(method.id, installment.installments);
                                        showInfo(`Parcelamento em ${installment.installments}x selecionado`);
                                      }}
                                      className={`p-2 text-xs border rounded-lg transition-colors ${
                                        installments[method.id] === installment.installments
                                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                      }`}
                                    >
                                      {installment.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
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
                        ) : orderData?.frete === 0 && appliedCoupons.some(coupon => coupon.TipoDesconto === 'frete_gratis') ? (
                          <div className="text-right">
                            <div className="text-green-600 font-medium">Frete Grátis</div>
                            <div className="text-xs text-slate-500">{selectedFreight?.nome || 'Cupom aplicado'}</div>
                          </div>
                        ) : selectedFreight ? (
                          <div className="text-right">
                            <div>{formatPrice(orderData?.frete || 0)}</div>
                            <div className="text-xs text-slate-500">{selectedFreight.nome}</div>
                          </div>
                        ) : (
                          formatPrice(orderData?.frete || 0)
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
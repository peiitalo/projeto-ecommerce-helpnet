import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { clienteService, entregaApi } from '../../services/api';

// Constantes do vendedor
const VENDOR_INFO = {
  name: 'INDÚSTRIA XYZ LTDA',
  empresa: 'Empresa MVP',
  email: 'rh@industriaxyz.com.br',
  telefone: '(71) 99999-0008',
  cnpj: '45.678.901/0001-23',
  endereco: 'Principal, IMBUÍ, SALVADOR - BA'
};
import {
  FaUser,
  FaShoppingCart,
  FaHeart,
  FaBell,
  FaSignOutAlt,
  FaBox,
  FaTruck,
  FaCheck,
  FaClock,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaStore,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaPercentage,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaCopy
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
  FiClock as FiClockIcon,
  FiInfo,
  FiDollarSign,
  FiPercent
} from 'react-icons/fi';

function OrdersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [deliveryTracking, setDeliveryTracking] = useState({});
  const { logout } = useAuth();

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
    { label: 'Histórico', to: '/historico', icon: <FiClockIcon className="text-slate-500" /> },
    { label: 'Meus Cupons', to: '/cupons', icon: <FiCreditCard className="text-slate-500" /> },
    { label: 'Endereços', to: '/enderecos', icon: <FiMapPin className="text-slate-500" /> },
    { label: 'Suporte', to: '/suporte', icon: <FiHelpCircle className="text-slate-500" /> },
    { label: 'Configurações', to: '/configuracoes', icon: <FiSettings className="text-slate-500" /> },
  ];

  // Carregar pedidos atuais
  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      const response = await clienteService.listarPedidos();
      const pedidos = response.pedidos || [];

      // Transformar dados da API para o formato esperado pelo componente
      const pedidosFormatados = pedidos.map(pedido => {
        const subtotal = parseFloat(pedido.Total || 0);
        const frete = parseFloat(pedido.ValorFrete || 0);
        const desconto = parseFloat(pedido.ValorDesconto || 0);
        const totalPago = parseFloat(pedido.TotalPago || 0);
        const totalFinal = subtotal + frete - desconto;
        
        return {
          id: `PED-${pedido.PedidoID}`,
          pedidoId: pedido.PedidoID,
          date: pedido.DataPedido,
          status: pedido.Status,
          statusPagamento: pedido.StatusPagamento || 'PENDENTE',
          subtotal: subtotal,
          frete: frete,
          desconto: desconto,
          total: totalFinal,
          totalPago: totalPago,
          totalRestante: Math.max(0, totalFinal - totalPago),
          parcelas: pedido.Parcelas || 1,
          valorParcela: pedido.Parcelas ? (totalFinal / pedido.Parcelas) : totalFinal,
          items: pedido.itensPedido?.map(item => ({
            id: item.ItemPedidoID,
            name: item.produto?.Nome || 'Produto não informado',
            sku: item.produto?.SKU || '',
            quantity: item.Quantidade || 0,
            price: parseFloat(item.PrecoUnitario || 0),
            total: parseFloat(item.PrecoUnitario || 0) * (item.Quantidade || 0),
            seller: {
              id: item.produto?.vendedor?.VendedorID || null,
              name: item.produto?.vendedor?.Nome || VENDOR_INFO.name,
              email: item.produto?.vendedor?.Email || VENDOR_INFO.email,
              telefone: item.produto?.vendedor?.Telefone || VENDOR_INFO.telefone,
              cnpj: item.produto?.vendedor?.CNPJ || VENDOR_INFO.cnpj,
              empresa: item.produto?.vendedor?.NomeEmpresa || VENDOR_INFO.empresa,
              endereco: VENDOR_INFO.endereco
            },
            image: item.produto?.ImagemPrincipal || '/placeholder-image.png'
          })) || [],
          sellers: [...new Map((pedido.itensPedido || []).map(item => [
            item.produto?.vendedor?.VendedorID,
            {
              id: item.produto?.vendedor?.VendedorID || null,
              name: item.produto?.vendedor?.Nome || VENDOR_INFO.name,
              email: item.produto?.vendedor?.Email || VENDOR_INFO.email,
              telefone: item.produto?.vendedor?.Telefone || VENDOR_INFO.telefone,
              cnpj: item.produto?.vendedor?.CNPJ || VENDOR_INFO.cnpj,
              empresa: item.produto?.vendedor?.NomeEmpresa || VENDOR_INFO.empresa,
              endereco: VENDOR_INFO.endereco
            }
          ]).filter(([id]) => id)).values()],
          address: pedido.Endereco ? {
            name: pedido.Endereco.Nome || 'Endereço não informado',
            street: pedido.Endereco.Logradouro || '',
            number: pedido.Endereco.Numero || '',
            complement: pedido.Endereco.Complemento || '',
            neighborhood: pedido.Endereco.Bairro || '',
            city: pedido.Endereco.Cidade || '',
            state: pedido.Endereco.UF || '',
            cep: pedido.Endereco.CEP || 'Não informado',
            fullAddress: `${pedido.Endereco.Logradouro || ''}, ${pedido.Endereco.Numero || ''} ${pedido.Endereco.Complemento ? '- ' + pedido.Endereco.Complemento : ''}, ${pedido.Endereco.Bairro || ''}, ${pedido.Endereco.Cidade || ''} - ${pedido.Endereco.UF || ''}, CEP: ${pedido.Endereco.CEP || ''}`
          } : {
            name: 'Endereço não informado',
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            cep: '',
            fullAddress: 'Endereço não informado'
          },
          paymentMethods: (pedido.pagamentosPedido || []).map(pg => ({
            id: pg.PagamentoPedidoID,
            metodo: pg.MetodoPagamento?.Nome || 'Não informado',
            valor: parseFloat(pg.ValorPago || 0),
            status: pg.StatusPagamento || 'PENDENTE',
            data: pg.DataPagamento,
            parcelas: pg.Parcelas || 1,
            valorParcela: pg.Parcelas ? (parseFloat(pg.ValorPago || 0) / pg.Parcelas) : parseFloat(pg.ValorPago || 0),
            transactionId: pg.TransactionId || null
          })).filter(pm => pm.metodo !== 'Não informado'),
          estimatedDelivery: pedido.PrevisaoEntrega || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          cupomDesconto: pedido.CupomDesconto || null,
          observacoes: pedido.Observacoes || null
        };
      });

      setOrders(pedidosFormatados);
      setLoading(false);

      // Carregar informações de entrega em background (não bloqueia a UI)
      carregarInformacoesEntrega(pedidosFormatados);

    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setOrders([]);
      setLoading(false);
    }
  };

  const carregarInformacoesEntrega = async (pedidos) => {
    // Carregar informações de entrega em paralelo para melhor performance
    const promises = pedidos.map(async (pedido) => {
      try {
        const entregaResponse = await entregaApi.buscarEntregaCliente(pedido.pedidoId);
        if (entregaResponse.success && entregaResponse.entrega) {
          return { [pedido.id]: entregaResponse.entrega };
        }
      } catch (error) {
        console.error(`Erro ao carregar entrega para pedido ${pedido.id}:`, error);
      }
      return null;
    });

    try {
      const results = await Promise.allSettled(promises);
      const trackingInfo = {};
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          Object.assign(trackingInfo, result.value);
        }
      });

      setDeliveryTracking(trackingInfo);
    } catch (error) {
      console.error('Erro ao carregar informações de entrega:', error);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair da conta?')) {
      logout();
      window.location.href = '/login';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'entregue':
      case 'concluido':
        return <FaCheckCircle className="text-green-600" />;
      case 'em trânsito':
      case 'em_transito':
      case 'enviado':
        return <FaTruck className="text-blue-600" />;
      case 'processando':
      case 'preparando':
        return <FaClock className="text-yellow-600" />;
      case 'cancelado':
        return <FaTimesCircle className="text-red-600" />;
      case 'expirado':
        return <FaExclamationTriangle className="text-orange-600" />;
      default:
        return <FaBox className="text-slate-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'entregue':
      case 'concluido':
        return 'bg-green-100 text-green-800';
      case 'em trânsito':
      case 'em_transito':
      case 'enviado':
        return 'bg-blue-100 text-blue-800';
      case 'processando':
      case 'preparando':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      case 'expirado':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'aprovado':
      case 'concluido':
      case 'pago':
        return <FaCheckCircle className="text-green-600" />;
      case 'pendente':
        return <FaClock className="text-yellow-600" />;
      case 'rejeitado':
      case 'cancelado':
        return <FaTimesCircle className="text-red-600" />;
      case 'expirado':
        return <FaExclamationTriangle className="text-orange-600" />;
      default:
        return <FaMoneyBillWave className="text-slate-600" />;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'aprovado':
      case 'concluido':
      case 'pago':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejeitado':
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      case 'expirado':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const generatePDF = async (order) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Cabeçalho da empresa
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('HelpNet', 20, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Plataforma de E-commerce', 20, 28);
    
    // Linha separadora
    doc.line(20, 35, 190, 35);
    
    // Título do comprovante
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROVANTE DE PEDIDO', 20, 45);
    
    // Informações do pedido
    let y = 55;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Pedido: ${order.id}`, 20, y);
    doc.text(`Data: ${formatDate(order.date)}`, 120, y);
    y += 8;
    doc.text(`Status: ${order.status}`, 20, y);
    doc.text(`Pagamento: ${order.statusPagamento}`, 120, y);
    
    // Produtos
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUTOS', 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    
    order.items.forEach(item => {
      const line = `${item.name} - Qtd: ${item.quantity} - ${formatPrice(item.total)}`;
      if (line.length > 80) {
        const words = line.split(' ');
        let currentLine = '';
        words.forEach(word => {
          if ((currentLine + word).length > 80) {
            doc.text(currentLine, 20, y);
            y += 6;
            currentLine = word + ' ';
          } else {
            currentLine += word + ' ';
          }
        });
        if (currentLine) {
          doc.text(currentLine, 20, y);
          y += 6;
        }
      } else {
        doc.text(line, 20, y);
        y += 6;
      }
      doc.text(`Vendedor: ${item.seller.name}`, 25, y);
      y += 8;
    });
    
    // Resumo financeiro
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO FINANCEIRO', 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: ${formatPrice(order.subtotal)}`, 20, y);
    y += 6;
    if (order.frete > 0) {
      doc.text(`Frete: ${formatPrice(order.frete)}`, 20, y);
      y += 6;
    }
    if (order.desconto > 0) {
      doc.text(`Desconto: -${formatPrice(order.desconto)}`, 20, y);
      y += 6;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ${formatPrice(order.total)}`, 20, y);
    
    // Endereço
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('ENDEREÇO DE ENTREGA', 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(order.address.name, 20, y);
    y += 6;
    doc.text(order.address.fullAddress, 20, y);
    
    // Pagamentos
    if (order.paymentMethods?.length > 0) {
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('PAGAMENTOS', 20, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      order.paymentMethods.forEach(pm => {
        doc.text(`${pm.metodo}: ${formatPrice(pm.valor)} - ${pm.status}`, 20, y);
        y += 6;
      });
    }
    
    // Rodapé
    doc.setFontSize(8);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 280);
    doc.text('HelpNet - Todos os direitos reservados', 120, 280);
    
    // Salvar PDF
    doc.save(`comprovante-pedido-${order.id}.pdf`);
  };

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando pedidos...</p>
          </div>
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

      {/* Sidebar Mobile (Drawer) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
           <div className="flex items-center">
             {logoConfig.useImage ? (
               <img
                 src={logoConfig.imageUrl}
                 alt={logoConfig.altText}
                 className="h-8 w-auto"
               />
             ) : (
               <span className="text-lg font-semibold text-blue-700">{logoConfig.textLogo}</span>
             )}
           </div>
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
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
          >
            <FaSignOutAlt />
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>
      </div>

      {/* Sidebar Desktop (fixa e sempre aberta) */}
      <aside className="hidden md:flex md:w-72 bg-white border-r border-slate-200 flex-col fixed h-screen">
        <div className="h-16 px-6 border-b border-slate-200 flex items-center sticky top-0 bg-white z-10">
           <div className="flex items-center gap-2">
             {logoConfig.useImage ? (
               <img
                 src={logoConfig.imageUrl}
                 alt={logoConfig.altText}
                 className="h-8 w-auto"
               />
             ) : (
               <span className="text-xl font-semibold text-blue-700">{logoConfig.textLogo}</span>
             )}
           </div>
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
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
          >
            <FaSignOutAlt />
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col md:ml-72">
        {/* Header */}
        <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 h-16">
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

              {/* Ícones de ação */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Link to="/favoritos" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <FaHeart />
                </Link>
                <Link to="/notificacoes" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <FaBell />
                </Link>
                <Link to="/carrinho" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                  <FaShoppingCart />
                </Link>
                <Link to="/perfil" className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">
                  <FaUser />
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back button and Cabeçalho */}
            <div className="mb-8">
              <Link
                to="/home"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
              >
                <FaArrowLeft />
                <span>Voltar</span>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Meus Pedidos</h1>
              <p className="text-slate-600">Acompanhe o status dos seus pedidos atuais</p>
            </div>

            {/* Lista de pedidos */}
            {orders.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {orders.map((order, index) => (
                  <div key={order.id} className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 ${
                    index % 2 === 0 ? 'border-blue-200' : 'border-purple-200'
                  }`}>
                    <div className={`p-4 ${
                      index % 2 === 0 ? 'bg-gradient-to-br from-blue-50 to-blue-100' : 'bg-gradient-to-br from-purple-50 to-purple-100'
                    }`}>
                      {/* Header do card */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <h3 className="font-semibold text-slate-900 text-base">{order.id}</h3>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Produtos comprados - informação principal */}
                      <div className="mb-3">
                        <div className="space-y-2">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <div key={item.id || idx} className="flex items-center gap-2">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-8 h-8 object-cover rounded border border-slate-200 flex-shrink-0"
                                onError={(e) => {
                                  e.target.src = '/placeholder-image.png';
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                                <p className="text-xs text-slate-600">Qtd: {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs text-slate-500">+{order.items.length - 2} produto(s)</p>
                          )}
                        </div>
                      </div>

                      {/* Informações secundárias - preço e detalhes */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-left">
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <FaCalendarAlt className="text-xs" />
                            {formatDate(order.date)}
                          </p>
                          <p className="text-sm text-slate-600">
                            {order.items.length} produto(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-slate-900">{formatPrice(order.total)}</p>
                          {order.parcelas > 1 && (
                            <p className="text-xs text-blue-600 font-medium">
                              {order.parcelas}x de {formatPrice(order.valorParcela)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status de pagamento */}
                      <div className="mb-3">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.statusPagamento)}`}>
                          Pagamento: {order.statusPagamento}
                        </span>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors text-sm font-medium"
                        >
                          <FaEye />
                          Ver Detalhes
                        </button>

                        {(order.statusPagamento === 'PENDENTE' || order.statusPagamento === 'PARCIAL') && (
                          <Link
                            to={`/checkout/pagamento/${order.pedidoId}`}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors text-sm font-medium"
                          >
                            <FiCreditCard />
                            Continuar Pagamento
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>


            ) : (
              <div className="text-center py-16">
                <FaBox className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                <h3 className="text-xl font-medium text-slate-900 mb-2">Nenhum pedido encontrado</h3>
                <p className="text-slate-600 mb-6">Você ainda não fez nenhum pedido</p>
                <Link
                  to="/explorer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiSearch />
                  <span>Explorar Produtos</span>
                </Link>
              </div>
            )}
          </div>
        </main>

        {/* Footer simples */}
        <footer className="bg-slate-900 text-slate-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm">© {new Date().getFullYear()} HelpNet. Todos os direitos reservados.</p>
              <div className="flex items-center gap-5 text-sm">
                <Link to="/termos" className="hover:text-white">Termos</Link>
                <Link to="/privacidade" className="hover:text-white">Privacidade</Link>
                <Link to="/contato" className="hover:text-white">Contato</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Modal de Detalhes do Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-slate-200 rounded-t-xl">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Detalhes do Pedido {selectedOrder.id}</h2>
                <p className="text-sm text-slate-600 mt-1">Pedido realizado em {formatDate(selectedOrder.date)}</p>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Status Geral */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(selectedOrder.status)}
                    <span className="font-medium text-slate-900 text-sm sm:text-base">Status do Pedido</span>
                  </div>
                  <span className={`inline-block px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getPaymentStatusIcon(selectedOrder.statusPagamento)}
                    <span className="font-medium text-slate-900 text-sm sm:text-base">Status do Pagamento</span>
                  </div>
                  <span className={`inline-block px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${getPaymentStatusColor(selectedOrder.statusPagamento)}`}>
                    {selectedOrder.statusPagamento}
                  </span>
                </div>
              </div>

              {/* Produtos Detalhados */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <FiPackage className="text-blue-600" />
                  Produtos do Pedido ({selectedOrder.items.length})
                </h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, index) => (
                    <div key={item.id || index} className="bg-white rounded-lg p-3 sm:p-4 border">
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg bg-slate-100 border border-slate-200 mx-auto sm:mx-0"
                          onError={(e) => {
                            e.target.src = '/placeholder-image.png';
                          }}
                        />
                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                            <div className="text-center sm:text-left">
                              <h4 className="font-semibold text-slate-900 text-sm sm:text-base">{item.name}</h4>
                              {item.sku && (
                                <p className="text-xs sm:text-sm text-slate-500">SKU: {item.sku}</p>
                              )}
                            </div>
                            <div className="text-center sm:text-right">
                              <p className="font-bold text-lg text-slate-900">{formatPrice(item.total)}</p>
                              <p className="text-sm text-slate-600">{formatPrice(item.price)} × {item.quantity}</p>
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 rounded p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 justify-center sm:justify-start">
                                <FaStore className="text-blue-600" />
                                <span className="font-medium text-slate-900 text-sm">{item.seller.name}</span>
                              </div>
                              <button
                                onClick={() => setSelectedSeller(item.seller)}
                                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 justify-center sm:justify-end"
                              >
                                <FaEye />
                                Ver vendedor
                              </button>
                            </div>
                            {item.seller.empresa && (
                              <p className="text-xs sm:text-sm text-slate-600 mt-1 text-center sm:text-left">{item.seller.empresa}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo Financeiro Detalhado */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FiDollarSign className="text-green-600" />
                  Resumo Financeiro Completo
                </h3>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal dos produtos:</span>
                      <span className="font-medium">{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.frete > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Frete:</span>
                        <span className="font-medium">{formatPrice(selectedOrder.frete)}</span>
                      </div>
                    )}
                    {selectedOrder.desconto > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <FaPercentage className="text-xs" />
                          Desconto:
                        </span>
                        <span className="font-medium">-{formatPrice(selectedOrder.desconto)}</span>
                      </div>
                    )}
                    {selectedOrder.cupomDesconto && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <FiTag className="text-xs" />
                          Cupom ({selectedOrder.cupomDesconto}):
                        </span>
                        <span className="font-medium">Aplicado</span>
                      </div>
                    )}
                    <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-lg">
                      <span>Total Final:</span>
                      <span>{formatPrice(selectedOrder.total)}</span>
                    </div>
                    {selectedOrder.parcelas > 1 && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>Parcelamento:</span>
                        <span className="font-medium">{selectedOrder.parcelas}x de {formatPrice(selectedOrder.valorParcela)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pagamentos Detalhados */}
              {selectedOrder.paymentMethods?.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <FiCreditCard className="text-green-600" />
                    Histórico de Pagamentos
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.paymentMethods.map((pm, idx) => (
                      <div key={pm.id || idx} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getPaymentStatusIcon(pm.status)}
                            <span className="font-semibold text-slate-900">{pm.metodo}</span>
                          </div>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPaymentStatusColor(pm.status)}`}>
                            {pm.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600 mb-1">Valor Pago:</p>
                            <p className="font-bold text-lg text-green-600">{formatPrice(pm.valor)}</p>
                          </div>
                          {pm.parcelas > 1 && (
                            <div>
                              <p className="text-slate-600 mb-1">Parcelamento:</p>
                              <p className="font-semibold">{pm.parcelas}x de {formatPrice(pm.valorParcela)}</p>
                            </div>
                          )}
                        </div>
                        {pm.data && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-sm text-slate-600">
                              <FaCalendarAlt className="inline mr-1" />
                              Processado em: {new Date(pm.data).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        )}
                        {pm.transactionId && (
                          <div className="mt-2">
                            <span className="text-sm text-slate-600">ID da Transação: </span>
                            <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded border">{pm.transactionId}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rastreamento detalhado */}
              {deliveryTracking[selectedOrder.id] && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <FaTruck className="text-blue-600" />
                    Rastreamento da Entrega
                  </h3>

                  <div className="bg-white rounded-lg p-4 border mb-4">
                    {deliveryTracking[selectedOrder.id].CodigoRastreio && (
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-slate-900">Código de Rastreio:</span>
                        <span className="font-mono bg-slate-100 px-3 py-1 rounded border text-sm">
                          {deliveryTracking[selectedOrder.id].CodigoRastreio}
                        </span>
                      </div>
                    )}
                    {deliveryTracking[selectedOrder.id].Transportadora && (
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-slate-900">Transportadora:</span>
                        <span className="text-slate-700">{deliveryTracking[selectedOrder.id].Transportadora}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">Status Atual:</span>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        deliveryTracking[selectedOrder.id].StatusEntrega === 'Entregue' ? 'bg-green-100 text-green-800' :
                        deliveryTracking[selectedOrder.id].StatusEntrega === 'EmTransito' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {deliveryTracking[selectedOrder.id].StatusEntrega}
                      </span>
                    </div>
                  </div>

                  {deliveryTracking[selectedOrder.id].rastreamentos && deliveryTracking[selectedOrder.id].rastreamentos.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-3">Histórico de Movimentação</h4>
                      <div className="space-y-3">
                        {deliveryTracking[selectedOrder.id].rastreamentos.map((rastreamento, index) => (
                          <div key={index} className="flex items-start gap-4 p-3 bg-white rounded-lg border">
                            <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                              index === 0 ? 'bg-blue-600' : 'bg-slate-300'
                            }`}></div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{rastreamento.status}</p>
                              {rastreamento.local && (
                                <p className="text-sm text-slate-600 mt-1">
                                  <FaMapMarkerAlt className="inline mr-1" />
                                  {rastreamento.local}
                                </p>
                              )}
                              <p className="text-sm text-slate-500 mt-1">
                                <FaCalendarAlt className="inline mr-1" />
                                {new Date(rastreamento.dataHora).toLocaleString('pt-BR')}
                              </p>
                              {rastreamento.observacoes && (
                                <p className="text-sm text-slate-600 mt-2 p-2 bg-slate-50 rounded">{rastreamento.observacoes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Endereço Completo */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FiMapPin className="text-red-600" />
                  Endereço de Entrega Completo
                </h3>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="mb-3">
                    <p className="font-semibold text-slate-900 text-lg">{selectedOrder.address.name}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 mb-1">Logradouro:</p>
                      <p className="font-medium">{selectedOrder.address.street || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 mb-1">Número:</p>
                      <p className="font-medium">{selectedOrder.address.number || 'S/N'}</p>
                    </div>
                    {selectedOrder.address.complement && (
                      <div>
                        <p className="text-slate-600 mb-1">Complemento:</p>
                        <p className="font-medium">{selectedOrder.address.complement}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-600 mb-1">Bairro:</p>
                      <p className="font-medium">{selectedOrder.address.neighborhood || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 mb-1">Cidade/UF:</p>
                      <p className="font-medium">{selectedOrder.address.city} - {selectedOrder.address.state}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 mb-1">CEP:</p>
                      <p className="font-medium">{selectedOrder.address.cep}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600 mb-1">Endereço Completo:</p>
                    <p className="text-slate-900 bg-slate-50 p-2 rounded">{selectedOrder.address.fullAddress}</p>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedOrder.observacoes && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <FiInfo className="text-blue-600" />
                    Observações do Pedido
                  </h3>
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-slate-700">{selectedOrder.observacoes}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white p-4 sm:p-6 border-t border-slate-200 rounded-b-xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => generatePDF(selectedOrder)}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex-1 sm:flex-none"
                >
                  <FaMoneyBillWave />
                  Gerar Comprovante PDF
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-slate-600 text-white py-3 px-4 rounded-lg hover:bg-slate-700 transition-colors font-medium flex-1"
                >
                  Fechar Detalhes
                </button>
                {(selectedOrder.statusPagamento === 'PENDENTE' || selectedOrder.statusPagamento === 'PARCIAL') && (
                  <Link 
                    to={`/checkout/pagamento/${selectedOrder.pedidoId}`}
                    className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center flex-1 sm:flex-none"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Continuar Pagamento
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Informações do Vendedor */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FaStore className="text-blue-600" />
                  Informações do Vendedor
                </h3>
                <button
                  onClick={() => setSelectedSeller(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-slate-600">Nome:</span>
                  <p className="text-slate-900 font-medium">{selectedSeller.name || 'Não informado'}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-slate-600">Empresa:</span>
                  <p className="text-slate-900">{selectedSeller.empresa || 'Não está sendo informado'}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">Email:</span>
                  <p className="text-slate-900">{selectedSeller.email || 'Não está sendo informado'}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-slate-600">Telefone:</span>
                  <p className="text-slate-900">{selectedSeller.telefone || 'Não está sendo informado'}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">CNPJ:</span>
                  <p className="text-slate-900">{selectedSeller.cnpj || 'Não está sendo informado'}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">Endereço:</span>
                  <p className="text-slate-900">{selectedSeller.endereco || 'Não está sendo informado'}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => setSelectedSeller(null)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
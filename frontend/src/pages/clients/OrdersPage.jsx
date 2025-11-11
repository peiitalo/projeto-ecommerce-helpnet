import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { clienteService } from '../../services/api';
import OrderDetailsModal from '../../components/OrderDetailsModal';
import ProductDetailsModal from '../../components/ProductDetailsModal';

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
  FaCopy,
  FaReceipt
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
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [orderModalId, setOrderModalId] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [productModalId, setProductModalId] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
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
            id: item.produto?.ProdutoID || item.ItemPedidoID,
            itemId: item.ItemPedidoID,
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
            image: item.produto?.Imagens?.[0] || '/placeholder-image.png'
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

    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setOrders([]);
      setLoading(false);
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
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">Pedido {order.id}</h3>
                          <p className="text-sm text-slate-600">{formatDate(order.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatPrice(order.total)}</p>
                        <p className="text-sm text-slate-600">{order.items.length} item(s)</p>
                      </div>
                    </div>

                    {/* Vendedores */}
                    {order.sellers && order.sellers.length > 0 && (
                      <div className="bg-slate-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FaUser className="text-blue-600" />
                          <span className="text-sm font-medium text-slate-900">Vendedor{order.sellers.length > 1 ? 'es' : ''}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {order.sellers.map((seller, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedSeller(seller)}
                              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            >
                              {seller.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Produtos agrupados por vendedor */}
                    <div className="border-t border-slate-200 pt-4">
                      <div className="space-y-4">
                        {order.sellers && order.sellers.length > 0 ? (
                          order.sellers.map((seller) => {
                            const sellerItems = order.items.filter(item => item.seller.id === seller.id);
                            return (
                              <div key={seller.id} className="bg-slate-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <FaStore className="text-blue-600 text-sm" />
                                  <span className="text-sm font-medium text-slate-900">{seller.name}</span>
                                  {seller.empresa && (
                                    <span className="text-xs text-slate-600">({seller.empresa})</span>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  {sellerItems.map((item, index) => (
                                    <div key={item.id || index} className="flex items-center gap-3 bg-white rounded p-2">
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-10 h-10 object-cover rounded border border-slate-200 flex-shrink-0"
                                        onError={(e) => {
                                          e.target.src = '/placeholder-image.png';
                                        }}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <button
                                          onClick={() => {
                                            setProductModalId(item.id);
                                            setShowProductModal(true);
                                          }}
                                          className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block text-left"
                                        >
                                          {item.name}
                                        </button>
                                        <p className="text-xs text-slate-600">Qtd: {item.quantity} • {formatPrice(item.price * item.quantity)}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="space-y-3">
                            {order.items.slice(0, 3).map((item, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded border border-slate-200 flex-shrink-0"
                                  onError={(e) => {
                                    e.target.src = '/placeholder-image.png';
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                                  <p className="text-xs text-slate-600">Qtd: {item.quantity} • {formatPrice(item.price * item.quantity)}</p>
                                </div>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-xs text-slate-500">+{order.items.length - 3} produto(s) adicional(is)</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Endereço e método de pagamento */}
                    <div className="border-t border-slate-200 pt-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-slate-900 mb-1">Endereço de entrega</p>
                          <p className="text-slate-600">{order.address.name}</p>
                          <p className="text-slate-600">{order.address.street}</p>
                          <p className="text-slate-600">{order.address.city}</p>
                          <p className="text-slate-600">CEP: {order.address.cep}</p>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 mb-1">Método de pagamento</p>
                          {order.paymentMethods && order.paymentMethods.length > 0 ? (
                            <div className="space-y-1">
                              {order.paymentMethods.map((method, index) => (
                                <p key={index} className="text-slate-600 text-sm">
                                  {method.metodo} - {formatPrice(method.valor)}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-600">Não informado</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="border-t border-slate-200 pt-4 mt-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setOrderModalId(order.id);
                            setShowOrderModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                          title="Ver detalhes do pedido"
                        >
                          <FaEye />
                          <span>Ver Detalhes</span>
                        </button>
                      
                        {(order.statusPagamento === 'PENDENTE' || order.statusPagamento === 'PARCIAL') && (
                          <Link
                            to={`/checkout/pagamento/${order.pedidoId}`}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
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

      {/* Order Details Modal */}
      <OrderDetailsModal
        orderId={orderModalId}
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setOrderModalId(null);
        }}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        productId={productModalId}
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setProductModalId(null);
        }}
      />

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
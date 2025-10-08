import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { clienteService, entregaApi } from '../../services/api';
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
  FaMapMarkerAlt
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
  FiClock as FiClockIcon
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
    { label: 'Categorias', to: '/categorias', icon: <FiTag className="text-slate-500" /> },
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
      const pedidosFormatados = pedidos.map(pedido => ({
        id: `PED-${pedido.PedidoID}`,
        pedidoId: pedido.PedidoID,
        date: pedido.DataPedido,
        status: pedido.Status,
        statusPagamento: pedido.StatusPagamento || 'PENDENTE',
        total: parseFloat(pedido.Total),
        totalPago: parseFloat(pedido.TotalPago || 0),
        totalRestante: Math.max(0, parseFloat(pedido.Total) - parseFloat(pedido.TotalPago || 0)),
        items: pedido.itensPedido.map(item => ({
          name: item.produto.Nome,
          quantity: item.Quantidade,
          price: parseFloat(item.PrecoUnitario),
          seller: item.produto.vendedor ? item.produto.vendedor.Nome : 'N/A',
          sellerId: item.produto.vendedor?.VendedorID || null
        })),
        sellers: [...new Set(pedido.itensPedido.map(item => item.produto.vendedor?.Nome).filter(Boolean))],
        address: pedido.Endereco ? {
          name: pedido.Endereco.Nome || 'Endereço não informado',
          street: `${pedido.Endereco.Nome || ''}, ${pedido.Endereco.Numero || ''}`.trim(),
          city: `${pedido.Endereco.Cidade || ''} - ${pedido.Endereco.UF || ''}`.trim(),
          cep: pedido.Endereco.CEP || 'Não informado'
        } : {
          name: 'Endereço não informado',
          street: '',
          city: '',
          cep: ''
        },
        paymentMethods: (pedido.pagamentosPedido || []).map(pg => ({
          metodo: pg.MetodoPagamento?.Nome,
          valor: parseFloat(pg.ValorPago),
          status: pg.StatusPagamento,
          data: pg.DataPagamento
        })).filter(pm => pm.metodo),
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));

      setOrders(pedidosFormatados);

      // Carregar informações de entrega para cada pedido
      await carregarInformacoesEntrega(pedidosFormatados);

    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarInformacoesEntrega = async (pedidos) => {
    const trackingInfo = {};

    for (const pedido of pedidos) {
      try {
        const entregaResponse = await entregaApi.buscarEntregaCliente(pedido.pedidoId);
        if (entregaResponse.success && entregaResponse.entrega) {
          trackingInfo[pedido.id] = entregaResponse.entrega;
        }
      } catch (error) {
        console.error(`Erro ao carregar entrega para pedido ${pedido.id}:`, error);
      }
    }

    setDeliveryTracking(trackingInfo);
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair da conta?')) {
      logout();
      window.location.href = '/login';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Entregue':
        return <FaCheck className="text-green-600" />;
      case 'Em trânsito':
        return <FaTruck className="text-blue-600" />;
      case 'Processando':
        return <FaClock className="text-yellow-600" />;
      default:
        return <FaBox className="text-slate-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Entregue':
        return 'bg-green-100 text-green-800';
      case 'Em trânsito':
        return 'bg-blue-100 text-blue-800';
      case 'Processando':
        return 'bg-yellow-100 text-yellow-800';
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
                              onClick={() => setSelectedSeller({ name: seller, id: order.items.find(item => item.seller === seller)?.sellerId })}
                              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            >
                              {seller}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status e entrega */}
                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      {deliveryTracking[order.id] ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FaTruck className="text-blue-600" />
                              <span className="text-sm font-medium text-slate-900">Rastreamento</span>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              deliveryTracking[order.id].StatusEntrega === 'Entregue' ? 'bg-green-100 text-green-800' :
                              deliveryTracking[order.id].StatusEntrega === 'EmTransito' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {deliveryTracking[order.id].StatusEntrega}
                            </span>
                          </div>

                          {/* Última atualização */}
                          {deliveryTracking[order.id].rastreamentos && deliveryTracking[order.id].rastreamentos.length > 0 && (
                            <div className="text-sm text-slate-600">
                              <p><strong>Última atualização:</strong> {deliveryTracking[order.id].rastreamentos[0].status}</p>
                              <p className="text-xs">
                                {new Date(deliveryTracking[order.id].rastreamentos[0].dataHora).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          )}

                          {/* Código de rastreio */}
                          {deliveryTracking[order.id].CodigoRastreio && (
                            <div className="text-sm">
                              <p><strong>Código de rastreio:</strong> {deliveryTracking[order.id].CodigoRastreio}</p>
                              {deliveryTracking[order.id].Transportadora && (
                                <p><strong>Transportadora:</strong> {deliveryTracking[order.id].Transportadora}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FaTruck className="text-blue-600" />
                            <span className="text-sm font-medium text-slate-900">Entrega estimada</span>
                          </div>
                          <span className="text-sm text-slate-600">
                            {new Date(order.estimatedDelivery).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status de pagamento agregado */}
                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">Pagamento</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-200">{order.statusPagamento}</span>
                      </div>
                      <div className="mt-2 text-sm text-slate-700">
                        <div>Pago: <span className="font-medium text-green-700">{formatPrice(order.totalPago)}</span> • Restante: <span className="font-medium text-red-700">{formatPrice(order.totalRestante)}</span></div>
                        {order.paymentMethods?.length > 0 && (
                          <div className="text-xs text-slate-600 mt-1">
                            <div className="font-medium mb-1">Pagamentos realizados:</div>
                            {order.paymentMethods.map((pm, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{pm.metodo}:</span>
                                <span className="font-medium text-green-600">{formatPrice(pm.valor)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {(order.statusPagamento === 'PENDENTE' || order.statusPagamento === 'PARCIAL') && (
                        <div className="mt-3">
                          <Link to={`/checkout/pagamento/${order.pedidoId}`} className="inline-block px-3 py-2 text-blue-700 border border-blue-200 rounded hover:bg-blue-50 text-sm">Retomar Pagamento</Link>
                        </div>
                      )}
                    </div>

                    {/* Itens do pedido */}
                    <div className="border-t border-slate-200 pt-4">
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-slate-600">{item.name} (x{item.quantity})</span>
                            <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
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
                          {order.paymentMethods?.length > 0 ? (
                            <div className="text-slate-600 space-y-1">
                              {order.paymentMethods.map((pm, idx) => (
                                <div key={idx} className="text-sm">
                                  {pm.metodo}: {formatPrice(pm.valor)}
                                </div>
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
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <FaBox />
                          <span>Ver Detalhes</span>
                        </button>
                        {order.status === 'Em trânsito' && (
                          <button className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-200">
                            <FaMapMarkerAlt />
                            <span>Rastrear Pedido</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FaBox className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                <h3 className="text-xl font-medium text-slate-900 mb-2">Nenhum pedido em andamento</h3>
                <p className="text-slate-600 mb-6">Você não possui pedidos ativos no momento</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Detalhes - Pedido {selectedOrder.id}</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  <FiX />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Status e informações */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedOrder.status)}
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="text-right text-sm">
                  <p className="text-slate-600">Pedido em {formatDate(selectedOrder.date)}</p>
                  {deliveryTracking[selectedOrder.id] ? (
                    <div>
                      <p className="font-medium">
                        Status da entrega: {deliveryTracking[selectedOrder.id].StatusEntrega}
                      </p>
                      {deliveryTracking[selectedOrder.id].PrevisaoEntrega && (
                        <p>Previsão: {new Date(deliveryTracking[selectedOrder.id].PrevisaoEntrega).toLocaleDateString('pt-BR')}</p>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium">Entrega estimada: {new Date(selectedOrder.estimatedDelivery).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
              </div>

              {/* Rastreamento detalhado */}
              {deliveryTracking[selectedOrder.id] && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-3">Rastreamento da Entrega</h3>

                  {deliveryTracking[selectedOrder.id].CodigoRastreio && (
                    <div className="mb-3">
                      <p className="text-sm"><strong>Código de rastreio:</strong> {deliveryTracking[selectedOrder.id].CodigoRastreio}</p>
                      {deliveryTracking[selectedOrder.id].Transportadora && (
                        <p className="text-sm"><strong>Transportadora:</strong> {deliveryTracking[selectedOrder.id].Transportadora}</p>
                      )}
                    </div>
                  )}

                  {deliveryTracking[selectedOrder.id].rastreamentos && deliveryTracking[selectedOrder.id].rastreamentos.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Histórico de Rastreamento</h4>
                      <div className="space-y-2">
                        {deliveryTracking[selectedOrder.id].rastreamentos.map((rastreamento, index) => (
                          <div key={index} className="flex items-start gap-3 p-2 bg-white rounded border">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">{rastreamento.status}</p>
                              {rastreamento.local && (
                                <p className="text-xs text-slate-600">Local: {rastreamento.local}</p>
                              )}
                              <p className="text-xs text-slate-500">
                                {new Date(rastreamento.dataHora).toLocaleString('pt-BR')}
                              </p>
                              {rastreamento.observacoes && (
                                <p className="text-xs text-slate-600 mt-1">{rastreamento.observacoes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Itens */}
              <div>
                <h3 className="font-medium text-slate-900 mb-3">Itens do pedido</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-slate-600">{item.name} (x{item.quantity})</span>
                      <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 pt-2 mt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Endereço e pagamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Endereço de entrega</h3>
                  <p className="text-slate-600">{selectedOrder.address.name}</p>
                  <p className="text-slate-600">{selectedOrder.address.street}</p>
                  <p className="text-slate-600">{selectedOrder.address.city}</p>
                  <p className="text-slate-600">CEP: {selectedOrder.address.cep}</p>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Método de pagamento</h3>
                  {selectedOrder.paymentMethods?.length > 0 ? (
                    <div className="text-slate-600 space-y-1">
                      {selectedOrder.paymentMethods.map((pm, idx) => (
                        <div key={idx} className="text-sm">
                          {pm.metodo}: {formatPrice(pm.valor)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600">Não informado</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Informações do Vendedor */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Informações do Vendedor</h3>
                <button
                  onClick={() => setSelectedSeller(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-slate-600">Nome:</span>
                  <p className="text-slate-900">{selectedSeller.name || 'Não informado'}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-600">ID do Vendedor:</span>
                  <p className="text-slate-900">{selectedSeller.id || 'Não informado'}</p>
                </div>

                {/* Adicionar mais informações se disponíveis */}
                <div className="text-sm text-slate-500 mt-4">
                  <p>Para mais informações ou suporte, entre em contato conosco.</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => setSelectedSeller(null)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
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
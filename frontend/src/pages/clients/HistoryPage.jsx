import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { clienteService } from '../../services/api';
import OrderDetailsModal from '../../components/OrderDetailsModal';
import {
  FaUser,
  FaShoppingCart,
  FaHeart,
  FaBell,
  FaSignOutAlt,
  FaReceipt,
  FaBox,
  FaTruck,
  FaCheck,
  FaClock,
  FaArrowLeft,
  FaPrint,
  FaDownload,
  FaEye
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

function HistoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [orderModalId, setOrderModalId] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
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

  // Carregar histórico de pedidos
  useEffect(() => {
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      const response = await clienteService.listarPedidos();
      const pedidos = response.pedidos || [];

      // Transformar dados da API para o formato esperado pelo componente
      const pedidosFormatados = pedidos.map(pedido => ({
        id: `PED-${pedido.PedidoID}`,
        date: pedido.DataPedido,
        status: pedido.Status,
        total: parseFloat(pedido.Total),
        clientName: pedido.cliente?.Nome || pedido.Cliente?.Nome || 'Cliente',
        items: pedido.itensPedido.map(item => ({
          name: item.produto.Nome,
          quantity: item.Quantidade,
          price: parseFloat(item.PrecoUnitario),
          seller: item.produto.vendedor ? item.produto.vendedor.Nome : 'N/A',
          sellerId: item.produto.vendedor?.VendedorID || null
        })),
        sellers: [...new Set(pedido.itensPedido.map(item => item.produto.vendedor?.Nome).filter(Boolean))],
        address: {
          name: pedido.Endereco?.Nome || 'Endereço não informado',
          street: pedido.Endereco?.Logradouro && pedido.Endereco?.Numero 
            ? `${pedido.Endereco.Logradouro}, ${pedido.Endereco.Numero}` 
            : 'Endereço não informado',
          city: pedido.Endereco?.Cidade && pedido.Endereco?.UF 
            ? `${pedido.Endereco.Cidade} - ${pedido.Endereco.UF}` 
            : 'Cidade não informada',
          cep: pedido.Endereco?.CEP || 'CEP não informado'
        },
        paymentMethod: pedido.pagamentosPedido?.[0]?.MetodoPagamento?.Nome || 'Método não informado',
        paymentDetails: pedido.pagamentosPedido?.map(pagamento => ({
          method: pagamento.MetodoPagamento?.Nome || 'N/A',
          amount: parseFloat(pagamento.Valor || 0),
          installments: pagamento.Parcelas || 1
        })) || []
      }));

      setOrders(pedidosFormatados);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
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

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    const receiptHTML = `
      <html>
        <head>
          <title>Comprovante - Pedido ${selectedOrder.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .info { margin-bottom: 20px; }
            .info div { margin-bottom: 10px; }
            .items { margin-bottom: 20px; }
            .items table { width: 100%; border-collapse: collapse; }
            .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .total { font-weight: bold; text-align: right; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HelpNet - Comprovante de Compra</h1>
            <h2>Pedido ${selectedOrder.id}</h2>
          </div>

          <div class="info">
            <div><strong>Data da Compra:</strong> ${formatDate(selectedOrder.date)}</div>
            <div><strong>Status do Pedido:</strong> ${selectedOrder.status}</div>
            <div><strong>Cliente:</strong> ${selectedOrder.clientName}</div>
            <div><strong>Método de Pagamento:</strong> ${selectedOrder.paymentMethod}</div>
          </div>

          <div class="items">
            <h3>Produtos Comprados</h3>
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Preço Unitário</th>
                  <th>Total</th>
                  <th>Vendedor</th>
                </tr>
              </thead>
              <tbody>
                ${selectedOrder.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${formatPrice(item.price)}</td>
                    <td>${formatPrice(item.price * item.quantity)}</td>
                    <td>${item.seller}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">
              <strong>Valor Total: ${formatPrice(selectedOrder.total)}</strong>
            </div>
          </div>

          <div class="info">
            <h3>Endereço de Entrega</h3>
            <div>${selectedOrder.address.name}</div>
            <div>${selectedOrder.address.street}</div>
            <div>${selectedOrder.address.city}</div>
            <div>CEP: ${selectedOrder.address.cep}</div>
          </div>

          <div class="footer">
            <p>Este é um comprovante oficial da HelpNet. Data de emissão: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando histórico...</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Histórico de Compras</h1>
              <p className="text-slate-600">Acompanhe todos os seus pedidos e compras realizadas</p>
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
                          <p className="text-slate-600">{order.paymentMethod}</p>
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
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <FaReceipt />
                          <span>Ver Comprovante</span>
                        </button>
                        {order.status === 'Entregue' && (
                          <button className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-200">
                            <FaBox />
                            <span>Avaliar Produtos</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FaReceipt className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                <h3 className="text-xl font-medium text-slate-900 mb-2">Nenhum pedido encontrado</h3>
                <p className="text-slate-600 mb-6">Você ainda não realizou nenhuma compra</p>
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

      {/* Modal de Comprovante */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Comprovante - Pedido {selectedOrder.id}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintReceipt}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                    title="Imprimir comprovante"
                  >
                    <FaPrint />
                    <span className="hidden sm:inline">Imprimir</span>
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-50"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Cabeçalho do comprovante */}
              <div className="text-center border-b border-slate-200 pb-4">
                <h3 className="text-lg font-bold text-slate-900">HelpNet</h3>
                <p className="text-sm text-slate-600">Comprovante de Compra</p>
                <p className="text-sm font-medium text-slate-900">Pedido {selectedOrder.id}</p>
              </div>

              {/* Informações do pedido */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-slate-900">Data da Compra</p>
                  <p className="text-slate-600">{formatDate(selectedOrder.date)}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Status do Pedido</p>
                  <p className="text-slate-600">{selectedOrder.status}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Cliente</p>
                  <p className="text-slate-600">{selectedOrder.clientName}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Método de Pagamento</p>
                  <p className="text-slate-600">{selectedOrder.paymentMethod}</p>
                </div>
              </div>

              {/* Itens */}
              <div>
                <h3 className="font-medium text-slate-900 mb-3">Produtos Comprados</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="border border-slate-200 px-3 py-2 text-left">Produto</th>
                        <th className="border border-slate-200 px-3 py-2 text-center">Qtd</th>
                        <th className="border border-slate-200 px-3 py-2 text-right">Preço Unit.</th>
                        <th className="border border-slate-200 px-3 py-2 text-right">Total</th>
                        <th className="border border-slate-200 px-3 py-2 text-left">Vendedor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index} className="border-b border-slate-200">
                          <td className="border border-slate-200 px-3 py-2">{item.name}</td>
                          <td className="border border-slate-200 px-3 py-2 text-center">{item.quantity}</td>
                          <td className="border border-slate-200 px-3 py-2 text-right">{formatPrice(item.price)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-right">{formatPrice(item.price * item.quantity)}</td>
                          <td className="border border-slate-200 px-3 py-2">{item.seller}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-3">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Valor Total</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Endereço e pagamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Endereço de Entrega</h3>
                  <div className="text-slate-600 space-y-1">
                    <p>{selectedOrder.address.name}</p>
                    <p>{selectedOrder.address.street}</p>
                    <p>{selectedOrder.address.city}</p>
                    <p>CEP: {selectedOrder.address.cep}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Método de Pagamento</h3>
                  <div className="text-slate-600 space-y-1">
                    <p>{selectedOrder.paymentMethod}</p>
                    {selectedOrder.paymentDetails.length > 0 && (
                      <div className="mt-2">
                        {selectedOrder.paymentDetails.map((payment, index) => (
                          <p key={index} className="text-xs">
                            {payment.method}: {formatPrice(payment.amount)}
                            {payment.installments > 1 && ` (${payment.installments}x)`}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rodapé */}
              <div className="text-center text-xs text-slate-500 border-t border-slate-200 pt-4">
                <p>Este é um comprovante oficial da HelpNet</p>
                <p>Data de emissão: {new Date().toLocaleDateString('pt-BR')}</p>
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

      {/* Order Details Modal */}
      <OrderDetailsModal
        orderId={orderModalId}
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setOrderModalId(null);
        }}
      />
    </div>
  );
}

export default HistoryPage;
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import VendorLayout from '../../components/VendorLayout.jsx';
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
  FaUsers,
  FaEnvelope,
  FaPhone
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

function VendorClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info'
  });
  const { logout } = useAuth();

  // Carregar clientes
  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      setClients([
        {
          id: 1,
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '(11) 99999-9999',
          totalOrders: 5,
          totalSpent: 450.00,
          lastOrder: '2024-09-20'
        },
        {
          id: 2,
          name: 'Maria Santos',
          email: 'maria@email.com',
          phone: '(11) 88888-8888',
          totalOrders: 3,
          totalSpent: 280.00,
          lastOrder: '2024-09-18'
        }
      ]);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair da conta?')) {
      logout();
      window.location.href = '/login';
    }
  };

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleSendNotification = (client = null) => {
    setSelectedClient(client);
    setNotificationForm({
      title: '',
      message: '',
      type: 'info'
    });
    setShowNotificationModal(true);
  };

  const handleSendNotificationSubmit = async () => {
    try {
      // Mock API call
      console.log('Enviando notificação:', {
        clientId: selectedClient?.id,
        ...notificationForm
      });
      alert(selectedClient ? 'Notificação enviada para o cliente!' : 'Notificação enviada para todos os clientes!');
      setShowNotificationModal(false);
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      alert('Erro ao enviar notificação');
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <VendorLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando clientes...</p>
          </div>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Meus Clientes</h1>
          <p className="text-slate-600">Gerencie os clientes que compraram seus produtos</p>
        </div>

        {/* Barra de busca */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        </div>

        {/* Lista de clientes - Desktop */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pedidos</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Gasto</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Último Pedido</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaUser className="text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{client.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FaEnvelope className="text-slate-400" />
                          <span>{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaPhone className="text-slate-400" />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{client.totalOrders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{formatPrice(client.totalSpent)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{formatDate(client.lastOrder)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lista de clientes - Mobile */}
        <div className="md:hidden space-y-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FaUser className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-slate-900 mb-1">{client.name}</h3>
                  <div className="space-y-1 text-sm text-slate-600 mb-3">
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="text-slate-400" />
                      <span>{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-slate-400" />
                      <span>{client.phone}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Pedidos</p>
                      <p className="font-medium">{client.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Total Gasto</p>
                      <p className="font-medium">{formatPrice(client.totalSpent)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500">Último Pedido</p>
                      <p className="font-medium">{formatDate(client.lastOrder)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-16">
            <FaUsers className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            <h3 className="text-xl font-medium text-slate-900 mb-2">Nenhum cliente encontrado</h3>
            <p className="text-slate-600 mb-6">Você ainda não possui clientes que compraram seus produtos</p>
            <Link
              to="/vendedor/produtos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPackage />
              <span>Gerenciar Produtos</span>
            </Link>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}

export default VendorClientsPage;
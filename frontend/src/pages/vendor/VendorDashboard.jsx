import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import VendorLayout from '../../layouts/VendorLayout';
import { useAuth } from '../../context/AuthContext';
import { FiTrendingUp, FiPackage, FiUsers, FiDollarSign, FiEye, FiShoppingCart, FiBarChart } from 'react-icons/fi';
import { produtoService } from '../../services/api';
import clienteVendedorApi from '../../services/clienteVendedorApi';
import vendedorApi from '../../services/vendedorApi';

function VendorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    activeProducts: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Carregar estatísticas do dashboard
        const dashboardStats = await vendedorApi.dashboard();
        setStats({
          totalOrders: dashboardStats.pedidos || 0,
          totalCustomers: dashboardStats.clientes || 0,
          totalRevenue: dashboardStats.receita || 0,
          activeProducts: dashboardStats.produtos?.ativos || 0
        });

        // Carregar produtos ativos do vendedor
        if (user?.empresaId) {
          const productsResponse = await produtoService.listarVendedor(user.empresaId, { status: 'ativo', limit: 1000 });
          if (productsResponse.produtos) {
            setStats(prev => ({ ...prev, activeProducts: productsResponse.produtos.length }));
          }
        }

        // Carregar atividade recente (últimos pedidos)
        const ordersResponse = await vendedorApi.listarPedidos({ pagina: 1, limit: 5 });
        if (ordersResponse.pedidos) {
          const activity = ordersResponse.pedidos.map(pedido => ({
            id: pedido.PedidoID,
            type: 'order',
            title: `Novo pedido #${pedido.PedidoID}`,
            description: `${pedido.cliente.NomeCompleto} - R$ ${pedido.Total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            time: new Date(pedido.DataPedido).toLocaleString('pt-BR')
          }));
          setRecentActivity(activity);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total de Pedidos',
      value: stats.totalOrders,
      icon: <FiShoppingCart className="text-blue-600" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Clientes Ativos',
      value: stats.totalCustomers,
      icon: <FiUsers className="text-green-600" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Receita Total',
      value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: <FiDollarSign className="text-yellow-600" />,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Produtos Ativos',
      value: stats.activeProducts,
      icon: <FiPackage className="text-purple-600" />,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  const quickActions = [
    {
      title: 'Adicionar Produto',
      description: 'Cadastrar novo produto na loja',
      icon: <FiPackage className="text-blue-600" />,
      to: '/vendedor/produtos/novo',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100'
    },
    {
      title: 'Ver Pedidos',
      description: 'Gerenciar pedidos dos clientes',
      icon: <FiShoppingCart className="text-green-600" />,
      to: '/vendedor/pedidos',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100'
    },
    {
      title: 'Gerenciar Clientes',
      description: 'Visualizar lista de clientes',
      icon: <FiUsers className="text-purple-600" />,
      to: '/vendedor/clientes',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100'
    },
    {
      title: 'Relatórios',
      description: 'Analisar desempenho da loja',
      icon: <FiBarChart className="text-orange-600" />,
      to: '/vendedor/relatorios',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100'
    }
  ];

  return (
    <VendorLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Visão Geral</h1>
          <p className="mt-2 text-gray-600">Bem-vindo ao seu painel de controle. Aqui você pode gerenciar seus produtos, pedidos e clientes.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className="text-2xl">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.to}
                className={`${action.bgColor} ${action.hoverColor} border border-gray-200 rounded-lg p-4 transition-colors block`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-xl">
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Atividade Recente</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 bg-gray-300 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <FiShoppingCart className="text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhuma atividade recente</p>
          )}
        </div>
      </div>
    </VendorLayout>
  );
}

export default VendorDashboard;
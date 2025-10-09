import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import VendorLayout from '../../components/VendorLayout.jsx';
import { relatoriosApi } from '../../services/api.js';
import { useNotifications } from '../../hooks/useNotifications';
import {
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaDownload,
  FaCalendarAlt,
  FaFilter,
  FaSearch,
  FaDollarSign,
  FaShoppingCart,
  FaUsers,
  FaBox,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';

function VendorReportsPage() {
  const { user } = useAuth();
  const { showSuccess } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [reportType, setReportType] = useState('overview');

  // Mock data for reports
  const mockReports = {
    overview: {
      totalRevenue: 15420.50,
      totalOrders: 127,
      totalCustomers: 89,
      totalProducts: 45,
      revenueChange: 12.5,
      ordersChange: 8.3,
      customersChange: 15.2,
      productsChange: -2.1
    },
    sales: {
      daily: [
        { date: '2024-01-20', revenue: 1250.00, orders: 12 },
        { date: '2024-01-21', revenue: 980.50, orders: 9 },
        { date: '2024-01-22', revenue: 1540.25, orders: 15 },
        { date: '2024-01-23', revenue: 890.75, orders: 8 },
        { date: '2024-01-24', revenue: 2100.00, orders: 18 }
      ],
      topProducts: [
        { name: 'Produto A', sales: 45, revenue: 2250.00 },
        { name: 'Produto B', sales: 32, revenue: 1600.00 },
        { name: 'Produto C', sales: 28, revenue: 1400.00 },
        { name: 'Produto D', sales: 22, revenue: 1100.00 }
      ]
    },
    customers: {
      newCustomers: 23,
      returningCustomers: 66,
      topCustomers: [
        { name: 'João Silva', orders: 12, totalSpent: 1250.00 },
        { name: 'Maria Santos', orders: 8, totalSpent: 890.50 },
        { name: 'Pedro Oliveira', orders: 6, totalSpent: 675.25 }
      ]
    }
  };

  useEffect(() => {
    loadReports();
  }, [dateRange, reportType]);

  const loadReports = async () => {
    try {
      setLoading(true);
      // Load different data based on report type
      if (reportType === 'overview') {
        await relatoriosApi.obterEstatisticasGerais(dateRange);
      } else if (reportType === 'sales') {
        await relatoriosApi.obterDadosVendas(dateRange);
      } else if (reportType === 'customers') {
        await relatoriosApi.obterDadosClientes(dateRange);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getChangeColor = (change) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change) => {
    return change >= 0 ? <FaArrowUp className="text-green-600" /> : <FaArrowDown className="text-red-600" />;
  };

  const exportReport = () => {
    // In a real app, this would trigger a download
    showSuccess('Relatório exportado com sucesso!');
  };

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
            <p className="text-slate-600 mt-1">
              Análise detalhada do desempenho do seu negócio
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="1y">Último ano</option>
            </select>
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaDownload />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="bg-white rounded-lg border border-slate-200 p-1">
          <div className="flex">
            {[
              { id: 'overview', label: 'Visão Geral', icon: <FaChartLine /> },
              { id: 'sales', label: 'Vendas', icon: <FaChartBar /> },
              { id: 'customers', label: 'Clientes', icon: <FaUsers /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  reportType === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando relatórios...</p>
          </div>
        ) : (
          <>
            {/* Overview Report */}
            {reportType === 'overview' && (
              <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Receita Total</p>
                        <p className="text-2xl font-bold text-slate-900">{formatPrice(mockReports.overview.totalRevenue)}</p>
                        <div className={`flex items-center gap-1 text-sm ${getChangeColor(mockReports.overview.revenueChange)}`}>
                          {getChangeIcon(mockReports.overview.revenueChange)}
                          <span>{Math.abs(mockReports.overview.revenueChange)}%</span>
                        </div>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <FaDollarSign className="text-green-600 text-xl" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total de Pedidos</p>
                        <p className="text-2xl font-bold text-slate-900">{mockReports.overview.totalOrders}</p>
                        <div className={`flex items-center gap-1 text-sm ${getChangeColor(mockReports.overview.ordersChange)}`}>
                          {getChangeIcon(mockReports.overview.ordersChange)}
                          <span>{Math.abs(mockReports.overview.ordersChange)}%</span>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FaShoppingCart className="text-blue-600 text-xl" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total de Clientes</p>
                        <p className="text-2xl font-bold text-slate-900">{mockReports.overview.totalCustomers}</p>
                        <div className={`flex items-center gap-1 text-sm ${getChangeColor(mockReports.overview.customersChange)}`}>
                          {getChangeIcon(mockReports.overview.customersChange)}
                          <span>{Math.abs(mockReports.overview.customersChange)}%</span>
                        </div>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <FaUsers className="text-purple-600 text-xl" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total de Produtos</p>
                        <p className="text-2xl font-bold text-slate-900">{mockReports.overview.totalProducts}</p>
                        <div className={`flex items-center gap-1 text-sm ${getChangeColor(mockReports.overview.productsChange)}`}>
                          {getChangeIcon(mockReports.overview.productsChange)}
                          <span>{Math.abs(mockReports.overview.productsChange)}%</span>
                        </div>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <FaBox className="text-orange-600 text-xl" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Receita por Período</h3>
                    <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                      <div className="text-center text-slate-500">
                        <FaChartLine className="text-4xl mx-auto mb-2" />
                        <p>Gráfico de receita</p>
                        <p className="text-sm">Implementação em desenvolvimento</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Pedidos por Status</h3>
                    <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                      <div className="text-center text-slate-500">
                        <FaChartPie className="text-4xl mx-auto mb-2" />
                        <p>Gráfico de status</p>
                        <p className="text-sm">Implementação em desenvolvimento</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sales Report */}
            {reportType === 'sales' && (
              <div className="space-y-6">
                {/* Daily Sales Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Vendas Diárias</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Data</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Receita</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pedidos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {mockReports.sales.daily.map((day, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm text-slate-900">{formatDate(day.date)}</td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{formatPrice(day.revenue)}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{day.orders}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Produtos Mais Vendidos</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Produto</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vendas</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Receita</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {mockReports.sales.topProducts.map((product, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{product.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{product.sales}</td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{formatPrice(product.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Customers Report */}
            {reportType === 'customers' && (
              <div className="space-y-6">
                {/* Customer Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Novos Clientes</p>
                        <p className="text-2xl font-bold text-slate-900">{mockReports.customers.newCustomers}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <FaUsers className="text-green-600 text-xl" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Clientes Recorrentes</p>
                        <p className="text-2xl font-bold text-slate-900">{mockReports.customers.returningCustomers}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FaUsers className="text-blue-600 text-xl" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Customers */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Clientes Mais Ativos</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cliente</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pedidos</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Gasto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {mockReports.customers.topCustomers.map((customer, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{customer.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{customer.orders}</td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{formatPrice(customer.totalSpent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </VendorLayout>
  );
}

export default VendorReportsPage;
import { useState, useEffect } from 'react';
import VendorLayout from '../../layouts/VendorLayout';
import { FiCalendar, FiFilter, FiDownload, FiTrendingUp, FiBarChart2, FiLoader } from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import relatoriosApi from '../../services/relatoriosApi.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function RelatorioPage() {
  const [filters, setFilters] = useState({
    period: '30d',
    category: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [topProductsData, setTopProductsData] = useState(null);

  // Fetch data when filters change
  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsResponse, salesResponse] = await Promise.all([
        relatoriosApi.obterEstatisticasGerais(filters.period, filters.category),
        relatoriosApi.obterDadosVendas(filters.period, filters.category)
      ]);

      if (statsResponse.success && salesResponse.success) {
        setStats(statsResponse.stats);

        // Map sales data to chart format
        const salesChartData = {
          labels: salesResponse.sales.daily.map(day => {
            const date = new Date(day.date);
            return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
          }),
          datasets: [
            {
              label: 'Vendas (R$)',
              data: salesResponse.sales.daily.map(day => day.revenue),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
            },
          ],
        };
        setSalesData(salesChartData);

        // Map top products data to chart format
        const topProductsChartData = {
          labels: salesResponse.sales.topProducts.map(product => product.name),
          datasets: [
            {
              label: 'Vendas',
              data: salesResponse.sales.topProducts.map(product => product.sales),
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              borderColor: 'rgb(34, 197, 94)',
              borderWidth: 1,
            },
          ],
        };
        setTopProductsData(topProductsChartData);
      } else {
        setError('Erro ao carregar dados do relatório');
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Vendas por Período',
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Produtos Mais Vendidos',
      },
    },
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportReport = async () => {
    try {
      const response = await relatoriosApi.exportarRelatorio(filters.period, filters.category);

      // Create blob and download
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_vendas_${filters.period}_${filters.category}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Erro ao exportar relatório');
    }
  };

  return (
    <VendorLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
            <p className="mt-2 text-gray-600">Análise de vendas e desempenho da sua loja</p>
          </div>
          <button
            onClick={exportReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload />
            Exportar Relatório
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={filters.period}
                onChange={(e) => handleFilterChange('period', e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
                <option value="1y">Último ano</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="all">Todas as categorias</option>
                <option value="eletronicos">Eletrônicos</option>
                <option value="roupas">Roupas</option>
                <option value="casa">Casa e Decoração</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="animate-spin text-blue-600 text-2xl mr-2" />
            <span className="text-gray-600">Carregando dados...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchReportData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Charts Grid */}
        {!loading && !error && salesData && topProductsData && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Sales Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiTrendingUp className="text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Vendas por Período</h3>
                </div>
                <div className="h-64">
                  <Line data={salesData} options={chartOptions} />
                </div>
              </div>

              {/* Top Products Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiBarChart2 className="text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Produtos Mais Vendidos</h3>
                </div>
                <div className="h-64">
                  <Bar data={topProductsData} options={barOptions} />
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className={`text-sm ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange.toFixed(1)}% vs período anterior
                      </p>
                    </div>
                    <FiTrendingUp className="text-2xl text-blue-600" />
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pedidos Realizados</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                      <p className={`text-sm ${stats.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.ordersChange >= 0 ? '+' : ''}{stats.ordersChange.toFixed(1)}% vs período anterior
                      </p>
                    </div>
                    <FiBarChart2 className="text-2xl text-green-600" />
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                      <p className="text-2xl font-bold text-gray-900">
                        R$ {stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </p>
                      <p className="text-sm text-gray-500">Valor médio por pedido</p>
                    </div>
                    <FiTrendingUp className="text-2xl text-purple-600" />
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

export default RelatorioPage;
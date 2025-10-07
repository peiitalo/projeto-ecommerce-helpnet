import { useState, useEffect } from 'react';
import VendorLayout from '../../layouts/VendorLayout';
import { FiCalendar, FiFilter, FiDownload, FiTrendingUp, FiBarChart2 } from 'react-icons/fi';
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
  const [loading, setLoading] = useState(false);

  // Mock data for sales by period
  const salesData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Vendas (R$)',
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  // Mock data for top products
  const topProductsData = {
    labels: ['Produto A', 'Produto B', 'Produto C', 'Produto D', 'Produto E'],
    datasets: [
      {
        label: 'Vendas',
        data: [120, 98, 85, 72, 65],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
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

  const exportReport = () => {
    // Mock export functionality
    alert('Relatório exportado com sucesso!');
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas as categorias</option>
                <option value="eletronicos">Eletrônicos</option>
                <option value="roupas">Roupas</option>
                <option value="casa">Casa e Decoração</option>
              </select>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
                <p className="text-2xl font-bold text-gray-900">R$ 123.450</p>
                <p className="text-sm text-green-600">+12% vs período anterior</p>
              </div>
              <FiTrendingUp className="text-2xl text-blue-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pedidos Realizados</p>
                <p className="text-2xl font-bold text-gray-900">1.234</p>
                <p className="text-sm text-green-600">+8% vs período anterior</p>
              </div>
              <FiBarChart2 className="text-2xl text-green-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900">R$ 100,20</p>
                <p className="text-sm text-red-600">-2% vs período anterior</p>
              </div>
              <FiTrendingUp className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}

export default RelatorioPage;
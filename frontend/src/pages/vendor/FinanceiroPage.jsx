import { useState, useEffect } from 'react';
import VendorLayout from '../../layouts/VendorLayout';
import { FiDownload, FiTrendingUp, FiTrendingDown, FiDollarSign, FiCreditCard, FiAlertTriangle, FiCalendar } from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
import { vendedorService } from '../../services/api';
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

function FinanceiroPage() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [financeiroData, setFinanceiroData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch financial data
  useEffect(() => {
    const fetchFinanceiroData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await vendedorService.financeiro(period);
        setFinanceiroData(response.financeiro);
      } catch (err) {
        setError('Erro ao carregar dados financeiros');
        console.error('Erro ao buscar dados financeiros:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceiroData();
  }, [period]);

  // Prepare chart data
  const revenueData = financeiroData?.historicalData ? {
    labels: financeiroData.historicalData.map(item => {
      const date = new Date(item.period);
      return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: 'Receitas (R$)',
        data: financeiroData.historicalData.map(item => item.revenue),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Despesas (R$)',
        data: financeiroData.historicalData.map(item => item.expenses),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
    ],
  } : null;

  const expensesData = financeiroData?.expensesByCategory ? {
    labels: financeiroData.expensesByCategory.map(item => item.category),
    datasets: [
      {
        label: 'Despesas por Categoria (R$)',
        data: financeiroData.expensesByCategory.map(item => item.amount),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Receitas vs Despesas',
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
        text: 'Despesas por Categoria',
      },
    },
  };

  const exportToCSV = () => {
    if (!financeiroData?.historicalData) return;

    const csvContent = `Período,Receitas,Despesas,Lucro\n${
      financeiroData.historicalData.map(item =>
        `${item.period},${item.revenue},${item.expenses},${item.revenue - item.expenses}`
      ).join('\n')
    }`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-financeiro-${period}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <VendorLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </VendorLayout>
    );
  }

  if (error) {
    return (
      <VendorLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <FiAlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Erro ao carregar dados</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
            <p className="mt-2 text-gray-600">Análise das suas receitas e lucros</p>
          </div>
          <div className="flex gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="1y">Último ano</option>
            </select>
            <button
              onClick={exportToCSV}
              disabled={!financeiroData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiDownload />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Bruta</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(financeiroData?.receitaBruta || 0)}</p>
                <p className="text-sm text-gray-500">{financeiroData?.totalOrders || 0} pedidos</p>
              </div>
              <FiTrendingUp className="text-2xl text-green-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Comissões/Fees</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(financeiroData?.comissoes || 0)}</p>
                <p className="text-sm text-red-600">10% da receita</p>
              </div>
              <FiCreditCard className="text-2xl text-red-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lucro Líquido</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(financeiroData?.lucroLiquido || 0)}</p>
                <p className="text-sm text-gray-500">Após comissões</p>
              </div>
              <FiDollarSign className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        {/* Charts */}
        {revenueData && expensesData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiTrendingUp className="text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Receitas vs Despesas</h3>
              </div>
              <div className="h-64">
                <Line data={revenueData} options={chartOptions} />
              </div>
            </div>

            {/* Expenses Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiCreditCard className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Despesas por Categoria</h3>
              </div>
              <div className="h-64">
                <Bar data={expensesData} options={barOptions} />
              </div>
            </div>
          </div>
        )}

        {!financeiroData && !loading && !error && (
          <div className="text-center py-12">
            <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum dado financeiro encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">Não há dados para o período selecionado.</p>
          </div>
        )}

      </div>
    </VendorLayout>
  );
}

export default FinanceiroPage;
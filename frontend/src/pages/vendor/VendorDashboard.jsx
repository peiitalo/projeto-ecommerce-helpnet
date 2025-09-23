import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import VendorLayout from '../../components/VendorLayout.jsx';
import { produtoService } from '../../services/api';
import clienteVendedorApi from '../../services/clienteVendedorApi.js';
import apiCache from '../../utils/cache';
import {
  FaBox,
  FaTruck,
  FaCheck,
  FaClock,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaChartLine,
  FaDollarSign,
  FaUsers,
  FaSync
} from 'react-icons/fa';
import {
  FiPackage as FiPackageIcon
} from 'react-icons/fi';

function VendorDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  // Carregar estatísticas
  useEffect(() => {
    carregarEstatisticas();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      carregarEstatisticas(true); // silent refresh
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const refreshStats = async () => {
    setRefreshing(true);
    await carregarEstatisticas();
    setRefreshing(false);
  };

  const carregarEstatisticas = async (silent = false) => {
    const cacheKey = `vendor_stats_${user?.empresaId}`;

    // Check cache first (only for non-silent refreshes)
    if (!silent) {
      const cachedStats = apiCache.get(cacheKey);
      if (cachedStats) {
        setStats(cachedStats);
        setLoading(false);
        return;
      }
    }

    try {
      if (!silent) setLoading(true);

      if (!user?.empresaId) {
        console.warn('Empresa ID não encontrado para o usuário');
        setStats({
          totalProducts: 0,
          totalOrders: 0,
          totalCustomers: 0
        });
        return;
      }

      // Carregar produtos do vendedor
      const produtosResponse = await produtoService.listarVendedor(user.empresaId, { limit: 1 });
      const totalProducts = produtosResponse.total || 0;

      // Carregar estatísticas de pedidos e clientes do vendedor
      const statsResponse = await fetch(`${import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3001/api'}/vendedor/pedidos/stats`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const statsData = await statsResponse.json();

      if (statsData.success) {
        const newStats = {
          totalProducts,
          totalOrders: statsData.stats.totalOrders || 0,
          totalCustomers: statsData.stats.totalCustomers || 0
        };
        setStats(newStats);
        // Cache for 5 minutes
        apiCache.set(cacheKey, newStats, 5 * 60 * 1000);
      } else {
        throw new Error('Erro na resposta da API de estatísticas');
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Fallback para valores padrão
      setStats({
        totalProducts: 0,
        totalOrders: 0,
        totalCustomers: 0
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };


  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <VendorLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Painel do Vendedor</h1>
              <p className="text-slate-600">Bem-vindo, {user?.nome || 'Vendedor'}! Aqui você pode gerenciar seus produtos e pedidos.</p>
            </div>
            <button
              onClick={refreshStats}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FaSync className={`text-sm ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
            </button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Produtos</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiPackageIcon className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalOrders}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaBox className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Clientes</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalCustomers}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaUsers className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/vendedor/produtos/novo"
              className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <FiPackageIcon className="text-blue-600" />
              <div>
                <p className="font-medium text-slate-900">Adicionar Produto</p>
                <p className="text-sm text-slate-600">Crie um novo produto</p>
              </div>
            </Link>

            <Link
              to="/vendedor/produtos"
              className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <FaBox className="text-green-600" />
              <div>
                <p className="font-medium text-slate-900">Gerenciar Produtos</p>
                <p className="text-sm text-slate-600">Edite ou remova produtos</p>
              </div>
            </Link>

            <Link
              to="/vendedor/pedidos"
              className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <FaTruck className="text-orange-600" />
              <div>
                <p className="font-medium text-slate-900">Ver Pedidos</p>
                <p className="text-sm text-slate-600">Acompanhe seus pedidos</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}

export default VendorDashboard;
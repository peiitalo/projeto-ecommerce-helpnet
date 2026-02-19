import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { FaUser, FaShoppingCart, FaCog, FaSignOutAlt } from 'react-icons/fa';
import {
  FiPackage,
  FiCreditCard,
  FiHome,
  FiUsers,
  FiBox,
  FiTag,
  FiBarChart2,
  FiTruck,
  FiSettings,
  FiHelpCircle,
  FiMenu,
  FiX,
  FiBriefcase,
  FiPlus,
  FiStar
} from 'react-icons/fi';
import AdminLayout from '../../layouts/AdminLayout';

function Dashboard() {
  const [stats, setStats] = useState({
    totalPedidos: 0,
    totalClientes: 0,
    totalVendedores: 0,
    totalProdutos: 0,
    faturamentoTotal: 0,
    pedidosRecentes: [],
    produtosMaisVendidos: []
  });

  // Usuário admin mockado - em produção viriam do contexto/estado global
  const adminUser = {
    nome: "Administrador",
    email: "admin@helpnet.com",
    id: "ADM-0001"
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        // Carregar estatísticas reais do backend
        const response = await fetch('/api/admin/dashboard-stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminAccessToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && isMounted) {
            setStats(data.stats);
          }
        } else {
          console.error('Erro ao carregar estatísticas do dashboard');
        }
      } catch (e) {
        console.error('Erro ao carregar dados do dashboard:', e);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  // KPIs do painel administrativo com dados reais
  const kpis = [
    { titulo: "Receita", valor: `R$ ${stats.faturamentoTotal?.toFixed(2) || "0,00"}`, icone: <FiBarChart2 />, cor: "bg-blue-600" },
    { titulo: "Pedidos", valor: String(stats.totalPedidos || 0), icone: <FiPackage />, cor: "bg-blue-500" },
    { titulo: "Clientes", valor: String(stats.totalClientes || 0), icone: <FiUsers />, cor: "bg-blue-400" },
    { titulo: "Produtos", valor: String(stats.totalProdutos || 0), icone: <FiBox />, cor: "bg-blue-700" },
    { titulo: "Vendedores", valor: String(stats.totalVendedores || 0), icone: <FiBriefcase />, cor: "bg-green-600" },
    { titulo: "Avaliações", valor: String(stats.totalAvaliacoes || 0), icone: <FiStar />, cor: "bg-yellow-500" },
    { titulo: "Cupons", valor: String(stats.totalCupons || 0), icone: <FiTag />, cor: "bg-purple-600" },
    { titulo: "Entregas", valor: String(stats.totalEntregas || 0), icone: <FiTruck />, cor: "bg-orange-600" },
  ];

  const pedidosRecentes = stats.pedidosRecentes?.map(p => ({
    id: String(p.id),
    data: new Date(p.data).toLocaleDateString('pt-BR'),
    status: p.status,
    valor: `R$ ${p.total?.toFixed(2) || "0,00"}`
  })) || [];


  const getStatusColor = (status) => {
    switch (status) {
      case "Entregue": return "text-green-700 bg-green-100";
      case "Em trânsito": return "text-blue-700 bg-blue-100";
      case "Processando": return "text-yellow-700 bg-yellow-100";
      default: return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Boas-vindas / Introdução */}
          <section className="mb-8">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Bem-vindo ao HelpNet Admin</h2>
              <p className="text-slate-600 text-sm">Gerencie produtos, clientes, vendedores, pedidos e configurações da plataforma.</p>
            </div>
          </section>

          {/* KPIs */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`${kpi.cor} p-4 rounded-xl text-white`}>
                    <div className="text-3xl">{kpi.icone}</div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{kpi.valor}</p>
                    <p className="text-slate-600 text-sm mt-1">{kpi.titulo}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>


          <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Pedidos Recentes */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-base font-semibold text-slate-900">Pedidos recentes</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {pedidosRecentes.map((pedido) => (
                      <div key={pedido.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FiPackage className="text-blue-700" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">Pedido #{pedido.id}</p>
                            <p className="text-sm text-slate-500">{pedido.data}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{pedido.valor}</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.status)}`}>
                            {pedido.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <Link
                      to="/admin/pedidos"
                      className="text-blue-700 hover:text-blue-800 font-medium text-sm hover:underline"
                    >
                      Ver todos os pedidos →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações rápidas e informações da conta */}
            <div className="space-y-6">
              {/* Ações Rápidas */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-base font-semibold text-slate-900">Ações rápidas</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <Link
                      to="/admin/produtos/novo"
                      className="flex flex-col items-center text-center space-y-3 p-4 rounded-xl hover:bg-blue-50 transition-all duration-200 group border border-transparent hover:border-blue-200 hover:shadow-sm"
                    >
                      <FiPlus className="text-2xl text-slate-400 group-hover:text-blue-700" />
                      <span className="text-slate-700 group-hover:text-slate-900 font-medium">Adicionar Produto</span>
                    </Link>
                    <Link
                      to="/admin/clientes/novo"
                      className="flex flex-col items-center text-center space-y-3 p-4 rounded-xl hover:bg-blue-50 transition-all duration-200 group border border-transparent hover:border-blue-200 hover:shadow-sm"
                    >
                      <FaUser className="text-2xl text-slate-400 group-hover:text-blue-700" />
                      <span className="text-slate-700 group-hover:text-slate-900 font-medium">Adicionar Usuário</span>
                    </Link>
                    <Link
                      to="/admin/vendedores/novo"
                      className="flex flex-col items-center text-center space-y-3 p-4 rounded-xl hover:bg-blue-50 transition-all duration-200 group border border-transparent hover:border-blue-200 hover:shadow-sm"
                    >
                      <FiBriefcase className="text-2xl text-slate-400 group-hover:text-blue-700" />
                      <span className="text-slate-700 group-hover:text-slate-900 font-medium">Adicionar Vendedor</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Informações da Conta */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-base font-semibold text-slate-900">Minha conta</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Nome</p>
                      <p className="font-medium text-slate-900">{adminUser.nome}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">E-mail</p>
                      <p className="font-medium text-slate-900">{adminUser.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">ID do Administrador</p>
                      <p className="font-mono font-medium text-slate-900">{adminUser.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </AdminLayout>
  );
}

export default Dashboard;

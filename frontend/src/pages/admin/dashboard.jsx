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
  FiPlus
} from 'react-icons/fi';
import { produtoService } from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [productsTotal, setProductsTotal] = useState(null);
  const [productsActive, setProductsActive] = useState(null);
  const [productsNoStock, setProductsNoStock] = useState(null);

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
        const [all, active, noStock] = await Promise.all([
          produtoService.listar({ limit: 1 }),
          produtoService.listar({ status: 'ativo', limit: 1 }),
          produtoService.listar({ status: 'sem-estoque', limit: 1 }),
        ]);
        if (!isMounted) return;
        const getTotal = (resp) => resp?.total ?? (Array.isArray(resp) ? resp.length : (resp?.produtos?.length ?? 0));
        setProductsTotal(getTotal(all));
        setProductsActive(getTotal(active));
        setProductsNoStock(getTotal(noStock));
      } catch (e) {
        console.error('Erro ao carregar KPIs de produtos:', e);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  // KPIs do painel administrativo
  const kpis = [
    { titulo: "Receita", valor: "R$ 12.450", icone: <FiBarChart2 />, cor: "bg-blue-600" },
    { titulo: "Pedidos", valor: "126", icone: <FiPackage />, cor: "bg-blue-500" },
    { titulo: "Clientes", valor: "824", icone: <FiUsers />, cor: "bg-blue-400" },
    { titulo: "Produtos", valor: productsTotal !== null ? String(productsTotal) : "342", icone: <FiBox />, cor: "bg-blue-700" },
  ];

  const pedidosRecentes = [
    { id: "001", data: "2024-01-20", status: "Entregue", valor: "R$ 299,90" },
    { id: "002", data: "2024-01-15", status: "Em trânsito", valor: "R$ 159,90" },
    { id: "003", data: "2024-01-10", status: "Processando", valor: "R$ 89,90" },
  ];

  const menuAdministrativo = [
    { label: 'Visão Geral', to: '/admin', icon: <FiHome className="text-slate-500" /> },
    { label: 'Pedidos', to: '/admin/pedidos', icon: <FiPackage className="text-slate-500" /> },
    { label: 'Produtos', to: '/admin/produtos', icon: <FiBox className="text-slate-500" /> },
    { label: 'Categorias', to: '/admin/categorias', icon: <FiTag className="text-slate-500" /> },
    { label: 'Clientes', to: '/admin/clientes', icon: <FiUsers className="text-slate-500" /> },
    { label: 'Vendedores', to: '/admin/vendedores', icon: <FiBriefcase className="text-slate-500" /> },
    { label: 'Estoque', to: '/admin/estoque', icon: <FiBox className="text-slate-500" /> },
    { label: 'Cupons', to: '/admin/cupons', icon: <FiTag className="text-slate-500" /> },
    { label: 'Relatórios', to: '/admin/relatorios', icon: <FiBarChart2 className="text-slate-500" /> },
    { label: 'Entregas', to: '/admin/entregas', icon: <FiTruck className="text-slate-500" /> },
    { label: 'Financeiro', to: '/admin/financeiro', icon: <FiCreditCard className="text-slate-500" /> },
    { label: 'Configurações', to: '/admin/configuracoes', icon: <FiSettings className="text-slate-500" /> },
    { label: 'Suporte', to: '/admin/suporte', icon: <FiHelpCircle className="text-slate-500" /> },
  ];

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
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <div className="flex items-center">
                  <div className={`${kpi.cor} p-3 rounded-lg text-white mr-4`}>
                    {kpi.icone}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{kpi.valor}</p>
                    <p className="text-slate-600 text-sm">{kpi.titulo}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Métricas de Produtos (dados reais) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center">
                <div className="bg-blue-700 p-3 rounded-lg text-white mr-4">
                  <FiBox />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{productsTotal !== null ? productsTotal : '—'}</p>
                  <p className="text-slate-600 text-sm">Produtos (Total)</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center">
                <div className="bg-green-600 p-3 rounded-lg text-white mr-4">
                  <FiBox />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{productsActive !== null ? productsActive : '—'}</p>
                  <p className="text-slate-600 text-sm">Produtos Ativos</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center">
                <div className="bg-yellow-600 p-3 rounded-lg text-white mr-4">
                  <FiBox />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{productsNoStock !== null ? productsNoStock : '—'}</p>
                  <p className="text-slate-600 text-sm">Sem Estoque</p>
                </div>
              </div>
            </div>
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
                  <div className="space-y-3">
                    <Link
                      to="/admin/produtos/novo"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group border border-transparent hover:border-blue-200"
                    >
                      <FiPlus className="text-slate-400 group-hover:text-blue-700" />
                      <span className="text-slate-700 group-hover:text-slate-900">Adicionar Produto</span>
                    </Link>
                    <Link
                      to="/admin/clientes/novo"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group border border-transparent hover:border-blue-200"
                    >
                      <FaUser className="text-slate-400 group-hover:text-blue-700" />
                      <span className="text-slate-700 group-hover:text-slate-900">Adicionar Usuário</span>
                    </Link>
                    <Link
                      to="/admin/vendedores/novo"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group border border-transparent hover:border-blue-200"
                    >
                      <FiBriefcase className="text-slate-400 group-hover:text-blue-700" />
                      <span className="text-slate-700 group-hover:text-slate-900">Adicionar Vendedor</span>
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

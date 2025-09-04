import { useState } from 'react';
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

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Usuário admin mockado - em produção viriam do contexto/estado global
  const adminUser = {
    nome: "Administrador",
    email: "admin@helpnet.com",
    id: "ADM-0001"
  };

  // KPIs do painel administrativo
  const kpis = [
    { titulo: "Receita", valor: "R$ 12.450", icone: <FiBarChart2 />, cor: "bg-blue-600" },
    { titulo: "Pedidos", valor: "126", icone: <FiPackage />, cor: "bg-blue-500" },
    { titulo: "Clientes", valor: "824", icone: <FiUsers />, cor: "bg-blue-400" },
    { titulo: "Produtos", valor: "342", icone: <FiBox />, cor: "bg-blue-700" },
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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Mobile (Drawer) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold text-blue-700">HelpNet Admin</Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200"
            aria-label="Fechar menu"
          >
            <FiX />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Administração</p>
          {menuAdministrativo.map((item) => (
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
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-blue-200">
            <FaSignOutAlt />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </div>

      {/* Sidebar Desktop (sempre aberta) */}
      <aside className="hidden md:flex md:w-72 bg-white border-r border-slate-200 flex-col">
        <div className="h-16 px-6 border-b border-slate-200 flex items-center">
          <Link to="/" className="text-xl font-semibold text-blue-700">
            HelpNet Admin
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <p className="px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Administração</p>
          {menuAdministrativo.map((item) => (
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
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-blue-200">
            <FaSignOutAlt />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                {/* Botão para abrir sidebar no mobile */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200"
                  aria-label="Abrir menu"
                >
                  <FiMenu />
                </button>
                <h1 className="text-lg lg:text-xl font-semibold text-slate-900">Painel Administrativo</h1>
                <span className="hidden sm:inline text-slate-400">/</span>
                <span className="hidden sm:inline text-sm text-slate-500">Visão geral</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{adminUser.nome}</p>
                  <p className="text-xs text-slate-500">{adminUser.email}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-700">
                  <FaUser />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
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
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

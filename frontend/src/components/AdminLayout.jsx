import { useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
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
  FiBriefcase
} from 'react-icons/fi';

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Usuário admin mockado - em produção viriam do contexto/estado global
  const adminUser = {
    nome: "Administrador",
    email: "admin@helpnet.com",
    id: "ADM-0001"
  };

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

  const isActiveRoute = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors border ${
                isActiveRoute(item.to)
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700 border-transparent hover:border-blue-200'
              }`}
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors border ${
                isActiveRoute(item.to)
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700 border-transparent hover:border-blue-200'
              }`}
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

        {/* Conteúdo da página */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
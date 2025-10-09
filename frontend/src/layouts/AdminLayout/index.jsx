import { useState } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
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
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Usuário admin mockado - em produção viriam do contexto/estado global
  // Usuário do contexto (MVP: ainda mantém fallback visual)
  let adminUser = {
    nome: "Usuário",
    email: "usuario@helpnet.com",
    id: "ID-0001"
  };
  try {
    const raw = localStorage.getItem('auth:user');
    if (raw) {
      const u = JSON.parse(raw);
      adminUser = {
        nome: u?.nome || adminUser.nome,
        email: u?.email || adminUser.email,
        id: u?.id || adminUser.id,
      };
    }
  } catch (_e) {}

  const isVendor = location.pathname.startsWith('/vendedor');
  const basePath = isVendor ? '/vendedor' : '/admin';
  const brandName = isVendor ? 'HelpNet Vendedor' : 'HelpNet Admin';

  const vendorMenu = [
    { label: 'Visão Geral', to: `${basePath}`, icon: <FiHome className="text-slate-500" /> },
    { label: 'Pedidos', to: `${basePath}/pedidos`, icon: <FiPackage className="text-slate-500" /> },
    { label: 'Produtos', to: `${basePath}/produtos`, icon: <FiBox className="text-slate-500" /> },
    { label: 'Clientes', to: `${basePath}/clientes`, icon: <FiUsers className="text-slate-500" /> },
    { label: 'Vendedores', to: `${basePath}/vendedores`, icon: <FiBriefcase className="text-slate-500" /> },
    { label: 'Estoque', to: `${basePath}/estoque`, icon: <FiBox className="text-slate-500" /> },
    { label: 'Cupons', to: `${basePath}/cupons`, icon: <FiTag className="text-slate-500" /> },
    { label: 'Relatórios', to: `${basePath}/relatorios`, icon: <FiBarChart2 className="text-slate-500" /> },
    { label: 'Entregas', to: `${basePath}/entregas`, icon: <FiTruck className="text-slate-500" /> },
    { label: 'Financeiro', to: `${basePath}/financeiro`, icon: <FiCreditCard className="text-slate-500" /> },
    { label: 'Configurações', to: `${basePath}/configuracoes`, icon: <FiSettings className="text-slate-500" /> },
    { label: 'Suporte', to: `${basePath}/suporte`, icon: <FiHelpCircle className="text-slate-500" /> },
  ];

  // Admin agora foca em controles macro (empresas, usuários, faturamento)
  const adminMenu = [
    { label: 'Visão Geral', to: `${basePath}`, icon: <FiHome className="text-slate-500" /> },
    { label: 'Pedidos', to: `${basePath}/pedidos`, icon: <FiPackage className="text-slate-500" /> },
    { label: 'Empresas', to: `${basePath}/empresas`, icon: <FiBriefcase className="text-slate-500" /> },
    { label: 'Usuários', to: `${basePath}/usuarios`, icon: <FiUsers className="text-slate-500" /> },
    { label: 'Relatórios', to: `${basePath}/relatorios`, icon: <FiBarChart2 className="text-slate-500" /> },
    { label: 'Financeiro', to: `${basePath}/financeiro`, icon: <FiCreditCard className="text-slate-500" /> },
    { label: 'Configurações', to: `${basePath}/configuracoes`, icon: <FiSettings className="text-slate-500" /> },
    { label: 'Suporte', to: `${basePath}/suporte`, icon: <FiHelpCircle className="text-slate-500" /> },
  ];

  const menuAdministrativo = isVendor ? vendorMenu : adminMenu;

  const isActiveRoute = (path) => {
    const base = basePath; // '/admin' ou '/vendedor'
    if (path === base) {
      return location.pathname === base;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair da conta?')) {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        // Mesmo com erro, redireciona para login
        navigate('/login');
      }
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
           <img
             src="/logo-vertical.png"
             alt="HelpNet Logo"
             className="h-12 w-auto"
           />
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
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
          >
            <FaSignOutAlt />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </div>

      {/* Sidebar Desktop (sempre aberta) */}
      <aside className="hidden md:flex md:w-72 bg-white border-r border-slate-200 flex-col">
        <div className="h-16 px-6 border-b border-slate-200 flex items-center">
          <img
            src="/logo-vertical.png"
            alt="HelpNet Logo"
            className="h-12 w-auto"
          />
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
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
          >
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
                <h1 className="text-lg lg:text-xl font-semibold text-slate-900">{isVendor ? 'Painel do Vendedor' : 'Painel Administrativo'}</h1>
              </div>
              <div className="flex items-center gap-4">
                {isVendor ? (
                  // Para vendedores: apenas ícone de perfil clicável
                  <button
                    onClick={() => navigate(`${basePath}/perfil`)}
                    className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 hover:bg-blue-100 transition-colors"
                    title="Ver perfil"
                  >
                    <FaUser />
                  </button>
                ) : (
                  // Para admins: nome e ícone
                  <>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{adminUser.nome}</p>
                      <p className="text-xs text-slate-500">{adminUser.email}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-700">
                      <FaUser />
                    </div>
                  </>
                )}
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

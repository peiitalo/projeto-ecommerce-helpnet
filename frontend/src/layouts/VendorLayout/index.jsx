import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import { FiSearch, FiMenu, FiX, FiPackage, FiTag, FiHelpCircle, FiSettings, FiClock as FiClockIcon, FiHome, FiUsers, FiBarChart2, FiBriefcase, FiCreditCard, FiBox, FiTruck } from 'react-icons/fi';

function VendorLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  const logoConfig = {
    useImage: true,
    imageUrl: '/logo-vertical.png',
    altText: 'HelpNet Logo',
    textLogo: 'HelpNet'
  };

  const vendedorMenu = [
    { label: 'Visão Geral', to: '/vendedor', icon: <FiHome className="text-slate-500" /> },
    { label: 'Pedidos', to: '/vendedor/pedidos', icon: <FiPackage className="text-slate-500" /> },
    { label: 'Produtos', to: '/vendedor/produtos', icon: <FiBox className="text-slate-500" /> },
    { label: 'Categorias', to: '/vendedor/categorias', icon: <FiTag className="text-slate-500" /> },
    { label: 'Entregas', to: '/vendedor/entregas', icon: <FiTruck className="text-slate-500" /> },
    { label: 'Clientes', to: '/vendedor/clientes', icon: <FiUsers className="text-slate-500" /> },
    { label: 'Vendedores', to: '/vendedor/vendedores', icon: <FiBriefcase className="text-slate-500" /> },
    { label: 'Cupons', to: '/vendedor/cupons', icon: <FiTag className="text-slate-500" /> },
    { label: 'Relatórios', to: '/vendedor/relatorios', icon: <FiBarChart2 className="text-slate-500" /> },
    { label: 'Financeiro', to: '/vendedor/financeiro', icon: <FiCreditCard className="text-slate-500" /> },
    { label: 'Configurações', to: '/vendedor/configuracoes', icon: <FiSettings className="text-slate-500" /> },
    { label: 'Suporte', to: '/vendedor/suporte', icon: <FiHelpCircle className="text-slate-500" /> },
  ];

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair da conta?')) {
      logout();
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center">
            {logoConfig.useImage ? (<img src={logoConfig.imageUrl} alt={logoConfig.altText} className="h-8 w-auto" />) : (<span className="text-lg font-semibold text-blue-700">{logoConfig.textLogo}</span>)}
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200" aria-label="Fechar menu">
            <FiX />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-hidden">
          <p className="px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Navegação</p>
          {vendedorMenu.map((item) => (
            <Link key={item.label} to={item.to} onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-colors">
              <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200">
            <FaSignOutAlt />
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>
      </div>

      <aside className="hidden md:flex md:w-72 bg-white border-r border-slate-200 flex-col fixed h-screen">
        <div className="h-16 px-6 border-b border-slate-200 flex items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            {logoConfig.useImage ? (<img src={logoConfig.imageUrl} alt={logoConfig.altText} className="h-8 w-auto" />) : (<span className="text-xl font-semibold text-blue-700">{logoConfig.textLogo}</span>)}
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-hidden">
          <p className="px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Navegação</p>
          {vendedorMenu.map((item) => (
            <Link key={item.label} to={item.to} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-colors">
              <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200">
            <FaSignOutAlt />
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:ml-72">
        <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 h-16">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200" aria-label="Abrir menu">
                <FiMenu />
              </button>
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <img src="/logo-horizontal.png" alt="HelpNet Logo" className="h-6 w-auto" />
              </div>
              <div className="md:hidden flex-1 text-center">
                <img src="/logo-horizontal.png" alt="HelpNet Logo" className="h-6 w-auto mx-auto" />
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Link to="/vendedor/perfil" className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">
                  <FaUser />
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-slate-50">{children}</main>

        <footer className="bg-slate-900 text-slate-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm">© {new Date().getFullYear()} HelpNet. Todos os direitos reservados.</p>
              <div className="flex items-center gap-5 text-sm">
                <Link to="/termos" className="hover:text-white">Termos</Link>
                <Link to="/privacidade" className="hover:text-white">Privacidade</Link>
                <Link to="/contato" className="hover:text-white">Contato</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default VendorLayout;

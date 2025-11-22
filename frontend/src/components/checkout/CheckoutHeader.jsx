import { Link } from 'react-router-dom';
import { FaShoppingCart, FaUser } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';

function CheckoutHeader({ sidebarOpen, setSidebarOpen, count }) {
  return (
    <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200"
              aria-label="Abrir menu"
            >
              <FiMenu />
            </button>
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <img
                src="/logo-horizontal.png"
                alt="HelpNet Logo"
                className="h-6 w-auto"
              />
            </div>
            <div className="md:hidden shrink-0">
              <img
                src="/logo-horizontal.png"
                alt="HelpNet Logo"
                className="h-6 w-auto"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/carrinho" className="relative p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50">
              <FaShoppingCart />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                  {count}
                </span>
              )}
            </Link>
            <Link to="/perfil" className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">
              <FaUser />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default CheckoutHeader;
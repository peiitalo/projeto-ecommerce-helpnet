import { Link } from "react-router-dom";
import { FiHome, FiArrowLeft } from 'react-icons/fi';

function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="text-center animate-fade-in">
        {/* Número 404 grande */}
        <div className="mb-8">
          <h1 className="text-9xl md:text-[12rem] font-bold text-slate-200 leading-none">
            404
          </h1>
        </div>

        {/* Mensagem principal */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Página não encontrada
          </h2>
          <p className="text-slate-600 text-lg max-w-md mx-auto">
            Ops! A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        {/* Ilustração simples */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-sky-100 rounded-full flex items-center justify-center">
            <div className="text-6xl">🔍</div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            <FiHome />
            Ir para Home
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 hover:bg-slate-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <FiArrowLeft />
            Voltar
          </button>
        </div>

        {/* Links úteis */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-slate-500 mb-4">Ou tente uma dessas páginas:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link 
              to="/login" 
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              Login
            </Link>
            <Link 
              to="/cadastro" 
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              Cadastro
            </Link>
            <Link 
              to="/explorer"
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              Produtos
            </Link>
            <Link 
              to="/contato" 
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              Contato
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
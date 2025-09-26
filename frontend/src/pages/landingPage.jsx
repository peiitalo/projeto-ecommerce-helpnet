import { Link } from "react-router-dom";
import { FaShoppingCart, FaUser, FaBuilding, FaShieldAlt, FaTruck, FaHeadset } from 'react-icons/fa';
import { FiArrowRight, FiStar } from 'react-icons/fi';

function LandingPage() {
  const recursos = [
    {
      icone: <FaShieldAlt />,
      titulo: "Compra Segura",
      descricao: "Seus dados protegidos com criptografia de ponta"
    },
    {
      icone: <FaTruck />,
      titulo: "Entrega Rápida",
      descricao: "Receba seus produtos no conforto da sua casa"
    },
    {
      icone: <FaHeadset />,
      titulo: "Suporte 24/7",
      descricao: "Atendimento especializado quando você precisar"
    }
  ];

  const depoimentos = [
    {
      nome: "Maria Silva",
      tipo: "Pessoa Física",
      comentario: "Excelente plataforma! Fácil de usar e entrega super rápida.",
      estrelas: 5
    },
    {
      nome: "João Empresas Ltda",
      tipo: "Pessoa Jurídica", 
      comentario: "Perfeito para compras corporativas. Recomendo!",
      estrelas: 5
    },
    {
      nome: "Ana Costa",
      tipo: "Pessoa Física",
      comentario: "Atendimento excepcional e produtos de qualidade.",
      estrelas: 5
    }
  ];

  const renderEstrelas = (quantidade) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar 
        key={i} 
        className={`w-4 h-4 ${i < quantidade ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                E-commerce
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link 
                to="/login"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors text-sm sm:text-base"
              >
                Entrar
              </Link>
              <Link 
                to="/cadastro"
                className="bg-gradient-to-r from-blue-600 to-sky-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm sm:text-base"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-sky-50 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 mb-4 sm:mb-6">
              Sua loja online
              <span className="block bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                completa
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              Encontre tudo o que você precisa em um só lugar. 
              Cadastre-se como pessoa física ou jurídica e aproveite nossas ofertas exclusivas.
            </p>
            
            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-4">
              <Link 
                to="/cadastro"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm sm:text-base"
              >
                <FaShoppingCart />
                Começar a Comprar
                <FiArrowRight />
              </Link>
              
              <Link 
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-slate-700 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-slate-200 text-sm sm:text-base"
              >
                Já tenho conta
                <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Por que escolher nossa plataforma?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Oferecemos a melhor experiência de compra online com segurança e praticidade
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recursos.map((recurso, index) => (
              <div key={index} className="text-center p-8 rounded-xl hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-6">
                  {recurso.icone}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">{recurso.titulo}</h3>
                <p className="text-slate-600">{recurso.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-slate-600">
              Depoimentos reais de quem já usa nossa plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {depoimentos.map((depoimento, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  {renderEstrelas(depoimento.estrelas)}
                </div>
                <p className="text-slate-600 mb-4 italic">
                  "{depoimento.comentario}"
                </p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-slate-800">{depoimento.nome}</p>
                  <p className="text-sm text-slate-500">{depoimento.tipo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-sky-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Crie sua conta agora e tenha acesso a milhares de produtos
          </p>
          <Link 
            to="/cadastro"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            Criar Conta Grátis
            <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">E-commerce</h3>
              <p className="text-slate-300">
                Sua loja online completa para pessoa física e jurídica.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-slate-300">
                <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link to="/cadastro" className="hover:text-white transition-colors">Cadastro</Link></li>
                <li><Link to="/explorer" className="hover:text-white transition-colors">Produtos</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-slate-300">
                <li><Link to="/contato" className="hover:text-white transition-colors">Contato</Link></li>
                <li><Link to="/ajuda" className="hover:text-white transition-colors">Ajuda</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <div className="text-slate-300 space-y-2">
                <p>📧 contato@ecommerce.com</p>
                <p>📞 (11) 9999-9999</p>
                <p>📍 São Paulo, SP</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-300">
            <p>&copy; 2024 E-commerce. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
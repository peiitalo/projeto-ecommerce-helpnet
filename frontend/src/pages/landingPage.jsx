import { Link } from "react-router-dom";
import { FaShoppingCart, FaUser, FaBuilding, FaShieldAlt, FaTruck, FaHeadset, FaStar, FaCreditCard, FaGlobe, FaAward, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { FiArrowRight, FiStar } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { publicService } from '../services/api';

function LandingPage() {
  const [stats, setStats] = useState({
    totalProdutos: 0,
    totalClientes: 0,
    totalVendedores: 0,
    totalPedidos: 0
  });
  const [depoimentos, setDepoimentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, testimonialsResponse] = await Promise.all([
          publicService.obterStats(),
          publicService.obterDepoimentos()
        ]);

        if (statsResponse.success) {
          setStats(statsResponse.stats);
        }

        if (testimonialsResponse.success) {
          setDepoimentos(testimonialsResponse.depoimentos);
        }
      } catch (error) {
        console.error('Erro ao carregar dados da landing page:', error);
        // Fallback para dados estáticos se a API falhar
        setDepoimentos([
          {
            nome: "Maria Silva",
            tipo: "Cliente Verificado",
            comentario: "Excelente plataforma! Fácil de usar e entrega super rápida.",
            estrelas: 5
          },
          {
            nome: "João Empresas Ltda",
            tipo: "Cliente Empresarial",
            comentario: "Perfeito para compras corporativas. Recomendo!",
            estrelas: 5
          },
          {
            nome: "Ana Costa",
            tipo: "Cliente Verificado",
            comentario: "Atendimento excepcional e produtos de qualidade.",
            estrelas: 5
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          <div className="flex justify-center items-center h-16 sm:h-20">
            <div className="flex items-center">
              <img
                src="/logo-vertical.png"
                alt="HelpNet Logo"
                className="h-12 sm:h-16 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-sky-50 py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-sky-100/20 animate-pulse"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-4 sm:mb-6">
              Bem-vindo ao HelpNet
              <span className="block bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                Sua Plataforma Completa
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              Conectando compradores e vendedores em um ecossistema seguro e eficiente.
              Cadastre-se como pessoa física ou jurídica e descubra milhares de produtos com entrega rápida.
            </p>

            {/* Benefícios rápidos */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 sm:mb-12 text-sm sm:text-base text-slate-600">
              <div className="flex items-center gap-2">
                <FaShieldAlt className="text-blue-500" />
                <span>Compra 100% Segura</span>
              </div>
              <div className="flex items-center gap-2">
                <FaTruck className="text-blue-500" />
                <span>Entrega Expressa</span>
              </div>
              <div className="flex items-center gap-2">
                <FaHeadset className="text-blue-500" />
                <span>Suporte 24/7</span>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-4">
              <Link
                to="/cadastro"
                className="inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-base sm:text-lg transform hover:-translate-y-1"
              >
                <FaShoppingCart />
                Começar a Comprar
                <FiArrowRight />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-slate-700 font-medium rounded-lg hover:text-slate-900 transition-all duration-300 text-sm sm:text-base border border-slate-300 hover:border-slate-400"
              >
                Já tenho conta
                <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-sky-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">Números que Impressionam</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-white transform hover:scale-110 transition-transform duration-300">
              <div className="text-4xl md:text-5xl font-bold mb-2">{stats.totalProdutos.toLocaleString()}+</div>
              <p className="text-blue-100">Produtos Disponíveis</p>
            </div>
            <div className="text-white transform hover:scale-110 transition-transform duration-300">
              <div className="text-4xl md:text-5xl font-bold mb-2">{stats.totalClientes.toLocaleString()}+</div>
              <p className="text-blue-100">Clientes Satisfeitos</p>
            </div>
            <div className="text-white transform hover:scale-110 transition-transform duration-300">
              <div className="text-4xl md:text-5xl font-bold mb-2">{stats.totalVendedores.toLocaleString()}+</div>
              <p className="text-blue-100">Vendedores Parceiros</p>
            </div>
            <div className="text-white transform hover:scale-110 transition-transform duration-300">
              <div className="text-4xl md:text-5xl font-bold mb-2">{stats.totalPedidos.toLocaleString()}+</div>
              <p className="text-blue-100">Pedidos Realizados</p>
            </div>
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
              <div key={index} className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-blue-500 relative">
                <div className="absolute top-4 right-4 text-blue-500 text-4xl opacity-20">
                  "
                </div>
                <div className="flex items-center mb-6">
                  {renderEstrelas(depoimento.estrelas)}
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed text-lg">
                  {depoimento.comentario}
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {depoimento.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{depoimento.nome}</p>
                    <p className="text-sm text-slate-500">{depoimento.tipo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="lg:col-span-1">
              <img
                src="/logo-vertical.png"
                alt="HelpNet Logo"
                className="h-16 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-slate-300 leading-relaxed">
                Conectando compradores e vendedores em um ecossistema seguro e eficiente.
                Sua plataforma completa para compras online.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-lg">Plataforma</h4>
              <ul className="space-y-3 text-slate-300">
                <li><Link to="/explore" className="hover:text-white transition-colors">Explorar Produtos</Link></li>
                <li><Link to="/cadastro" className="hover:text-white transition-colors">Criar Conta</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Fazer Login</Link></li>
                <li><Link to="/vendedores" className="hover:text-white transition-colors">Para Vendedores</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-lg">Suporte & Ajuda</h4>
              <ul className="space-y-3 text-slate-300">
                <li><Link to="/ajuda" className="hover:text-white transition-colors">Central de Ajuda</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">Perguntas Frequentes</Link></li>
                <li><Link to="/contato" className="hover:text-white transition-colors">Fale Conosco</Link></li>
                <li><Link to="/rastreamento" className="hover:text-white transition-colors">Rastrear Pedido</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-lg">Contato</h4>
              <div className="text-slate-300 space-y-3">
                <p className="flex items-center gap-2">
                  <FaEnvelope />
                  contato@helpnet.com.br
                </p>
                <p className="flex items-center gap-2">
                  <FaPhone />
                  (11) 4000-1234
                </p>
                <p className="flex items-center gap-2">
                  <FaPhone />
                  WhatsApp: (11) 99999-1234
                </p>
                <p className="flex items-start gap-2">
                  <FaMapMarkerAlt />
                  <span>Rua das Inovações, 123<br />Centro Empresarial<br />São Paulo, SP - 01234-567</span>
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-400 text-sm">
                &copy; 2024 HelpNet. Todos os direitos reservados.
              </p>
              <div className="flex space-x-6 text-sm text-slate-400">
                <Link to="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
                <Link to="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
                <Link to="/cookies" className="hover:text-white transition-colors">Política de Cookies</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
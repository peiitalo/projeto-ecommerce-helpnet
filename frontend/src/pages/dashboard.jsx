import { Link } from "react-router-dom";
import { FaUser, FaShoppingCart, FaHeart, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { FiPackage, FiCreditCard, FiMapPin } from 'react-icons/fi';

function Dashboard() {
  // Dados mockados - em produção viriam do contexto/estado global
  const cliente = {
    nome: "João Silva",
    email: "joao@email.com",
    codigoCliente: "100001"
  };

  const estatisticas = [
    { titulo: "Pedidos", valor: "12", icone: <FiPackage />, cor: "bg-blue-500" },
    { titulo: "Favoritos", valor: "8", icone: <FaHeart />, cor: "bg-red-500" },
    { titulo: "Cartões", valor: "2", icone: <FiCreditCard />, cor: "bg-green-500" },
    { titulo: "Endereços", valor: "3", icone: <FiMapPin />, cor: "bg-purple-500" },
  ];

  const pedidosRecentes = [
    { id: "001", data: "2024-01-20", status: "Entregue", valor: "R$ 299,90" },
    { id: "002", data: "2024-01-15", status: "Em trânsito", valor: "R$ 159,90" },
    { id: "003", data: "2024-01-10", status: "Processando", valor: "R$ 89,90" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Entregue": return "text-green-600 bg-green-100";
      case "Em trânsito": return "text-blue-600 bg-blue-100";
      case "Processando": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-slate-800">E-commerce</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{cliente.nome}</p>
                <p className="text-xs text-slate-500">#{cliente.codigoCliente}</p>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Boas-vindas */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Olá, {cliente.nome.split(' ')[0]}! 👋
          </h2>
          <p className="text-slate-600">
            Bem-vindo ao seu painel. Aqui você pode gerenciar seus pedidos e informações.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {estatisticas.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center">
                <div className={`${stat.cor} p-3 rounded-lg text-white mr-4`}>
                  {stat.icone}
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stat.valor}</p>
                  <p className="text-slate-600 text-sm">{stat.titulo}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pedidos Recentes */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">Pedidos Recentes</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {pedidosRecentes.map((pedido) => (
                    <div key={pedido.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FiPackage className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">Pedido #{pedido.id}</p>
                          <p className="text-sm text-slate-500">{pedido.data}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-800">{pedido.valor}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.status)}`}>
                          {pedido.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link 
                    to="/pedidos" 
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
                  >
                    Ver todos os pedidos →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Lateral */}
          <div className="space-y-6">
            {/* Ações Rápidas */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">Ações Rápidas</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <Link 
                    to="/produtos" 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <FaShoppingCart className="text-slate-400 group-hover:text-blue-600" />
                    <span className="text-slate-700 group-hover:text-slate-900">Continuar Comprando</span>
                  </Link>
                  <Link 
                    to="/perfil" 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <FaUser className="text-slate-400 group-hover:text-blue-600" />
                    <span className="text-slate-700 group-hover:text-slate-900">Meu Perfil</span>
                  </Link>
                  <Link 
                    to="/configuracoes" 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <FaCog className="text-slate-400 group-hover:text-blue-600" />
                    <span className="text-slate-700 group-hover:text-slate-900">Configurações</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Informações da Conta */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">Minha Conta</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Nome</p>
                    <p className="font-medium text-slate-800">{cliente.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium text-slate-800">{cliente.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Código do Cliente</p>
                    <p className="font-mono font-medium text-slate-800">#{cliente.codigoCliente}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
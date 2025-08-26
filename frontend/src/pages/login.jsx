import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUser, FaBuilding } from 'react-icons/fa';
import { FiArrowRight, FiLoader, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';

// Componente para a tela de sucesso do login
const TelaLoginSucesso = ({ dadosCliente }) => (
  <div className="w-full min-h-screen flex flex-col items-center justify-center text-center p-6 bg-slate-50 animate-fade-in">
    <FiCheckCircle className="text-7xl text-green-500 mb-6" />
    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-800">
      Bem-vindo de volta!
    </h2>
    <p className="text-slate-500 mb-8 max-w-md">Login realizado com sucesso. Redirecionando para o painel...</p>
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
      <p className="text-slate-500 text-sm uppercase">Logado como</p>
      <p className="text-2xl font-bold text-blue-600 my-2">
        {dadosCliente.nome}
      </p>
      <p className="text-slate-500 text-sm">
        {dadosCliente.email}
      </p>
    </div>
  </div>
);

function Login() {
  const navigate = useNavigate();
  const [dadosLogin, setDadosLogin] = useState({
    email: "",
    senha: ""
  });

  const [erros, setErros] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loginSucesso, setLoginSucesso] = useState(null);

  const lidarComAlteracao = (e) => {
    const { name, value } = e.target;
    setDadosLogin(prev => ({ ...prev, [name]: value }));
    // Limpar erros quando o usuário começar a digitar
    if (erros.length > 0) {
      setErros([]);
    }
  };

  const enviarLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErros([]);

    // Validações básicas no frontend
    const errosValidacao = [];
    if (!dadosLogin.email.trim()) {
      errosValidacao.push('Email é obrigatório');
    }
    if (!dadosLogin.senha.trim()) {
      errosValidacao.push('Senha é obrigatória');
    }

    if (errosValidacao.length > 0) {
      setErros(errosValidacao);
      setCarregando(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/clientes/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: dadosLogin.email,
          senha: dadosLogin.senha
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.join('\n') || 'Erro ao fazer login');
      }

      // Login bem-sucedido
      setLoginSucesso(data.data);
      
      // Simular redirecionamento após 2 segundos
      setTimeout(() => {
        // Aqui você pode redirecionar para o dashboard/painel
        navigate('/dashboard'); // ou a rota que você quiser
      }, 2000);

    } catch (error) {
      setErros(Array.isArray(error.message.split('\n')) 
        ? error.message.split('\n') 
        : [error.message]);
    } finally {
      setCarregando(false);
    }
  };

  // Se login foi bem-sucedido, mostrar tela de sucesso
  if (loginSucesso) {
    return <TelaLoginSucesso dadosCliente={loginSucesso} />;
  }

  // --- Estilos (reutilizando do cadastro) ---
  const classeGrupoInput = "relative mb-6";
  const classeInput = "w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300";
  const classeIconeInput = "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400";
  const classeBotao = "px-6 py-3 rounded-lg font-semibold text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center gap-2";
  const classeBotaoPrimario = `${classeBotao} bg-gradient-to-r from-blue-600 to-sky-500`;

  return (
    <main className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Sidebar com informações */}
        <aside className="w-full md:w-1/3 lg:w-1/4 p-6 md:p-8 bg-gradient-to-br from-blue-600 to-sky-500 text-white border-b md:border-b-0">
          <div className="md:sticky md:top-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Fazer Login</h1>
            <p className="text-blue-100 mb-8 hidden md:block">Acesse sua conta para continuar suas compras.</p>
            
            {/* Ícones decorativos */}
            <div className="hidden md:flex flex-col space-y-6 mt-12">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <FaUser className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Pessoa Física</h3>
                  <p className="text-blue-100 text-sm">Acesso para clientes individuais</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <FaBuilding className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Pessoa Jurídica</h3>
                  <p className="text-blue-100 text-sm">Acesso para empresas</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Formulário de login */}
        <div className="w-full p-6 md:p-16 flex flex-col justify-center bg-slate-50">
          <div className="w-full max-w-md mx-auto">
            <form onSubmit={enviarLogin} className="animate-fade-in">
              <h2 className="text-3xl font-bold mb-8 text-slate-800">Entre na sua conta</h2>
              
              {/* Campo Email */}
              <div className={classeGrupoInput}>
                <FaEnvelope className={classeIconeInput} />
                <input 
                  className={classeInput}
                  type="email" 
                  name="email" 
                  placeholder="Seu e-mail" 
                  value={dadosLogin.email} 
                  onChange={lidarComAlteracao}
                  required
                />
              </div>

              {/* Campo Senha */}
              <div className={`${classeGrupoInput} relative`}>
                <FaLock className={classeIconeInput} />
                <input 
                  className={`${classeInput} pr-12`}
                  type={mostrarSenha ? "text" : "password"} 
                  name="senha" 
                  placeholder="Sua senha" 
                  value={dadosLogin.senha} 
                  onChange={lidarComAlteracao}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setMostrarSenha(!mostrarSenha)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 z-10"
                >
                  {mostrarSenha ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {/* Link "Esqueci minha senha" */}
              <div className="mb-6 text-right">
                <Link 
                  to="/esqueci-senha" 
                  className="text-blue-600 hover:underline text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded"
                >
                  Esqueci minha senha
                </Link>
              </div>

              {/* Exibição de erros */}
              {erros.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-red-800 font-semibold mb-2">Erro no login:</h4>
                  <ul className="text-red-700 text-sm space-y-1">
                    {erros.map((erro, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{erro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Botão de login */}
              <button 
                type="submit" 
                className={`${classeBotaoPrimario} w-full mb-6`}
                disabled={carregando}
              >
                {carregando ? <FiLoader className="animate-spin" /> : <FiArrowRight />}
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>

              {/* Link para cadastro */}
              <div className="text-center">
                <p className="text-slate-500">
                  Não tem uma conta?{' '}
                  <Link 
                    to="/cadastro" 
                    className="font-semibold text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded"
                  >
                    Criar conta
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login;
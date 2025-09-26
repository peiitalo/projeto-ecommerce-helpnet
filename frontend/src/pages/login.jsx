import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUser, FaBuilding } from "react-icons/fa";
import {
  FiArrowRight,
  FiLoader,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
} from "react-icons/fi";
import { clienteService } from "../services/api";
import { useAuth } from "../context/AuthContext";

// Componente para a tela de sucesso do login
const TelaLoginSucesso = ({ dadosCliente }) => (
  <div className="w-full min-h-screen flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-slate-50 animate-fade-in">
    <FiCheckCircle className="text-6xl sm:text-7xl text-green-500 mb-6" />
    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-slate-800">
      Bem-vindo de volta!
    </h2>
    <p className="text-slate-500 mb-8 max-w-md text-sm sm:text-base">
      Login realizado com sucesso. Redirecionando para o painel...
    </p>
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200 w-full max-w-sm">
      <p className="text-slate-500 text-xs sm:text-sm uppercase">Logado como</p>
      <p className="text-xl sm:text-2xl font-bold text-blue-600 my-2 break-words">
        {dadosCliente.nome}
      </p>
      <p className="text-slate-500 text-xs sm:text-sm break-all">
        {dadosCliente.email}
      </p>
    </div>
  </div>
);

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [dadosLogin, setDadosLogin] = useState({
    email: "",
    senha: "",
  });

  const [erros, setErros] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loginSucesso, setLoginSucesso] = useState(null);
  const [showAutoLogin, setShowAutoLogin] = useState(false);
  const [savedUser, setSavedUser] = useState(null);

  // Logo configuration
  const logoConfig = {
    useImage: true,
    imageUrl: '/logo-horizontal.png',
    altText: 'HelpNet Logo',
    textLogo: 'HelpNet'
  };

  // Check for saved user on mount
  useEffect(() => {
    try {
      const user = localStorage.getItem('auth:user');
      if (user) {
        const parsedUser = JSON.parse(user);
        setSavedUser(parsedUser);
        setShowAutoLogin(true);
      }
    } catch (error) {
      console.error('Erro ao verificar usuário salvo:', error);
    }
  }, []);

  const lidarComAlteracao = (e) => {
    const { name, value } = e.target;
    setDadosLogin((prev) => ({ ...prev, [name]: value }));
    if (erros.length > 0) {
      setErros([]);
    }
  };

  const handleAutoLogin = async () => {
    try {
      setCarregando(true);
      const data = await clienteService.autoLogin();
      setLoginSucesso(data.data);

      const userData = {
        id: data?.data?.id,
        nome: data?.data?.nome,
        email: data?.data?.email,
        role: data?.data?.role || 'cliente',
        empresaId: data?.data?.empresaId || null,
        vendedorId: data?.data?.vendedorId || null,
        token: data?.token || data?.data?.token || null,
      };

      login(userData);

      setTimeout(() => {
        if (userData.role === 'admin') return navigate('/admin');
        if (userData.role === 'vendedor') return navigate('/vendedor');
        return navigate('/home');
      }, 800);
    } catch (error) {
      console.error('Erro no auto-login:', error);
      setShowAutoLogin(false);
      setSavedUser(null);
    } finally {
      setCarregando(false);
    }
  };

  const handleCancelAutoLogin = () => {
    setShowAutoLogin(false);
    setSavedUser(null);
    // Clear saved user
    localStorage.removeItem('auth:user');
  };

  const enviarLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErros([]);

    const errosValidacao = [];
    if (!dadosLogin.email.trim()) {
      errosValidacao.push("Email é obrigatório");
    }
    if (!dadosLogin.senha.trim()) {
      errosValidacao.push("Senha é obrigatória");
    }

    if (errosValidacao.length > 0) {
      console.error("⚠️ [Login] Erros de validação:", errosValidacao);
      setErros(errosValidacao);
      setCarregando(false);
      return;
    }

    try {
      console.log("📡 [Login] Enviando requisição via clienteService.login");
      const data = await clienteService.login(dadosLogin.email, dadosLogin.senha);
      console.log("✅ [Login] Login bem-sucedido:", data);
      setLoginSucesso(data.data);

      // Definir dados do usuário
      const userData = {
        id: data?.data?.id,
        nome: data?.data?.nome,
        email: data?.data?.email,
        role: data?.data?.role || 'cliente',
        empresaId: data?.data?.empresaId || null,
        vendedorId: data?.data?.vendedorId || null,
        token: data?.token || data?.data?.token || null,
      };

      // Atualizar contexto de autenticação
      login(userData);

      setTimeout(() => {
        // redirecionar por role
        if (userData.role === 'admin') return navigate('/admin');
        if (userData.role === 'vendedor') return navigate('/vendedor');
        return navigate('/home');
      }, 800);
    } catch (error) {
      console.error("🔥 [Login] Erro inesperado:", {
        message: error.message,
        stack: error.stack,
      });

      setErros(
        Array.isArray(error.message.split("\n"))
          ? error.message.split("\n")
          : [error.message]
      );
    } finally {
      setCarregando(false);
    }
  };

  if (loginSucesso) {
    return <TelaLoginSucesso dadosCliente={loginSucesso} />;
  }

  // Auto-login modal
  if (showAutoLogin && savedUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaUser className="text-blue-600 text-2xl" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Detectamos uma conta
            </h1>

            <p className="text-slate-600 mb-6">
              Deseja fazer login com a conta <strong>{savedUser.nome}</strong> ({savedUser.email})?
            </p>

            <div className="space-y-3">
              <button
                onClick={handleAutoLogin}
                disabled={carregando}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {carregando ? 'Entrando...' : 'Confirmar'}
              </button>

              <button
                onClick={handleCancelAutoLogin}
                className="w-full text-slate-600 hover:text-slate-700 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const classeGrupoInput = "relative mb-6";
  const classeInput =
    "w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300";
  const classeIconeInput =
    "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400";
  const classeBotao =
    "px-6 py-3 rounded-lg font-semibold text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center gap-2";
  const classeBotaoPrimario = `${classeBotao} bg-gradient-to-r from-blue-600 to-sky-500`;

  return (
    <main className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Sidebar com informações */}
        <aside className="w-full md:w-1/3 lg:w-1/4 p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-600 to-sky-500 text-white border-b md:border-b-0">
          <div className="md:sticky md:top-8">
            <div className="mb-4">
              {logoConfig.useImage ? (
                <img
                  src={logoConfig.imageUrl}
                  alt={logoConfig.altText}
                  className="h-12 w-auto mx-auto"
                />
              ) : (
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-sky-500 bg-clip-text text-transparent">
                  {logoConfig.textLogo}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              Fazer Login
            </h1>
            <p className="text-blue-100 mb-6 md:mb-8 text-sm sm:text-base hidden md:block">
              Acesse sua conta para continuar suas compras.
            </p>

            {/* Ícones decorativos - Mobile */}
            <div className="flex md:hidden justify-center space-x-8 mb-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-2">
                  <FaUser className="text-white text-sm" />
                </div>
                <p className="text-blue-100 text-xs text-center">
                  Pessoa
                  <br />
                  Física
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-2">
                  <FaBuilding className="text-white text-sm" />
                </div>
                <p className="text-blue-100 text-xs text-center">
                  Pessoa
                  <br />
                  Jurídica
                </p>
              </div>
            </div>

            {/* Ícones decorativos - Desktop */}
            <div className="hidden md:flex flex-col space-y-6 mt-12">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <FaUser className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Pessoa Física</h3>
                  <p className="text-blue-100 text-sm">
                    Acesso para clientes individuais
                  </p>
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
        <div className="w-full p-4 sm:p-6 md:p-16 flex flex-col justify-center bg-slate-50">
          <div className="w-full max-w-md mx-auto">
            <form onSubmit={enviarLogin} className="animate-fade-in">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-slate-800">
                Entre na sua conta
              </h2>

              {/* Campo Email */}
              <div className={classeGrupoInput}>
                <FaEnvelope className={classeIconeInput} />
                <input
                  className={classeInput}
                  type="text"
                  name="email"
                  placeholder="E-mail, CPF/CNPJ ou telefone"
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
                  <h4 className="text-red-800 font-semibold mb-2">
                    Erro no login:
                  </h4>
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
                {carregando ? (
                  <FiLoader className="animate-spin" />
                ) : (
                  <FiArrowRight />
                )}
                {carregando ? "Entrando..." : "Entrar"}
              </button>

              {/* Link para cadastro */}
              <div className="text-center">
                <p className="text-slate-500">
                  Não tem uma conta?{" "}
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

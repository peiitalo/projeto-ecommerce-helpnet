import { FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LoginRegisterModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  const handleRegister = () => {
    onClose();
    navigate('/cadastro');
  };

  const handleContinueBrowsing = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-slate-800">
            Acesso necessário
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100"
          >
            <FaTimes className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-slate-600 text-center text-sm leading-relaxed">
            Você ainda não está logado. Para adicionar ao carrinho, comprar agora ou deixar avaliações, é necessário fazer login.
          </p>

          <p className="text-slate-500 text-center text-xs">
            Deseja fazer login agora ou continuar navegando nas partes que não precisam de login?
          </p>

          <div className="space-y-2">
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Fazer Login
            </button>

            <button
              onClick={handleRegister}
              className="w-full bg-white text-blue-600 border border-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Criar Conta
            </button>

            <button
              onClick={handleContinueBrowsing}
              className="w-full bg-slate-100 text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
            >
              Continuar Navegando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRegisterModal;
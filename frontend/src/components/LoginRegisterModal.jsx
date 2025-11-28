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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-slate-800">
            Acesse sua conta
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100"
          >
            <FaTimes className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-slate-600 text-center text-sm mb-4 whitespace-nowrap">
            Aproveite o sistema completo e faça suas compras online!
          </p>

          <button
            onClick={handleLogin}
            className="w-full bg-white text-blue-600 border border-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            Fazer Login
          </button>

          <button
            onClick={handleRegister}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Criar Conta
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRegisterModal;
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { clienteService } from '../services/api';
import { validatePassword } from '../utils/validations';
import {
  FaEnvelope,
  FaArrowLeft,
  FaCheck,
  FaExclamationTriangle,
  FaKey
} from 'react-icons/fa';

function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: email, 2: token and password
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Logo configuration
  const logoConfig = {
    useImage: false,
    imageUrl: '/logo.png',
    altText: 'HelpNet Logo',
    textLogo: 'HelpNet'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!email || !email.trim()) {
        setError('Por favor, digite seu email');
        return;
      }

      if (!email.includes('@')) {
        setError('Por favor, digite um email válido');
        return;
      }

      try {
        setLoading(true);
        await clienteService.solicitarResetSenha(email);
        setStep(2);
      } catch (error) {
        console.error('Erro ao solicitar reset:', error);
        setError(error.errors?.join(', ') || error.message || 'Erro ao enviar solicitação. Tente novamente.');
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (!token || !token.trim()) {
         setError('Por favor, digite o token');
         return;
       }

       if (!newPassword || !newPassword.trim()) {
         setError('Senha é obrigatória');
         return;
       }

       const { isValid, errors } = validatePassword(newPassword);
       if (!isValid) {
         setError(errors.join('\n'));
         return;
       }

      if (newPassword !== confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }

      try {
        setLoading(true);
        await clienteService.resetarSenha(token, newPassword);
        setSubmitted(true);
      } catch (error) {
        console.error('Erro ao resetar senha:', error);
        setError(error.errors?.join(', ') || error.message || 'Erro ao redefinir senha. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheck className="text-green-600 text-2xl" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Senha Redefinida!
            </h1>

            <p className="text-slate-600 mb-6">
              Sua senha foi redefinida com sucesso. Você pode agora fazer login com sua nova senha.
            </p>

            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Fazer Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-sky-500 bg-clip-text text-transparent">
              {logoConfig.textLogo}
            </span>
          </Link>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {step === 1 ? (
                <FaEnvelope className="text-blue-600 text-2xl" />
              ) : (
                <FaKey className="text-blue-600 text-2xl" />
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {step === 1 ? 'Esqueceu sua senha?' : 'Redefinir Senha'}
            </h1>

            <p className="text-slate-600">
              {step === 1
                ? 'Digite seu email para receber instruções de redefinição.'
                : 'Digite o token enviado e sua nova senha.'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Token de Reset
                  </label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Digite o token recebido"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres, maiúscula, minúscula, número e especial"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite novamente"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <FaExclamationTriangle />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{step === 1 ? 'Enviando...' : 'Redefinindo...'}</span>
                </div>
              ) : (
                step === 1 ? 'Enviar Token' : 'Redefinir Senha'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-700 font-medium mb-4"
              >
                <FaArrowLeft />
                <span>Voltar</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-600">
            Lembrou sua senha?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
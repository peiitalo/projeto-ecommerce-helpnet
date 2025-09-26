import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { clienteService, apiRequest } from '../../services/api.js';

export default function PaymentSimulator() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('approved');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSimulate = async () => {
    setLoading(true);
    setError('');
    try {
      await apiRequest(`/pagamentos/sandbox/simular/${id}`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      // Após simular, levar o usuário para seus pedidos
      navigate('/meus-pedidos');
    } catch (e) {
      setError(e.message || 'Falha ao simular pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900 mb-4">Simulador de Pagamento</h1>
        <p className="text-slate-600 text-sm mb-4">Pedido #{id}</p>

        <label className="block text-sm font-medium text-slate-700 mb-2">Status do Pagamento</label>
        <select
          className="w-full px-3 py-2 border rounded-lg mb-4"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="approved">Aprovado</option>
          <option value="pending">Pendente</option>
          <option value="rejected">Rejeitado</option>
        </select>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          onClick={handleSimulate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Simular Pagamento'}
        </button>

        <Link to="/meus-pedidos" className="block text-center text-blue-600 mt-4">Voltar para Meus Pedidos</Link>
      </div>
    </div>
  );
}

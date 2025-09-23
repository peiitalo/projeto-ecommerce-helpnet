import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../../services/api.js';

export default function PaymentCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resumo, setResumo] = useState(null);
  const [metodoSelecionado, setMetodoSelecionado] = useState(null);
  const [valorPagamento, setValorPagamento] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });

  const carregarResumo = async () => {
    const data = await apiRequest(`/pagamentos/${id}/resumo`);
    setResumo(data.resumo);
    // Selecionar automaticamente o primeiro método com restante > 0
    const m = data.resumo.metodos.find(m => m.restante > 0) || data.resumo.metodos[0];
    setMetodoSelecionado(m?.metodoId || null);
    setValorPagamento(m ? String(m.restante.toFixed(2)) : '');
  };

  useEffect(() => { carregarResumo(); }, [id]);

  const handlePay = async () => {
    setProcessing(true); setError('');
    try {
      if (!metodoSelecionado) throw new Error('Selecione um método');
      const valor = parseFloat(valorPagamento);
      if (!valor || valor <= 0) throw new Error('Informe um valor válido');

      // Validações simuladas para cartão (apenas UI)
      const metodo = resumo.metodos.find(m => m.metodoId === metodoSelecionado);
      if (metodo?.metodo?.toLowerCase().includes('cartão') && (!card.number || !card.name || !card.expiry || !card.cvv)) {
        throw new Error('Preencha os dados do cartão');
      }

      const resp = await apiRequest(`/pagamentos/${id}/registrar`, {
        method: 'POST',
        body: JSON.stringify({ metodoId: metodoSelecionado, valor })
      });
      setResumo(resp.resumo);
      // Ajusta seleção para próximo restante
      const prox = resp.resumo.metodos.find(m => m.restante > 0);
      setMetodoSelecionado(prox?.metodoId || null);
      setValorPagamento(prox ? String(prox.restante.toFixed(2)) : '');

      // Redirecionar quando pago
      if (resp.resumo.statusPagamento === 'PAGO') {
        navigate('/meus-pedidos');
      }
    } catch (e) {
      setError(e.message || 'Falha ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  if (!resumo) return (
    <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>
  );

  const formatBRL = (v) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Pagamento do Pedido #{resumo.pedidoId}</h1>
        <p className="text-slate-600 text-sm mb-6">
          Status: {resumo.statusPagamento} • Total pago: {formatBRL(resumo.totalPago)} • Restante: {formatBRL(resumo.totalRestante)}
        </p>
        {resumo.expiraEm && (
          <p className="text-xs text-slate-500 mb-4">Prazo para pagamento: {new Date(resumo.expiraEm).toLocaleString('pt-BR')}</p>
        )}

        {/* Seleção de métodos (apenas os escolhidos no checkout) */}
        <div className="space-y-3">
          {resumo.metodos.map((m) => (
            <label key={m.metodoId} className={`flex items-center justify-between p-3 border rounded-lg ${m.restante <= 0 ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2">
                <input type="radio" name="metodo" value={m.metodoId} checked={metodoSelecionado===m.metodoId} onChange={()=>{setMetodoSelecionado(m.metodoId); setValorPagamento(String(Math.max(0, m.restante).toFixed(2)));}} disabled={m.restante<=0 || resumo.statusPagamento==='PAGO' || resumo.statusPagamento==='EXPIRADO'} />
                <div>
                  <div className="font-medium text-slate-900">{m.metodo}</div>
                  <div className="text-xs text-slate-600">Alocado: {formatBRL(m.alocado)} • Pago: {formatBRL(m.pago)} • Restante: {formatBRL(m.restante)}</div>
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Inputs condicionais para cartão */}
        {(() => {
          const metodo = resumo.metodos.find(m => m.metodoId === metodoSelecionado);
          if (metodo?.metodo?.toLowerCase().includes('cartão')) {
            return (
              <div className="mt-4 space-y-3">
                <input className="w-full border rounded-lg px-3 py-2" placeholder="Número do Cartão" value={card.number} onChange={e=>setCard({...card, number:e.target.value})} />
                <input className="w-full border rounded-lg px-3 py-2" placeholder="Nome impresso" value={card.name} onChange={e=>setCard({...card, name:e.target.value})} />
                <div className="flex gap-3">
                  <input className="flex-1 border rounded-lg px-3 py-2" placeholder="Validade (MM/AA)" value={card.expiry} onChange={e=>setCard({...card, expiry:e.target.value})} />
                  <input className="flex-1 border rounded-lg px-3 py-2" placeholder="CVV" value={card.cvv} onChange={e=>setCard({...card, cvv:e.target.value})} />
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Valor do pagamento parcial */}
        <div className="mt-4">
          <label className="block text-sm text-slate-700 mb-1">Valor a pagar agora</label>
          <input type="number" step="0.01" min="0" value={valorPagamento} onChange={e=>setValorPagamento(e.target.value)} className="w-full border rounded-lg px-3 py-2" disabled={!metodoSelecionado || resumo.statusPagamento==='PAGO' || resumo.statusPagamento==='EXPIRADO'} />
          <p className="text-xs text-slate-500 mt-1">Você pode pagar parcialmente. O sistema registrará o valor pago.</p>
          {resumo.statusPagamento==='EXPIRADO' && <p className="text-xs text-red-600 mt-1">Pedido expirado. Não é possível prosseguir.</p>}
        </div>

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button onClick={handlePay} disabled={processing || !metodoSelecionado || resumo.statusPagamento==='PAGO' || resumo.statusPagamento==='EXPIRADO'} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {processing ? 'Processando...' : 'Pagar agora'}
          </button>
          <Link to="/meus-pedidos" className="flex-1 text-center border border-slate-200 py-2 rounded-lg hover:bg-slate-50">Ver Meus Pedidos</Link>
        </div>

        {/* Histórico de pagamentos */}
        <div className="mt-8">
          <h2 className="font-semibold text-slate-900 mb-2">Histórico de Pagamentos</h2>
          {resumo.historico.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhum pagamento registrado ainda.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {resumo.historico.map(h => (
                <div key={h.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{h.metodo}</div>
                    <div className="text-xs text-slate-600">{new Date(h.data).toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-700">+ {formatBRL(h.valor)}</div>
                    <div className="text-xs text-slate-600">{h.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

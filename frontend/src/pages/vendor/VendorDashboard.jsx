import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBox, FiPackage, FiTruck, FiPlus, FiTrendingUp, FiDollarSign, FiFilter } from 'react-icons/fi';
import { produtoService, categoriaService } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';

function VendorDashboard() {
  // Escopo vendedor por empresa
  const [empresaId] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('auth:user') || 'null');
      return u?.empresaId || 1;
    } catch { return 1; }
  });

  // Filtros e período
  const [period, setPeriod] = useState('12m'); // '7d' | '30d' | '12m'
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  // Dados reais (quando disponíveis)
  const [totalProdutos, setTotalProdutos] = useState(null);

  // Carregar categorias para o filtro
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await categoriaService.listar();
        if (!mounted) return;
        const lista = Array.isArray(resp) ? resp : (resp?.categorias || []);
        setCategories(lista);
      } catch (e) {
        console.error('Erro carregando categorias:', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Carregar KPI de produtos (real), respeitando categoria
  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const filtros = { limit: 1 };
        if (category !== 'all') filtros.categoria = category;
        const resp = await produtoService.listarVendedor(empresaId, filtros);
        setTotalProdutos(resp?.total ?? (resp?.produtos?.length ?? 0));
      } catch (e) {
        console.error('Erro carregando KPIs vendedor:', e);
      }
    };
    fetchKpis();
  }, [empresaId, category]);

  // ===== MOCKS para visualização =====
  const labels = useMemo(() => {
    const now = new Date();
    if (period === '7d') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      });
    }
    if (period === '30d') {
      return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (29 - i));
        return d.toLocaleDateString('pt-BR', { day: '2-digit' });
      });
    }
    // 12m
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    });
  }, [period]);

  // Gerador simples de série com tendência e ruído
  const genSeries = (len, base = 5000, spread = 3000) => {
    const arr = [];
    for (let i = 0; i < len; i++) {
      const t = i / Math.max(1, len - 1);
      const trend = base * (0.7 + 0.6 * t); // leve tendência de alta
      const rnd = (Math.sin(i * 1.7) + 1) / 2; // pseudo aleatório determinístico
      const val = Math.max(0, Math.round(trend + (rnd - 0.5) * spread));
      arr.push(val);
    }
    return arr;
  };

  const receitaData = useMemo(() => {
    const len = labels.length;
    const vals = genSeries(len, period === '12m' ? 6000 : 4000, period === '12m' ? 4000 : 2500);
    return labels.map((label, i) => ({ label, value: vals[i] }));
  }, [labels, period]);

  const pedidosData = useMemo(() => {
    const len = labels.length;
    const vals = genSeries(len, period === '12m' ? 50 : 25, period === '12m' ? 40 : 20)
      .map(v => Math.max(0, Math.round(v / (period === '12m' ? 120 : 80))));
    return labels.map((label, i) => ({ label, value: vals[i] }));
  }, [labels, period]);

  // KPIs calculados a partir das séries mockadas
  const faturamentoAtual = receitaData.at(-1)?.value ?? 0;
  const pedidosAtuais = pedidosData.at(-1)?.value ?? 0;
  const ticketMedio = pedidosAtuais > 0 ? (faturamentoAtual / pedidosAtuais) : 0;

  // Top produtos (mock) com leve variação conforme categoria
  const topProdutos = useMemo(() => {
    const prefix = category === 'all' ? '' : `[${category}] `;
    return [
      { nome: prefix + 'Cabo HDMI 2.1', valor: 1800 },
      { nome: prefix + 'Roteador DualBand', valor: 1450 },
      { nome: prefix + 'Mouse Gamer', valor: 1270 },
      { nome: prefix + 'Teclado Mecânico', valor: 960 },
      { nome: prefix + 'Headset USB', valor: 820 },
    ];
  }, [category]);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título e ação */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-slate-900">Painel do Vendedor</h1>
          <Link
            to="/vendedor/produtos/novo"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus /> Novo Produto
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <FiFilter className="text-slate-500" />
              <span className="text-sm font-medium">Filtros</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="12m">Últimos 12 meses</option>
              </select>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm min-w-[200px]"
              >
                <option value="all">Todas as categorias</option>
                {categories.map((c) => (
                  <option key={c.CategoriaID ?? c.id ?? c.nome} value={c.Nome ?? c.nome}>
                    {c.Nome ?? c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* KPIs principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center">
              <div className="bg-blue-600 p-3 rounded-lg text-white mr-4"><FiBox /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalProdutos ?? '—'}</p>
                <p className="text-slate-600 text-sm">Produtos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center">
              <div className="bg-green-600 p-3 rounded-lg text-white mr-4"><FiPackage /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pedidosAtuais}</p>
                <p className="text-slate-600 text-sm">Pedidos ({period})</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center">
              <div className="bg-emerald-600 p-3 rounded-lg text-white mr-4"><FiDollarSign /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{`R$ ${faturamentoAtual.toLocaleString('pt-BR')}`}</p>
                <p className="text-slate-600 text-sm">Faturamento ({period})</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center">
              <div className="bg-yellow-600 p-3 rounded-lg text-white mr-4"><FiTrendingUp /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{`R$ ${ticketMedio.toFixed(2).toLocaleString('pt-BR')}`}</p>
                <p className="text-slate-600 text-sm">Ticket médio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Receita ({period === '12m' ? 'últimos 12 meses' : period === '30d' ? 'últimos 30 dias' : 'últimos 7 dias'})</h3>
            </div>
            <div className="p-6">
              <LineChart data={receitaData} height={220} />
              {labels.length <= 12 && (
                <div className="mt-3 text-sm text-slate-500 flex gap-4 flex-wrap">
                  {receitaData.map((m, i) => (
                    <span key={i}>{m.label}: R$ {m.value.toLocaleString('pt-BR')}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Pedidos ({period})</h3>
            </div>
            <div className="p-6">
              <BarChart data={pedidosData} height={220} />
            </div>
          </div>
        </div>

        {/* Top produtos (mock) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Top produtos por faturamento</h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {topProdutos.map((p, idx) => (
                  <li key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-sm">{idx + 1}</div>
                      <span className="font-medium text-slate-800">{p.nome}</span>
                    </div>
                    <span className="text-slate-700">R$ {p.valor.toLocaleString('pt-BR')}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Ações rápidas</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <Link to="/vendedor/produtos" className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Gerenciar Produtos</Link>
              <Link to="/vendedor/pedidos" className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Pedidos</Link>
              <Link to="/vendedor/entregas" className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Entregas</Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default VendorDashboard;
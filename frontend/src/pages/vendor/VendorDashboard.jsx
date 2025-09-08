import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBox, FiPackage, FiTruck, FiPlus } from 'react-icons/fi';
import { produtoService } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

function VendorDashboard() {
  const [empresaId] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('auth:user') || 'null');
      return u?.empresaId || 1;
    } catch { return 1; }
  }); // escopo vendedor por empresa
  const [totalProdutos, setTotalProdutos] = useState(null);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const resp = await produtoService.listarVendedor(empresaId, { limit: 1 });
        setTotalProdutos(resp?.total ?? (resp?.produtos?.length ?? 0));
      } catch (e) {
        console.error('Erro carregando KPIs vendedor:', e);
      }
    };
    fetchKpis();
  }, [empresaId]);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Ações no topo */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-slate-900">Painel do Vendedor</h1>
          <Link
            to="/vendedor/produtos/novo"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus /> Novo Produto
          </Link>
        </div>

        {/* KPIs simples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <p className="text-2xl font-bold text-slate-900">—</p>
                <p className="text-slate-600 text-sm">Pedidos (decorativo)</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center">
              <div className="bg-yellow-600 p-3 rounded-lg text-white mr-4"><FiTruck /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">—</p>
                <p className="text-slate-600 text-sm">Entregas (decorativo)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Ações rápidas</h2>
          <div className="flex items-center gap-3">
            <Link to="/vendedor/produtos" className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Gerenciar Produtos</Link>
            <Link to="/vendedor/pedidos" className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Pedidos</Link>
            <Link to="/vendedor/entregas" className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Entregas</Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default VendorDashboard;
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landingPage';
import Login from './pages/login';
import Cadastro from './pages/cadastro';
import Dashboard from './pages/admin/dashboard';
import NotFound from './pages/errors/notFound';
import Home from './pages/clients/home';
import ProductPage from './pages/clients/ProductPage';
import ProductsManagement from './pages/admin/ProductsManagement';
import ProductForm from './pages/admin/ProductForm';
import VendorDashboard from './pages/vendor/VendorDashboard';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Público */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/produto/:id" element={<ProductPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Cliente autenticado */}
        <Route element={<ProtectedRoute allowedRoles={["cliente"]} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* demais rotas do cliente */}
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/produtos" element={<ProductsManagement />} />
          <Route path="/admin/produtos/novo" element={<ProductForm />} />
          <Route path="/admin/produtos/:id/editar" element={<ProductForm />} />
        </Route>

        {/* Vendedor */}
        <Route element={<ProtectedRoute allowedRoles={["vendedor"]} />}>
          <Route path="/vendedor" element={<VendorDashboard />} />
          <Route path="/vendedor/produtos" element={<ProductsManagement />} />
          <Route path="/vendedor/produtos/novo" element={<ProductForm />} />
          <Route path="/vendedor/produtos/:id/editar" element={<ProductForm />} />
        </Route>

        {/* Demais páginas placeholder */}
        <Route path="/produtos" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Produtos - Em desenvolvimento</h1></div>} />
        <Route path="/perfil" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Perfil - Em desenvolvimento</h1></div>} />
        <Route path="/pedidos" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Pedidos - Em desenvolvimento</h1></div>} />
        <Route path="/configuracoes" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Configurações - Em desenvolvimento</h1></div>} />
        <Route path="/contato" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Contato - Em desenvolvimento</h1></div>} />
        <Route path="/ajuda" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Ajuda - Em desenvolvimento</h1></div>} />
        <Route path="/faq" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">FAQ - Em desenvolvimento</h1></div>} />
        <Route path="/esqueci-senha" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Esqueci Senha - Em desenvolvimento</h1></div>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;

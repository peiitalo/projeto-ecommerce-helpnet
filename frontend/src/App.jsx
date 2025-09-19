import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';

const LandingPage = lazy(() => import('./pages/landingPage'));
const Login = lazy(() => import('./pages/login'));
const Cadastro = lazy(() => import('./pages/cadastro'));
const Dashboard = lazy(() => import('./pages/admin/dashboard'));
const NotFound = lazy(() => import('./pages/errors/notFound'));
const Home = lazy(() => import('./pages/clients/Home'));
const ProductPage = lazy(() => import('./pages/clients/ProductPage'));
const CartPage = lazy(() => import('./pages/clients/CartPage'));
const FavoritesPage = lazy(() => import('./pages/clients/FavoritesPage'));
const NotificationsPage = lazy(() => import('./pages/clients/NotificationsPage'));
const ProductsManagement = lazy(() => import('./pages/vendor/ProductsManagement'));
const ProductForm = lazy(() => import('./pages/vendor/ProductForm'));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>}>
        <Routes>
          {/* Público */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/carrinho" element={<CartPage />} />
          <Route path="/produto/:id" element={<ProductPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          {/* Cliente autenticado */}
          <Route element={<ProtectedRoute allowedRoles={["cliente", "vendedor"]} />}>
            <Route path="/favoritos" element={<FavoritesPage />} />
            <Route path="/notificacoes" element={<NotificationsPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* demais rotas do cliente */}
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<Dashboard />} />
          </Route>

          {/* Vendedor */}
          <Route element={<ProtectedRoute allowedRoles={["vendedor", "juridico"]} />}>
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
      </Suspense>
    </Router>
  );
}

export default App;

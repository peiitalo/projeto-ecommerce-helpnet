import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import LoadingSkeleton from './components/LoadingSkeleton';
import { NotificationProvider } from './context/NotificationContext';
import NotificationContainer from './components/NotificationContainer';

const LandingPage = lazy(() => import('./pages/landingPage'));
const Login = lazy(() => import('./pages/login'));
const Cadastro = lazy(() => import('./pages/cadastro'));
const Dashboard = lazy(() => import('./pages/admin/dashboard'));
const NotFound = lazy(() => import('./pages/errors/notFound'));
const Home = lazy(() => import('./pages/clients/home'));
const ProductPage = lazy(() => import('./pages/clients/ProductPage'));
const CartPage = lazy(() => import('./pages/clients/CartPage'));
const FavoritesPage = lazy(() => import('./pages/clients/FavoritesPage'));
const NotificationsPage = lazy(() => import('./pages/clients/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/clients/ProfilePage'));
const ExplorePage = lazy(() => import('./pages/clients/ExplorePage'));
const CheckoutPage = lazy(() => import('./pages/clients/CheckoutPage'));
const AddressPage = lazy(() => import('./pages/clients/AddressPage'));
const OrdersPage = lazy(() => import('./pages/clients/OrdersPage'));
const HistoryPage = lazy(() => import('./pages/clients/HistoryPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const PaymentSimulator = lazy(() => import('./pages/clients/PaymentSimulator'));
const PaymentCheckout = lazy(() => import('./pages/clients/PaymentCheckout'));
const ProductsManagement = lazy(() => import('./pages/vendor/ProductsManagement'));
const ProductForm = lazy(() => import('./pages/vendor/ProductForm'));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorOrdersPage = lazy(() => import('./pages/vendor/VendorOrdersPage'));
const VendorClientsPage = lazy(() => import('./pages/vendor/VendorClientsPage'));
const VendorProfilePage = lazy(() => import('./pages/vendor/VendorProfilePage'));
const VendorDeliveriesPage = lazy(() => import('./pages/vendor/VendorDeliveriesPage'));
const VendorDeliveryDetailPage = lazy(() => import('./pages/vendor/VendorDeliveryDetailPage'));
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Suspense fallback={<LoadingSkeleton type="page" message="Carregando página..." />}>
          <Routes>
          {/* Público */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/carrinho" element={<CartPage />} />
          <Route path="/produto/:id" element={<ProductPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />

          {/* Cliente autenticado */}
          <Route element={<ProtectedRoute allowedRoles={["cliente", "vendedor"]} />}>
            <Route path="/favoritos" element={<FavoritesPage />} />
            <Route path="/notificacoes" element={<NotificationsPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/explorer/:category?" element={<ExplorePage />} />
            <Route path="/enderecos" element={<AddressPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/meus-pedidos" element={<OrdersPage />} />
            <Route path="/historico" element={<HistoryPage />} />
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
            <Route path="/vendedor/perfil" element={<VendorProfilePage />} />
            <Route path="/vendedor/produtos" element={<ProductsManagement />} />
            <Route path="/vendedor/produtos/novo" element={<ProductForm />} />
            <Route path="/vendedor/produtos/:id/editar" element={<ProductForm />} />
            <Route path="/vendedor/pedidos" element={<VendorOrdersPage />} />
            <Route path="/vendedor/clientes" element={<VendorClientsPage />} />
            <Route path="/vendedor/entregas" element={<VendorDeliveriesPage />} />
            <Route path="/vendedor/entregas/:pedidoId" element={<VendorDeliveryDetailPage />} />
          </Route>

          {/* Demais páginas placeholder */}
          <Route path="/pedidos" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Pedidos - Em desenvolvimento</h1></div>} />
          {/* Fluxo de pagamento simulado realista */}
          <Route path="/checkout/pagamento/:id" element={<PaymentCheckout />} />
          {/* Simulador de Pagamento (dev/sandbox) */}
          <Route path="/pedido/simulado/:id" element={<PaymentSimulator />} />
          <Route path="/configuracoes" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Configurações - Em desenvolvimento</h1></div>} />
          <Route path="/contato" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Contato - Em desenvolvimento</h1></div>} />
          <Route path="/ajuda" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Ajuda - Em desenvolvimento</h1></div>} />
          <Route path="/faq" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">FAQ - Em desenvolvimento</h1></div>} />
          <Route path="/esqueci-senha" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Esqueci Senha - Em desenvolvimento</h1></div>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        <NotificationContainer />
      </Router>
    </NotificationProvider>
  );
}

export default App;

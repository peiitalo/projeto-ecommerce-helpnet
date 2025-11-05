import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Uso:
// <Route element={<ProtectedRoute allowedRoles={["admin"]} />}> ... </Route>
// Se allowedRoles não for passado, exige apenas estar autenticado
export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  console.log('[ProtectedRoute] Estado atual:', {
    user: user ? { id: user.id, role: user.role, nome: user.nome } : null,
    loading,
    allowedRoles,
    currentPath: window.location.pathname
  });

  if (loading) {
    console.log('[ProtectedRoute] Ainda carregando...');
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    console.log('[ProtectedRoute] Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    console.log('[ProtectedRoute] Verificando roles permitidas:', allowedRoles, 'Role do usuário:', user.role);
    if (!allowedRoles.includes(user.role)) {
      console.log('[ProtectedRoute] Role não permitida, redirecionando baseado na role:', user.role);
      // Redirecionar por função
      if (user.role === 'vendedor' || user.role === 'juridico') return <Navigate to="/vendedor" replace />;
      if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
      return <Navigate to="/home" replace />;
    }
  }

  console.log('[ProtectedRoute] Acesso permitido, renderizando outlet');
  return <Outlet />;
}
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Uso:
// <Route element={<ProtectedRoute allowedRoles={["admin"]} />}> ... </Route>
// Se allowedRoles não for passado, exige apenas estar autenticado
export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // Redirecionar por função
      if (user.role === 'vendedor' || user.role === 'juridico') return <Navigate to="/vendedor" replace />;
      if (user.role === 'admin') return <Navigate to="/admin" replace />;
      return <Navigate to="/home" replace />;
    }
  }

  return <Outlet />;
}
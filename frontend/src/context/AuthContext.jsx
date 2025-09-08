import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Tipos de usuário: 'cliente' | 'vendedor' | 'admin'
// Estrutura de user:
// { id, nome, email, role, empresaId? , token? }

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar sessão do storage (MVP)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth:user');
      if (raw) setUser(JSON.parse(raw));
    } catch (_e) {}
    setLoading(false);
  }, []);

  const login = (data) => {
    // data deve conter { id, nome, email, role, empresaId?, token? }
    setUser(data);
    localStorage.setItem('auth:user', JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth:user');
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
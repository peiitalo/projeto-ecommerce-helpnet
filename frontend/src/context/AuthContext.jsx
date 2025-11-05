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
      const token = localStorage.getItem('token');
      const accessToken = localStorage.getItem('accessToken');
      console.log('[AuthContext] Carregando sessão do localStorage:', {
        userRaw: raw,
        token: token ? 'presente' : 'ausente',
        accessToken: accessToken ? 'presente' : 'ausente'
      });
      if (raw) {
        const parsedUser = JSON.parse(raw);
        console.log('[AuthContext] Usuário carregado:', {
          id: parsedUser.id,
          role: parsedUser.role,
          nome: parsedUser.nome,
          empresaId: parsedUser.empresaId
        });
        setUser(parsedUser);
      } else {
        console.log('[AuthContext] Nenhum usuário encontrado no localStorage');
      }
    } catch (e) {
      console.error('[AuthContext] Erro ao carregar sessão:', e);
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    // data deve conter { id, nome, email, role, empresaId?, token? }
    console.log('[AuthContext] Salvando dados do usuário no localStorage:', data);
    console.log('[AuthContext] Dados recebidos - id:', data?.id, 'nome:', data?.nome, 'email:', data?.email, 'role:', data?.role);

    if (!data || typeof data !== 'object') {
      console.error('[AuthContext] Dados inválidos recebidos no login:', data);
      return;
    }

    if (!data.id || !data.nome || !data.email) {
      console.error('[AuthContext] Dados incompletos - faltando campos obrigatórios:', { id: !!data.id, nome: !!data.nome, email: !!data.email });
      return;
    }

    try {
      setUser(data);
      const dataString = JSON.stringify(data);
      localStorage.setItem('auth:user', dataString);
      console.log('[AuthContext] Dados salvos com sucesso no localStorage. String length:', dataString.length);

      // Verificação imediata
      const saved = localStorage.getItem('auth:user');
      console.log('[AuthContext] Verificação imediata - dados salvos:', saved ? 'presente' : 'ausente');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('[AuthContext] Verificação imediata - dados parseados:', { id: parsed.id, nome: parsed.nome, role: parsed.role });
      }
    } catch (error) {
      console.error('[AuthContext] Erro ao salvar dados no localStorage:', error);
    }
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
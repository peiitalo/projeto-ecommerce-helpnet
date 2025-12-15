import { createContext, useContext, useState, useEffect } from 'react';
import { favoritoService, notificacaoService } from '../services/api';
import { useAuth } from './AuthContext';

const CountersContext = createContext();

export const useCounters = () => {
  const context = useContext(CountersContext);
  if (!context) {
    throw new Error('useCounters must be used within a CountersProvider');
  }
  return context;
};

export const CountersProvider = ({ children }) => {
  const { user } = useAuth();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  // Carregar contadores iniciais
  useEffect(() => {
    if (user) {
      loadCounters();
    } else {
      // Reset counters when not logged in
      setFavoritesCount(0);
      setNotificationsCount(0);
      setCartCount(0);
    }
  }, [user]);

  const loadCounters = async () => {
    if (!user) {
      setFavoritesCount(0);
      setNotificationsCount(0);
      return;
    }

    try {
      // Carregar favoritos
      const favoritesResponse = await favoritoService.listar();
      setFavoritesCount((favoritesResponse.favoritos || []).length);

      // Carregar notificações do cliente
      const notificationsResponse = await notificacaoService.listarCliente();
      const unreadNotifications = (notificationsResponse.notificacoes || []).filter(n => !n.lida);
      setNotificationsCount(unreadNotifications.length);
    } catch (error) {
      console.error('Erro ao carregar contadores:', error);
      // Valores padrão em caso de erro
      setFavoritesCount(0);
      setNotificationsCount(0);
    }
  };

  const updateFavoritesCount = (newCount) => {
    setFavoritesCount(newCount);
  };

  const updateNotificationsCount = (newCount) => {
    setNotificationsCount(newCount);
  };

  const incrementFavorites = () => {
    setFavoritesCount(prev => prev + 1);
  };

  const decrementFavorites = () => {
    setFavoritesCount(prev => Math.max(0, prev - 1));
  };

  const incrementNotifications = () => {
    setNotificationsCount(prev => prev + 1);
  };

  const decrementNotifications = () => {
    setNotificationsCount(prev => Math.max(0, prev - 1));
  };

  const updateCartCount = (newCount) => {
    setCartCount(newCount);
  };

  const value = {
    favoritesCount,
    notificationsCount,
    cartCount,
    updateFavoritesCount,
    updateNotificationsCount,
    updateCartCount,
    incrementFavorites,
    decrementFavorites,
    incrementNotifications,
    decrementNotifications,
    loadCounters
  };

  return (
    <CountersContext.Provider value={value}>
      {children}
    </CountersContext.Provider>
  );
};
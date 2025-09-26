import { createContext, useContext, useState, useCallback } from 'react';

// Contexto para gerenciar notificações do sistema
const NotificationContext = createContext();

// Hook personalizado para usar notificações
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
};

// Tipos de notificação disponíveis
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Provider do contexto de notificações
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Função para adicionar uma nova notificação
  const addNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      duration,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remover após a duração especificada
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  // Função para remover uma notificação
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Funções convenientes para cada tipo de notificação
  const showSuccess = useCallback((message, duration) => {
    return addNotification(message, NOTIFICATION_TYPES.SUCCESS, duration);
  }, [addNotification]);

  const showError = useCallback((message, duration) => {
    return addNotification(message, NOTIFICATION_TYPES.ERROR, duration);
  }, [addNotification]);

  const showWarning = useCallback((message, duration) => {
    return addNotification(message, NOTIFICATION_TYPES.WARNING, duration);
  }, [addNotification]);

  const showInfo = useCallback((message, duration) => {
    return addNotification(message, NOTIFICATION_TYPES.INFO, duration);
  }, [addNotification]);

  // Função para limpar todas as notificações
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
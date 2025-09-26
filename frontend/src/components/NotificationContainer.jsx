import { useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';
import { useNotification, NOTIFICATION_TYPES } from '../context/NotificationContext';

// Componente individual de notificação
const NotificationItem = ({ notification, onRemove }) => {
  const { id, message, type } = notification;

  // Configurações visuais por tipo
  const configs = {
    [NOTIFICATION_TYPES.SUCCESS]: {
      icon: <FiCheckCircle className="w-5 h-5" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600'
    },
    [NOTIFICATION_TYPES.ERROR]: {
      icon: <FiXCircle className="w-5 h-5" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600'
    },
    [NOTIFICATION_TYPES.WARNING]: {
      icon: <FiAlertTriangle className="w-5 h-5" />,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    [NOTIFICATION_TYPES.INFO]: {
      icon: <FiInfo className="w-5 h-5" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600'
    }
  };

  const config = configs[type] || configs[NOTIFICATION_TYPES.INFO];

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        border rounded-lg p-4 shadow-sm max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        animate-in slide-in-from-right-2 fade-in
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={`${config.iconColor} flex-shrink-0 mt-0.5`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-5">
            {message}
          </p>
        </div>
        <button
          onClick={() => onRemove(id)}
          className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-black/5 transition-colors"
          aria-label="Fechar notificação"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Container principal das notificações
const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  // Animação de entrada para novas notificações
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slide-in-from-right-2 {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .animate-in {
        animation: slide-in-from-right-2 0.3s ease-out, fade-in 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationItem
            notification={notification}
            onRemove={removeNotification}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
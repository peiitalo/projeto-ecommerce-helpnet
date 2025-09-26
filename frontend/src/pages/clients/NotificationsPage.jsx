import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaBell,
  FaFilter,
  FaClock,
  FaSortAmountDown,
  FaSortAmountUp
} from 'react-icons/fa';

function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, recent, old, new
  const [sortOrder, setSortOrder] = useState('desc'); // desc, asc

  // Mock notifications data
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        title: 'Novo produto disponível!',
        message: 'O produto "Fone de Ouvido Bluetooth XYZ" está disponível em promoção.',
        type: 'promotion',
        isNew: true,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        productId: 1
      },
      {
        id: 2,
        title: 'Pedido enviado',
        message: 'Seu pedido #1234 foi enviado e está a caminho.',
        type: 'order',
        isNew: false,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        orderId: 1234
      },
      {
        id: 3,
        title: 'Avaliação recebida',
        message: 'Você recebeu uma nova avaliação no produto "Mouse Gamer ABC".',
        type: 'review',
        isNew: true,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        productId: 2
      },
      {
        id: 4,
        title: 'Cupom de desconto',
        message: 'Use o cupom PROMO10 para 10% de desconto em sua próxima compra.',
        type: 'coupon',
        isNew: false,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        couponCode: 'PROMO10'
      },
      {
        id: 5,
        title: 'Produto favorito em promoção',
        message: 'Um produto dos seus favoritos está com 20% de desconto.',
        type: 'favorite',
        isNew: true,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
        productId: 3
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  // Filter and sort notifications
  useEffect(() => {
    let filtered = [...notifications];

    // Apply filter
    switch (filter) {
      case 'recent':
        filtered = filtered.filter(n => {
          const hoursDiff = (Date.now() - n.createdAt.getTime()) / (1000 * 60 * 60);
          return hoursDiff <= 24;
        });
        break;
      case 'old':
        filtered = filtered.filter(n => {
          const hoursDiff = (Date.now() - n.createdAt.getTime()) / (1000 * 60 * 60);
          return hoursDiff > 24;
        });
        break;
      case 'new':
        filtered = filtered.filter(n => n.isNew);
        break;
      default:
        break;
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
    });

    setFilteredNotifications(filtered);
  }, [notifications, filter, sortOrder]);

  const handleMarkAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      )
    );
  };

  const handleMarkAsUnread = (id) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, isRead: false } : n
      )
    );
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d atrás`;

    return date.toLocaleDateString('pt-BR');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'promotion':
        return '🎉';
      case 'order':
        return '📦';
      case 'review':
        return '⭐';
      case 'coupon':
        return '🎫';
      case 'favorite':
        return '❤️';
      default:
        return '🔔';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-slate-600 hover:text-blue-700 transition-colors"
              aria-label="Voltar"
            >
              <FaArrowLeft className="text-lg" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">Notificações</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('recent')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'recent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FaClock className="inline mr-1" />
                Recentes (24h)
              </button>
              <button
                onClick={() => setFilter('old')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'old'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Antigas
              </button>
              <button
                onClick={() => setFilter('new')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'new'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Novas
              </button>
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              {sortOrder === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
              {sortOrder === 'desc' ? 'Mais recentes' : 'Mais antigas'}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <FaBell className="text-6xl text-slate-300 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                {filter === 'all' ? 'Nenhuma notificação' : 'Nenhuma notificação encontrada'}
              </h2>
              <p className="text-slate-600">
                {filter === 'all'
                  ? 'Você não tem notificações no momento.'
                  : 'Tente ajustar os filtros para ver mais notificações.'
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
                  notification.isNew && !notification.isRead
                    ? 'border-blue-200 bg-blue-50/30'
                    : 'border-slate-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-slate-600 mb-3 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                          {notification.isNew && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              Novo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        notification.isRead
                          ? handleMarkAsUnread(notification.id)
                          : handleMarkAsRead(notification.id)
                      }
                      className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                      title={notification.isRead ? 'Marcar como não lida' : 'Marcar como lida'}
                    >
                      {notification.isRead ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;
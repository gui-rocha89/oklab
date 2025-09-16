import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Check, 
  Clock, 
  MessageSquare, 
  FileText, 
  X,
  CheckCircle,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

const NotificationDropdown = ({ isOpen, onClose, buttonRef }) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  // Mock notifications data
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        type: 'project_approved',
        title: 'Projeto Aprovado',
        message: 'Seu projeto "Campanha Verão 2024" foi aprovado!',
        time: '2 horas atrás',
        read: false,
        icon: CheckCircle,
        color: 'text-green-600'
      },
      {
        id: 2,
        type: 'new_comment',
        title: 'Novo Comentário',
        message: 'Ana Silva comentou no projeto "Banner Website"',
        time: '4 horas atrás',
        read: false,
        icon: MessageSquare,
        color: 'text-blue-600'
      },
      {
        id: 3,
        type: 'project_rejected',
        title: 'Projeto Rejeitado',
        message: 'O projeto "Post Redes Sociais" precisa de revisão',
        time: '1 dia atrás',
        read: true,
        icon: AlertTriangle,
        color: 'text-red-600'
      },
      {
        id: 4,
        type: 'new_project',
        title: 'Novo Projeto',
        message: 'Carlos Oliveira criou um novo projeto',
        time: '2 dias atrás',
        read: true,
        icon: FileText,
        color: 'text-purple-600'
      },
      {
        id: 5,
        type: 'deadline_approaching',
        title: 'Prazo se Aproxima',
        message: 'O projeto "Vídeo Institucional" vence em 2 dias',
        time: '3 dias atrás',
        read: false,
        icon: Clock,
        color: 'text-orange-600'
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    toast({
      title: "✅ Todas as notificações foram marcadas como lidas",
      duration: 2000,
    });
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast({
      title: "🗑️ Notificação removida",
      duration: 2000,
    });
  };

  const getFilterCounts = () => ({
    all: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    read: notifications.filter(n => n.read).length
  });

  const counts = getFilterCounts();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50"
        style={{ 
          top: buttonRef?.current ? buttonRef.current.offsetHeight + 8 : '100%'
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Notificações</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'Todas', count: counts.all },
              { key: 'unread', label: 'Não lidas', count: counts.unread },
              { key: 'read', label: 'Lidas', count: counts.read }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs transition-colors ${
                  filter === filterOption.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span>{filterOption.label}</span>
                <span className="font-medium">({filterOption.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredNotifications.length > 0 ? (
            <div className="space-y-1 p-2">
              {filteredNotifications.map((notification) => {
                const IconComponent = notification.icon;
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full bg-gray-100 ${notification.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {notification.time}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-900 font-medium mb-2">
                Nenhuma notificação
              </h3>
              <p className="text-sm text-gray-500">
                {filter === 'unread' 
                  ? 'Todas as notificações foram lidas' 
                  : 'Você não tem notificações no momento'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {unreadCount > 0 && (
          <>
            <Separator />
            <div className="p-3">
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Marcar todas como lidas</span>
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationDropdown;
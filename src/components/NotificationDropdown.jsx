import React, { useState } from 'react';
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
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = ({ isOpen, onClose, buttonRef }) => {
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { 
    notifications, 
    loading, 
    unreadCount,
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  // Map notification types to icons
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'project_approved':
        return { icon: CheckCircle, color: 'text-green-600' };
      case 'new_comment':
        return { icon: MessageSquare, color: 'text-blue-600' };
      case 'feedback_received':
        return { icon: Bell, color: 'text-orange-600' };
      case 'comment_response':
        return { icon: FileText, color: 'text-purple-600' };
      case 'project_rejected':
        return { icon: AlertTriangle, color: 'text-red-600' };
      default:
        return { icon: Bell, color: 'text-gray-600' };
    }
  };

  // Format relative time
  const formatTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch (error) {
      return 'agora';
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.project_id) {
      navigate(`/projetos`);
      onClose();
    }
  };

  const handleDeleteNotification = (id) => {
    deleteNotification(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
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
        className="absolute right-0 mt-2 w-80 bg-popover rounded-xl shadow-lg border border-border z-50"
        style={{ 
          top: buttonRef?.current ? buttonRef.current.offsetHeight + 8 : '100%'
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-popover-foreground" />
              <h3 className="font-semibold text-popover-foreground">Notificações</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
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
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
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
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Carregando notificações...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-1 p-2">
              {filteredNotifications.map((notification) => {
                const { icon: IconComponent, color } = getNotificationIcon(notification.type);
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-accent border-l-4 border-primary' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full bg-secondary ${color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-popover-foreground text-sm truncate">
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                            className="text-muted-foreground hover:text-popover-foreground transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.created_at)}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
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
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-popover-foreground font-medium mb-2">
                Nenhuma notificação
              </h3>
              <p className="text-sm text-muted-foreground">
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
                onClick={handleMarkAllAsRead}
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
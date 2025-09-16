import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Menu, Bell, Search, User, Users, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/UserContext';
import { useProfile } from '@/hooks/useProfile';
import NotificationDropdown from '@/components/NotificationDropdown';
import GlobalSearch from '@/components/GlobalSearch';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  setSidebarOpen?: (open: boolean) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  setSidebarOpen, 
  activeTab, 
  setActiveTab 
}) => {
  const { toast } = useToast();
  const { user, isSupremeAdmin, logout } = useUser();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  // Estados para dropdown de notificações e busca
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const notificationButtonRef = useRef(null);

  const getPageTitle = () => {
    if (title) return title;
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'projects':
        return 'Projetos';
      case 'users':
        return 'Usuários';
      default:
        return 'Dashboard';
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleProfileClick = () => {
    navigate('/configuracoes');
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
      toast({
        title: "🚪 Logout realizado com sucesso!",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleManageTeamClick = () => {
    if (setActiveTab) {
      setActiveTab('users');
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-40 shadow-lg border-b border-border/10 transition-all duration-300 bg-primary dark:gradient-header-dark"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile menu button */}
          {setSidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-orange-600 transition-colors mr-4"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Page Title - Left aligned and responsive */}
          <div className="flex-shrink-0 min-w-0 max-w-xs">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-bold text-white dark:text-white truncate transition-all duration-300"
            >
              {getPageTitle()}
            </motion.h1>
            {subtitle && (
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-orange-200 dark:text-gray-300 mt-1 truncate transition-all duration-300"
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          {/* Centered Search Bar */}
          <div className="hidden md:flex flex-1 justify-center px-8">
            <div className="w-full max-w-lg">
              <GlobalSearch
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                projects={[]} // Será preenchido com projetos reais
                users={[]} // Será preenchido com usuários reais
                onResultClick={(result) => {
                  if (result.type === 'project') {
                    navigate('/projetos');
                  } else if (result.type === 'user') {
                    navigate('/equipe');
                  }
                  setSearchTerm('');
                }}
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Manage Team */}
            {setActiveTab && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleManageTeamClick}
                className="hidden sm:flex items-center space-x-2 p-2 rounded-lg hover:bg-orange-600 dark:hover:bg-gray-700 transition-colors"
              >
                <Users className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white">
                  Equipe
                </span>
              </motion.button>
            )}

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-orange-600 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-white" />
              ) : (
                <Moon className="w-5 h-5 text-white" />
              )}
            </motion.button>

            {/* Notifications */}
            <div className="relative">
              <motion.button
                ref={notificationButtonRef}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNotificationClick}
                className="relative p-2 rounded-lg hover:bg-orange-600 dark:hover:bg-gray-700 transition-colors"
              >
                <Bell className="w-6 h-6 text-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </motion.button>
              
              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                buttonRef={notificationButtonRef}
              />
            </div>

            {/* Profile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleProfileClick}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-orange-600 dark:hover:bg-gray-700 transition-colors"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage 
                  src={profile?.avatar_url || undefined} 
                  className="object-cover"
                />
                <AvatarFallback className="bg-white text-orange-500 text-sm font-semibold">
                  {(profile?.full_name || user?.user_metadata?.full_name || user?.email)
                    ?.split(" ")
                    .map(n => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "??"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium text-white">
                {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
              </span>
            </motion.button>

            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogoutClick}
              className="flex items-center space-x-1 p-2 rounded-lg hover:bg-orange-600 dark:hover:bg-gray-700 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5 text-white" />
              <span className="hidden sm:block text-sm font-medium text-white">
                Sair
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
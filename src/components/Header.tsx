import React from 'react';
import { motion } from 'framer-motion';
import { Menu, Bell, Search, User, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import logoWhite from '@/assets/logo-white-bg.png';

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
    toast({
      title: "🚧 Notificações não implementadas ainda—mas não se preocupe! Você pode solicitar isso no seu próximo prompt! 🚀",
      duration: 4000,
    });
  };

  const handleProfileClick = () => {
    toast({
      title: "🚧 Perfil não implementado ainda—mas não se preocupe! Você pode solicitar isso no seu próximo prompt! 🚀",
      duration: 4000,
    });
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
      className="gradient-bg shadow-lg border-b border-border/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <motion.img
              src={logoWhite}
              alt="MANUS I.A Logo"
              className="h-8 w-auto"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />
            
            {/* Mobile menu button */}
            {setSidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Menu className="w-6 h-6 text-white" />
              </button>
            )}
          </div>

          {/* Page Title */}
          <div className="flex-1 px-4">
            <h1 className="text-xl font-bold text-white">
              {getPageTitle()}
            </h1>
            {subtitle && (
              <p className="text-sm text-orange-200 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-200" />
              <input
                type="text"
                placeholder="Buscar projetos..."
                className="search-input w-full pl-10 pr-4 bg-orange-700 bg-opacity-20 border-orange-500 text-white placeholder-orange-200 focus:border-white focus:ring-0"
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
                className="hidden sm:flex items-center space-x-2 p-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Users className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white">
                  Equipe
                </span>
              </motion.button>
            )}

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNotificationClick}
              className="relative p-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Bell className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </motion.button>

            {/* Profile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleProfileClick}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-orange-500" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-white">
                Admin
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
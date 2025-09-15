import React from 'react';
import { motion } from 'framer-motion';
import { Menu, Bell, Search, User, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Header = ({ setSidebarOpen, activeTab, setActiveTab }) => {
  const { toast } = useToast();

  const getPageTitle = () => {
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
    setActiveTab('users');
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 right-0 left-0 lg:left-64 z-30 gradient-bg shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>

          {/* Page Title */}
          <div className="flex-1 lg:flex-none">
            <h1 className="text-xl font-bold text-white">
              {getPageTitle()}
            </h1>
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

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNotificationClick}
              className="relative p-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Bell className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 notification-dot rounded-full"></span>
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

export default Header;
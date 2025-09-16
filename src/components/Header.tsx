import React from 'react';
import { motion } from 'framer-motion';
import { Menu, Bell, Search, User, Users, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/UserContext';
import { useProfile } from '@/hooks/useProfile';

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
      className="sticky top-0 z-40 gradient-bg shadow-lg border-b border-border/10 transition-all duration-300"
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
          <div className="flex-1 min-w-0">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-bold text-white truncate transition-all duration-300"
            >
              {getPageTitle()}
            </motion.h1>
            {subtitle && (
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-orange-200 mt-1 truncate transition-all duration-300"
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          {/* Centered Search Bar */}
          <div className="hidden md:flex items-center mx-6 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-200" />
              <input
                type="text"
                placeholder="Buscar projetos..."
                className="search-input w-full pl-10 pr-4 bg-orange-700 bg-opacity-20 border-orange-500 text-white placeholder-orange-200 focus:border-white focus:ring-0 transition-all duration-200"
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
              className="flex items-center space-x-1 p-2 rounded-lg hover:bg-orange-600 transition-colors"
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
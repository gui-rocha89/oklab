import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical,
  Mail,
  Shield,
  Calendar,
  Edit,
  Trash2,
  Crown,
  User,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const UserManagement = ({ setActiveTab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Dados mockados para demonstração
  const users = [
    {
      id: 1,
      name: 'Maria Silva',
      email: 'maria.silva@oklab.com',
      role: 'admin',
      avatar: null,
      lastActive: '2024-01-15',
      projectsCount: 12,
      status: 'active'
    },
    {
      id: 2,
      name: 'João Santos',
      email: 'joao.santos@oklab.com',
      role: 'editor',
      avatar: null,
      lastActive: '2024-01-14',
      projectsCount: 8,
      status: 'active'
    },
    {
      id: 3,
      name: 'Ana Costa',
      email: 'ana.costa@oklab.com',
      role: 'viewer',
      avatar: null,
      lastActive: '2024-01-13',
      projectsCount: 3,
      status: 'inactive'
    },
    {
      id: 4,
      name: 'Carlos Lima',
      email: 'carlos.lima@oklab.com',
      role: 'editor',
      avatar: null,
      lastActive: '2024-01-12',
      projectsCount: 15,
      status: 'active'
    }
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleConfig = {
    admin: {
      label: 'Administrador',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      icon: Crown,
      description: 'Acesso total'
    },
    editor: {
      label: 'Editor',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      icon: Edit,
      description: 'Pode editar e aprovar'
    },
    viewer: {
      label: 'Visualizador',
      color: 'bg-gradient-to-r from-gray-500 to-gray-600',
      icon: User,
      description: 'Apenas visualização'
    }
  };

  const handleAddUser = () => {
    toast({
      title: "🚧 Adicionar usuário não implementado ainda—mas não se preocupe! Você pode solicitar isso no seu próximo prompt! 🚀",
      duration: 4000,
    });
  };

  const handleEditUser = (userId) => {
    toast({
      title: "🚧 Editar usuário não implementado ainda—mas não se preocupe! Você pode solicitar isso no seu próximo prompt! 🚀",
      duration: 4000,
    });
  };

  const handleDeleteUser = (userId) => {
    toast({
      title: "🚧 Excluir usuário não implementado ainda—mas não se preocupe! Você pode solicitar isso no seu próximo prompt! 🚀",
      duration: 4000,
    });
  };

  const UserCard = ({ user, index }) => {
    const role = roleConfig[user.role];
    const RoleIcon = role.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="project-card card-hover"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            
            {/* User Info */}
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{user.name}</h3>
              <div className="flex items-center space-x-1 text-gray-600 mb-1">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-500">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">
                  Último acesso: {new Date(user.lastActive).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
            <span className={`text-xs font-medium ${
              user.status === 'active' ? 'text-green-600' : 'text-gray-500'
            }`}>
              {user.status === 'active' ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>

        {/* Role and Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className={`px-3 py-1 rounded-full flex items-center space-x-2 ${role.color} text-white`}>
            <RoleIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{role.label}</span>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">{user.projectsCount}</div>
            <div className="text-xs text-gray-500">Projetos</div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4">{role.description}</p>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEditUser(user.id)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors tooltip"
              data-tooltip="Editar usuário"
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDeleteUser(user.id)}
              className="p-2 rounded-lg hover:bg-red-50 transition-colors tooltip"
              data-tooltip="Excluir usuário"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600">Gerencie permissões e acesso da sua equipe</p>
        </div>
        
        <div className="flex items-center space-x-4">
           <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('dashboard')}
            className="btn-secondary hidden sm:flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Dashboard</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddUser}
            className="btn-primary flex items-center space-x-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Adicionar Usuário</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total de Usuários</p>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Administradores</p>
              <p className="text-3xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600">
              <Crown className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Editores</p>
              <p className="text-3xl font-bold text-gray-900">
                {users.filter(u => u.role === 'editor').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600">
              <Edit className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Usuários Ativos</p>
              <p className="text-3xl font-bold text-gray-900">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-green-600">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input w-full pl-10 pr-4"
          />
        </div>
      </motion.div>

      {/* Users Grid */}
      {filteredUsers.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {filteredUsers.map((user, index) => (
            <UserCard key={user.id} user={user} index={index} />
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="empty-state"
        >
          <Users className="w-16 h-16 text-orange-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum usuário encontrado
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? `Não encontramos usuários que correspondam a "${searchTerm}"`
              : 'Não há usuários cadastrados no momento'
            }
          </p>
          {searchTerm && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSearchTerm('')}
              className="btn-primary"
            >
              Limpar busca
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default UserManagement;
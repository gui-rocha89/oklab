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
  ArrowLeft,
  Send,
  Activity,
  Clock
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const UserManagement = ({ setActiveTab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUserRole, setEditUserRole] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [usersList, setUsersList] = useState([
    {
      id: 1,
      name: 'Maria Silva',
      email: 'maria.silva@oklab.com',
      role: 'admin',
      avatar: null,
      lastActive: '2024-01-15',
      projectsCount: 12,
      status: 'active',
      joinedAt: '2023-05-15',
      activityLevel: 'high',
      departamento: 'Marketing'
    },
    {
      id: 2,
      name: 'João Santos',
      email: 'joao.santos@oklab.com',
      role: 'editor',
      avatar: null,
      lastActive: '2024-01-14',
      projectsCount: 8,
      status: 'active',
      joinedAt: '2023-08-20',
      activityLevel: 'medium',
      departamento: 'Design'
    },
    {
      id: 3,
      name: 'Ana Costa',
      email: 'ana.costa@oklab.com',
      role: 'viewer',
      avatar: null,
      lastActive: '2024-01-10',
      projectsCount: 3,
      status: 'inactive',
      joinedAt: '2023-11-10',
      activityLevel: 'low',
      departamento: 'Desenvolvimento'
    },
    {
      id: 4,
      name: 'Carlos Lima',
      email: 'carlos.lima@oklab.com',
      role: 'editor',
      avatar: null,
      lastActive: '2024-01-12',
      projectsCount: 15,
      status: 'active',
      joinedAt: '2023-03-05',
      activityLevel: 'high',
      departamento: 'Produção'
    }
  ]);
  const { toast } = useToast();

  const filteredUsers = usersList.filter(user =>
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

  const handleInviteUser = () => {
    if (!inviteEmail || !inviteRole) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o email e selecione um papel.",
        variant: "destructive"
      });
      return;
    }

    // Simulate sending invite
    toast({
      title: "Convite enviado!",
      description: `Convite enviado para ${inviteEmail} como ${roleConfig[inviteRole].label}`,
    });

    // Reset form and close modal
    setInviteEmail('');
    setInviteRole('viewer');
    setIsInviteModalOpen(false);
  };

  const handleAddUser = () => {
    setIsInviteModalOpen(true);
  };

  const handleEditUser = (userId) => {
    const user = usersList.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setEditUserRole(user.role);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveUserRole = () => {
    if (!selectedUser || !editUserRole) return;

    setUsersList(prev => 
      prev.map(user => 
        user.id === selectedUser.id 
          ? { ...user, role: editUserRole }
          : user
      )
    );

    toast({
      title: "Hierarquia atualizada!",
      description: `${selectedUser.name} agora é ${roleConfig[editUserRole].label}`,
    });

    setIsEditModalOpen(false);
    setSelectedUser(null);
    setEditUserRole('');
  };

  const handleDeleteUser = (userId) => {
    const user = usersList.find(u => u.id === userId);
    if (user) {
      setUserToDelete(user);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;

    setUsersList(prev => prev.filter(user => user.id !== userToDelete.id));

    toast({
      title: "Usuário excluído",
      description: `${userToDelete.name} foi removido da equipe`,
      variant: "destructive"
    });

    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const UserCard = ({ user, index }) => {
    const role = roleConfig[user.role];
    const RoleIcon = role.icon;

    const getActivityColor = (level) => {
      switch (level) {
        case 'high': return 'text-green-600';
        case 'medium': return 'text-yellow-600';
        case 'low': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };

    const getActivityLabel = (level) => {
      switch (level) {
        case 'high': return 'Alta atividade';
        case 'medium': return 'Atividade moderada';
        case 'low': return 'Baixa atividade';
        default: return 'Sem dados';
      }
    };

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
              <div className="text-xs text-gray-500">{user.departamento}</div>
            </div>
          </div>

          {/* Status Badge */}
          <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
            {user.status === 'active' ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        {/* Role Badge */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="flex items-center space-x-2">
            <RoleIcon className="w-3 h-3" />
            <span>{role.label}</span>
          </Badge>
          
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">{user.projectsCount}</div>
            <div className="text-xs text-gray-500">Projetos</div>
          </div>
        </div>

        {/* Activity Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500">Último acesso</div>
              <div className="text-sm font-medium">
                {new Date(user.lastActive).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className={`w-4 h-4 ${getActivityColor(user.activityLevel)}`} />
            <div>
              <div className="text-xs text-gray-500">Atividade</div>
              <div className={`text-sm font-medium ${getActivityColor(user.activityLevel)}`}>
                {getActivityLabel(user.activityLevel)}
              </div>
            </div>
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
              <p className="text-3xl font-bold text-gray-900">{usersList.length}</p>
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
                {usersList.filter(u => u.role === 'admin').length}
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
                {usersList.filter(u => u.role === 'editor').length}
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
                {usersList.filter(u => u.status === 'active').length}
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

      {/* Invite User Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Convidar Novo Membro</DialogTitle>
            <DialogDescription>
              Envie um convite para um novo membro da equipe. Selecione o papel apropriado para definir suas permissões.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="role" className="text-right text-sm font-medium">
                Papel
              </label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <div>
                        <div>Visualizador</div>
                        <div className="text-xs text-gray-500">Apenas visualização</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center space-x-2">
                      <Edit className="w-4 h-4" />
                      <div>
                        <div>Editor</div>
                        <div className="text-xs text-gray-500">Pode editar e aprovar</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center space-x-2">
                      <Crown className="w-4 h-4" />
                      <div>
                        <div>Administrador</div>
                        <div className="text-xs text-gray-500">Acesso total</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="btn-secondary mr-2"
            >
              Cancelar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleInviteUser}
              className="btn-primary flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Convite</span>
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Role Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configurar Hierarquia de Acesso</DialogTitle>
            <DialogDescription>
              {selectedUser && `Altere a hierarquia de acesso de ${selectedUser.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="user-role" className="text-right text-sm font-medium">
                Hierarquia
              </label>
              <Select value={editUserRole} onValueChange={setEditUserRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma hierarquia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <div>
                        <div>Visualizador</div>
                        <div className="text-xs text-gray-500">Apenas visualização</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center space-x-2">
                      <Edit className="w-4 h-4" />
                      <div>
                        <div>Editor</div>
                        <div className="text-xs text-gray-500">Pode editar e aprovar</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center space-x-2">
                      <Crown className="w-4 h-4" />
                      <div>
                        <div>Administrador</div>
                        <div className="text-xs text-gray-500">Acesso total</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditModalOpen(false)}
              className="btn-secondary mr-2"
            >
              Cancelar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveUserRole}
              className="btn-primary flex items-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Excluir Usuário</DialogTitle>
            <DialogDescription>
              {userToDelete && `Tem certeza de que deseja excluir ${userToDelete.name}? Esta ação não pode ser desfeita.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <div className="p-3 rounded-full bg-red-100">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <DialogFooter>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="btn-secondary mr-2"
            >
              Cancelar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir Usuário</span>
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
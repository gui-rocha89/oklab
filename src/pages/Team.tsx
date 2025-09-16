import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Mail, Calendar, Settings, UserPlus, Shield, Eye, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Team() {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUserRole, setEditUserRole] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const { toast } = useToast();

  // Fetch users from database
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Transform profiles to match the expected format
      const transformedUsers = profiles.map(profile => {
        const userRole = userRoles.find(role => role.user_id === profile.id);
        return {
          id: profile.id,
          name: profile.full_name || profile.email,
          email: profile.email,
          role: userRole?.role || 'user',
          avatar: profile.avatar_url,
          joinedAt: profile.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          lastActive: new Date().toISOString(),
          projectsAssigned: Math.floor(Math.random() * 10) + 1,
          status: 'active'
        };
      });

      setMembers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleColor = (role: string): string => {
    switch (role) {
      case "supreme_admin": return "bg-red-100 text-red-800 border-red-200";
      case "admin": return "bg-purple-100 text-purple-800 border-purple-200";
      case "manager": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "team_lead": return "bg-blue-100 text-blue-800 border-blue-200";
      case "editor": return "bg-blue-100 text-blue-800 border-blue-200";
      case "viewer": return "bg-green-100 text-green-800 border-green-200";
      case "user": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleText = (role: string): string => {
    switch (role) {
      case "supreme_admin": return "Administrador Supremo";
      case "admin": return "Administrador";
      case "manager": return "Gerente";
      case "team_lead": return "Líder de Equipe";
      case "editor": return "Editor";
      case "viewer": return "Visualizador";
      case "user": return "Usuário";
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "supreme_admin": return <Shield className="h-4 w-4 text-red-500" />;
      case "admin": return <Shield className="h-4 w-4 text-purple-500" />;
      case "manager": return <Shield className="h-4 w-4 text-indigo-500" />;
      case "team_lead": return <Edit className="h-4 w-4 text-blue-500" />;
      case "editor": return <Edit className="h-4 w-4" />;
      case "viewer": return <Eye className="h-4 w-4" />;
      case "user": return <Eye className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "inactive": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getInitials = (name: string): string => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleInvite = () => {
    if (!inviteEmail) {
      toast({
        title: "Erro",
        description: "Por favor, digite um email válido.",
        variant: "destructive"
      });
      return;
    }

    // Simulate sending invite
    toast({
      title: "Convite enviado!",
      description: `Convite enviado para ${inviteEmail} com a função de ${getRoleText(inviteRole)}.`,
    });

    setIsInviteOpen(false);
    setInviteEmail("");
    setInviteRole("viewer");
  };

  const handleEditUser = (userId) => {
    const user = members.find(m => m.id === userId);
    if (user) {
      setSelectedUser(user);
      setEditUserRole(user.role);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveUserRole = async () => {
    if (!selectedUser || !editUserRole) return;

    try {
      // Update user role in database
      const { error } = await supabase
        .from('user_roles')
        .update({ role: editUserRole })
        .eq('user_id', selectedUser.id);

      if (error) throw error;

      // Update local state
      setMembers(prev => 
        prev.map(user => 
          user.id === selectedUser.id 
            ? { ...user, role: editUserRole }
            : user
        )
      );

      toast({
        title: "Hierarquia atualizada!",
        description: `${selectedUser.name} agora é ${getRoleText(editUserRole)}`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Erro ao atualizar hierarquia",
        description: "Não foi possível atualizar o papel do usuário.",
        variant: "destructive"
      });
    }

    setIsEditModalOpen(false);
    setSelectedUser(null);
    setEditUserRole("");
  };

  const handleDeleteUser = (userId) => {
    const user = members.find(m => m.id === userId);
    if (user) {
      setUserToDelete(user);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Delete user roles first
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userToDelete.id);

      if (rolesError) throw rolesError;

      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (profileError) throw profileError;

      // Update local state
      setMembers(prev => prev.filter(user => user.id !== userToDelete.id));

      toast({
        title: "Usuário excluído",
        description: `${userToDelete.name} foi removido da equipe`,
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro ao excluir usuário",
        description: "Não foi possível remover o usuário da equipe.",
        variant: "destructive"
      });
    }

    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const stats = {
    total: members.length,
    active: members.filter(m => m.status === "active").length,
    admins: members.filter(m => m.role === "admin" || m.role === "supreme_admin").length,
    editors: members.filter(m => m.role === "editor").length,
    viewers: members.filter(m => m.role === "viewer" || m.role === "user").length
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Equipe" 
          subtitle="Gerencie os membros da sua equipe e suas permissões"
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Carregando usuários...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Equipe" 
        subtitle="Gerencie os membros da sua equipe e suas permissões"
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
                </div>
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
                </div>
                <Shield className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Editores</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.editors}</p>
                </div>
                <Edit className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Visualizadores</p>
                  <p className="text-2xl font-bold text-green-600">{stats.viewers}</p>
                </div>
                <Eye className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Ações */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar membros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Funções</SelectItem>
                <SelectItem value="supreme_admin">Administrador Supremo</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="team_lead">Líder de Equipe</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Visualizador</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Convidar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Novo Membro</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Função</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="team_lead">Líder de Equipe</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleInvite} className="flex-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Convite
                  </Button>
                  <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Membros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {member.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Badge className={getRoleColor(member.role)}>
                    {getRoleIcon(member.role)}
                    <span className="ml-1">{getRoleText(member.role)}</span>
                  </Badge>
                  <Badge className={getStatusColor(member.status)}>
                    {member.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Entrou em {new Date(member.joinedAt).toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Último acesso: {new Date(member.lastActive).toLocaleString('pt-BR')}</span>
                </div>

                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{member.projectsAssigned}</span> projetos atribuídos
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleEditUser(member.id)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteUser(member.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum membro encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar os filtros ou convide novos membros para a equipe.
                </p>
                <Button onClick={() => setIsInviteOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Convidar Primeiro Membro
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de Edição de Hierarquia */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Hierarquia do Usuário</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Avatar>
                    <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="userRole">Nova Hierarquia</Label>
                  <Select value={editUserRole} onValueChange={setEditUserRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="team_lead">Líder de Equipe</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveUserRole} className="flex-1">
                    Salvar Alterações
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação de Exclusão */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Confirmar Exclusão
              </DialogTitle>
            </DialogHeader>
            {userToDelete && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-800">
                    Tem certeza de que deseja remover <strong>{userToDelete.name}</strong> da equipe?
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    Esta ação não pode ser desfeita. O usuário perderá acesso a todos os projetos.
                  </p>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="destructive" 
                    onClick={confirmDeleteUser}
                    className="flex-1"
                  >
                    Sim, Remover Usuário
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
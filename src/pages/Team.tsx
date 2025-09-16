import { useState } from "react";
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

const mockTeamMembers = [
  {
    id: 1,
    name: "Maria Silva",
    email: "maria@empresa.com",
    role: "admin",
    avatar: null,
    joinedAt: "2024-01-10",
    lastActive: "2024-01-15T14:30:00Z",
    projectsAssigned: 8,
    status: "active"
  },
  {
    id: 2,
    name: "João Santos",
    email: "joao@empresa.com",
    role: "editor",
    avatar: null,
    joinedAt: "2024-01-12",
    lastActive: "2024-01-15T10:20:00Z",
    projectsAssigned: 5,
    status: "active"
  },
  {
    id: 3,
    name: "Ana Costa",
    email: "ana@empresa.com",
    role: "viewer",
    avatar: null,
    joinedAt: "2024-01-14",
    lastActive: "2024-01-14T16:45:00Z",
    projectsAssigned: 2,
    status: "inactive"
  },
  {
    id: 4,
    name: "Pedro Oliveira",
    email: "pedro@empresa.com",
    role: "editor",
    avatar: null,
    joinedAt: "2024-01-08",
    lastActive: "2024-01-15T09:15:00Z",
    projectsAssigned: 6,
    status: "active"
  }
];

export default function Team() {
  const [members, setMembers] = useState(mockTeamMembers);
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

  const getRoleColor = (role: string): string => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800 border-red-200";
      case "editor": return "bg-blue-100 text-blue-800 border-blue-200";
      case "viewer": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleText = (role: string): string => {
    switch (role) {
      case "admin": return "Administrador";
      case "editor": return "Editor";
      case "viewer": return "Visualizador";
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="h-4 w-4" />;
      case "editor": return <Edit className="h-4 w-4" />;
      case "viewer": return <Eye className="h-4 w-4" />;
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

    // Aqui você implementaria a lógica para enviar o convite
    console.log(`Convidando ${inviteEmail} como ${inviteRole}`);
    
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

  const handleSaveUserRole = () => {
    if (selectedUser) {
      setMembers(prev => prev.map(member => 
        member.id === selectedUser.id 
          ? { ...member, role: editUserRole }
          : member
      ));
      
      toast({
        title: "Hierarquia atualizada!",
        description: `${selectedUser.name} agora é ${getRoleText(editUserRole)}.`,
      });
      
      setIsEditModalOpen(false);
      setSelectedUser(null);
      setEditUserRole("");
    }
  };

  const handleDeleteUser = (userId) => {
    const user = members.find(m => m.id === userId);
    if (user) {
      setUserToDelete(user);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      setMembers(prev => prev.filter(member => member.id !== userToDelete.id));
      
      toast({
        title: "Usuário removido!",
        description: `${userToDelete.name} foi removido da equipe.`,
      });
      
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const stats = {
    total: members.length,
    active: members.filter(m => m.status === "active").length,
    admins: members.filter(m => m.role === "admin").length,
    editors: members.filter(m => m.role === "editor").length,
    viewers: members.filter(m => m.role === "viewer").length
  };

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
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Visualizador</SelectItem>
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
                      <SelectItem value="viewer">Visualizador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
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
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4" />
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
                      <SelectItem value="viewer">Visualizador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
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
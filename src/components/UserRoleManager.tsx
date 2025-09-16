import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Target, User, Crown, Mail, Calendar } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

const roleConfigs = {
  supreme_admin: { 
    label: 'Supreme Admin', 
    icon: Shield, 
    color: 'bg-red-500', 
    badge: 'destructive' as const 
  },
  manager: { 
    label: 'Manager', 
    icon: Users, 
    color: 'bg-blue-500', 
    badge: 'default' as const 
  },
  team_lead: { 
    label: 'Team Lead', 
    icon: Target, 
    color: 'bg-green-500', 
    badge: 'secondary' as const 
  },
  user: { 
    label: 'Usuário', 
    icon: User, 
    color: 'bg-gray-500', 
    badge: 'outline' as const 
  }
};

export function UserRoleManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { hasRole, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        profilesData.map(async (profile) => {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...profile,
            role: roleData?.role || 'user'
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    if (!hasRole('supreme_admin')) {
      toast({
        title: "Acesso Negado",
        description: "Apenas Supreme Admins podem alterar roles.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUpdating(userId);

      // Delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: newRole }]);

      if (error) throw error;

      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      toast({
        title: "Role Atualizado",
        description: "O nível do usuário foi alterado com sucesso.",
      });

    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o role do usuário.",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  if (!hasRole('supreme_admin')) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Apenas Supreme Admins podem gerenciar usuários.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Gerenciamento de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Gerencie os níveis de acesso dos usuários da plataforma. 
            Como Supreme Admin, você pode alterar qualquer role.
          </p>
          
          <div className="grid gap-4">
            {users.map((user) => {
              const roleConfig = roleConfigs[user.role];
              const RoleIcon = roleConfig.icon;
              const isCurrentUser = user.id === profile?.id;

              return (
                <Card key={user.id} className={`transition-all duration-200 ${
                  isCurrentUser ? 'ring-2 ring-primary/50' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${roleConfig.color}`}>
                          <RoleIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {user.full_name || user.email}
                            </p>
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-xs">
                                Você
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={roleConfig.badge}>
                          {roleConfig.label}
                        </Badge>

                        {!isCurrentUser && (
                          <Select
                            value={user.role}
                            onValueChange={(newRole: UserRole) => updateUserRole(user.id, newRole)}
                            disabled={updating === user.id}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Usuário
                                </div>
                              </SelectItem>
                              <SelectItem value="team_lead">
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  Team Lead
                                </div>
                              </SelectItem>
                              <SelectItem value="manager">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Manager
                                </div>
                              </SelectItem>
                              <SelectItem value="supreme_admin">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Supreme Admin
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        {isCurrentUser && (
                          <p className="text-xs text-muted-foreground">
                            Não é possível alterar seu próprio role
                          </p>
                        )}

                        {updating === user.id && (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
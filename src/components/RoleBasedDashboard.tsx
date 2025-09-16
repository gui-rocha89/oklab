import React from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Dashboard } from '@/components/Dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Target, User } from 'lucide-react';

const getRoleConfig = (role: UserRole) => {
  const configs = {
    supreme_admin: {
      title: 'Supreme Admin',
      description: 'Acesso total à plataforma',
      icon: Shield,
      color: 'bg-red-500',
      permissions: [
        'Visualizar todos os dashboards',
        'Gerenciar usuários e permissões',
        'Acessar configurações globais',
        'Controle total de projetos'
      ]
    },
    manager: {
      title: 'Manager',
      description: 'Gestão de projetos e equipes',
      icon: Users,
      color: 'bg-blue-500',
      permissions: [
        'Visualizar métricas de equipe',
        'Gerenciar projetos',
        'Acessar relatórios avançados',
        'Visualizar dados de usuários'
      ]
    },
    team_lead: {
      title: 'Team Lead',
      description: 'Liderança de projetos específicos',
      icon: Target,
      color: 'bg-green-500',
      permissions: [
        'Gerenciar projetos da equipe',
        'Visualizar feedbacks',
        'Acompanhar progresso',
        'Coordenar atividades'
      ]
    },
    user: {
      title: 'Usuário',
      description: 'Acesso limitado a projetos próprios',
      icon: User,
      color: 'bg-gray-500',
      permissions: [
        'Visualizar projetos próprios',
        'Enviar feedbacks',
        'Acompanhar status',
        'Perfil pessoal'
      ]
    }
  };
  
  return configs[role] || configs.user;
};

export function RoleBasedDashboard() {
  const { profile, hasRole } = useAuth();
  
  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Carregando perfil do usuário...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleConfig = getRoleConfig(profile.role);
  const Icon = roleConfig.icon;

  // Supreme Admin vê o dashboard completo atual
  if (hasRole('supreme_admin')) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${roleConfig.color}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-heading">{roleConfig.title}</p>
                <p className="text-caption text-muted-foreground">{roleConfig.description}</p>
              </div>
              <Badge variant="destructive" className="ml-auto">Nível Máximo</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        <Dashboard />
      </div>
    );
  }

  // Manager vê dashboard simplificado
  if (hasRole('manager')) {
    return (
      <div className="space-y-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${roleConfig.color}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-heading">{roleConfig.title}</p>
                <p className="text-caption text-muted-foreground">{roleConfig.description}</p>
              </div>
              <Badge className="ml-auto">Gestão</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard do Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Visão gerencial dos projetos e equipes.
              </p>
              <div className="space-y-2">
                {roleConfig.permissions.map((permission, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    {permission}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Team Lead vê dashboard de equipe
  if (hasRole('team_lead')) {
    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${roleConfig.color}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-heading">{roleConfig.title}</p>
                <p className="text-caption text-muted-foreground">{roleConfig.description}</p>
              </div>
              <Badge variant="outline" className="ml-auto">Liderança</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard do Team Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Coordenação e acompanhamento de projetos da equipe.
              </p>
              <div className="space-y-2">
                {roleConfig.permissions.map((permission, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    {permission}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Usuário comum vê dashboard básico
  return (
    <div className="space-y-6">
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${roleConfig.color}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-heading">{roleConfig.title}</p>
              <p className="text-caption text-muted-foreground">{roleConfig.description}</p>
            </div>
            <Badge variant="secondary" className="ml-auto">Básico</Badge>
          </CardTitle>
        </CardHeader>
      </Card>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Seu Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Acompanhe seus projetos e atividades.
            </p>
            <div className="space-y-2">
              {roleConfig.permissions.map((permission, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  {permission}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
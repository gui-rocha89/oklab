import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Target, User } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';

const getRoleConfig = (role: UserRole) => {
  const configs = {
    supreme_admin: {
      label: 'Supreme Admin',
      icon: Shield,
      variant: 'destructive' as const,
      description: 'Acesso Total'
    },
    manager: {
      label: 'Manager',
      icon: Users,
      variant: 'default' as const,
      description: 'Gestão'
    },
    team_lead: {
      label: 'Team Lead',
      icon: Target,
      variant: 'secondary' as const,
      description: 'Liderança'
    },
    user: {
      label: 'Usuário',
      icon: User,
      variant: 'outline' as const,
      description: 'Básico'
    }
  };
  
  return configs[role] || configs.user;
};

interface UserRoleIndicatorProps {
  className?: string;
  showDescription?: boolean;
}

export function UserRoleIndicator({ className = '', showDescription = false }: UserRoleIndicatorProps) {
  const { profile } = useAuth();
  
  if (!profile?.role) {
    return null;
  }

  const config = getRoleConfig(profile.role);
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
      {showDescription && (
        <span className="text-caption text-muted-foreground">
          {config.description}
        </span>
      )}
    </div>
  );
}
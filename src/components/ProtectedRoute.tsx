import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  fallbackPath = '/auth' 
}: ProtectedRouteProps) {
  const { user, profile, loading, canAccess } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (requiredRoles.length > 0 && !canAccess(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-destructive/10 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Acesso Negado
            </h2>
            <p className="text-sm text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Seu nível: {profile?.role || 'Não definido'}
            </p>
            <p className="text-xs text-muted-foreground">
              Necessário: {requiredRoles.join(' ou ')}
            </p>
          </div>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
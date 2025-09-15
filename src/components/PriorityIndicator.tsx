import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Clock, Zap } from 'lucide-react';

interface PriorityIndicatorProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'badge' | 'dot' | 'icon';
}

export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({
  priority,
  size = 'md',
  showLabel = true,
  variant = 'badge'
}) => {
  const config = {
    low: {
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: '🟢',
      iconComponent: Clock,
      label: 'Baixa',
      description: 'Pode ser feito quando houver tempo disponível'
    },
    medium: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: '🟡',
      iconComponent: Clock,
      label: 'Média',
      description: 'Deve ser completado em breve'
    },
    high: {
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: '🔴',
      iconComponent: AlertTriangle,
      label: 'Alta',
      description: 'Requer atenção prioritária'
    },
    urgent: {
      color: 'bg-red-200 text-red-900 border-red-400 animate-pulse',
      icon: '⚠️',
      iconComponent: Zap,
      label: 'Urgente',
      description: 'Requer ação imediata!'
    }
  };

  const { color, icon, iconComponent: IconComponent, label, description } = config[priority];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  if (variant === 'dot') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className={`rounded-full ${color.split(' ')[0]} ${dotSizes[size]} flex items-center justify-center`}>
              <div className={`rounded-full bg-current w-full h-full opacity-80`} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">Prioridade {label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className={`flex items-center justify-center ${sizeClasses[size]} rounded-md ${color}`}>
              <IconComponent className={`${dotSizes[size]}`} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">Prioridade {label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default: badge variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge className={`${color} border transition-colors ${sizeClasses[size]} font-medium`}>
            <span className="flex items-center space-x-1">
              <span>{icon}</span>
              {showLabel && <span>{label}</span>}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">Prioridade {label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
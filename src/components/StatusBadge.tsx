import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkflowStatus = 
  | 'pending'
  | 'feedback-sent' 
  | 'feedback-resent'
  | 'feedback-received'
  | 'in-revision'
  | 'approved'
  | 'completed';

interface StatusConfig {
  label: string;
  color: string;
  icon: string;
  dot: string;
}

const statusConfig: Record<WorkflowStatus, StatusConfig> = {
  'pending': {
    label: 'Em Produção',
    color: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
    icon: '🔨',
    dot: 'bg-gray-500'
  },
  'feedback-sent': {
    label: 'Feedback Enviado',
    color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
    icon: '📤',
    dot: 'bg-blue-500'
  },
  'feedback-resent': {
    label: 'Feedback Reenviado',
    color: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
    icon: '🔄',
    dot: 'bg-purple-500'
  },
  'feedback-received': {
    label: 'Feedback Recebido',
    color: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
    icon: '📥',
    dot: 'bg-orange-500'
  },
  'in-revision': {
    label: 'Em Revisão',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
    icon: '👀',
    dot: 'bg-yellow-500'
  },
  'approved': {
    label: 'Aprovado',
    color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
    icon: '✅',
    dot: 'bg-green-500'
  },
  'completed': {
    label: 'Concluído',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200',
    icon: '🎉',
    dot: 'bg-emerald-500'
  }
};

interface StatusBadgeProps {
  currentStatus: string;
  onChange: (newStatus: WorkflowStatus) => void;
  disabled?: boolean;
}

export const StatusBadge = ({ currentStatus, onChange, disabled = false }: StatusBadgeProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Normalize status to WorkflowStatus or use default
  const normalizedStatus = (statusConfig[currentStatus as WorkflowStatus] 
    ? currentStatus 
    : 'pending') as WorkflowStatus;
  
  const config = statusConfig[normalizedStatus];

  const handleStatusChange = async (newStatus: WorkflowStatus) => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      await onChange(newStatus);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Badge
          className={cn(
            "cursor-pointer border transition-all duration-200 flex items-center gap-1.5 pr-1",
            config.color,
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="flex items-center gap-1">
            <span>{config.icon}</span>
            <span className="text-xs font-medium">{config.label}</span>
          </span>
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-52 bg-popover border shadow-lg z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {Object.entries(statusConfig).map(([status, config]) => (
          <DropdownMenuItem
            key={status}
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(status as WorkflowStatus);
            }}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              status === normalizedStatus && "bg-accent"
            )}
          >
            <span className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", config.dot)} />
              <span>{config.icon}</span>
              <span className="text-sm">{config.label}</span>
            </span>
            {status === normalizedStatus && (
              <span className="text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { statusConfig };
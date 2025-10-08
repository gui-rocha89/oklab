import { CheckCircle, AlertCircle, Clock, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useReview } from '@/stores/reviewStore';
import { useState } from 'react';
import type { ReviewAsset } from '@/types/review';

interface ReviewActionsProps {
  assetId: string;
  currentStatus: ReviewAsset['status'];
  shareToken?: string;
}

const statusConfig = {
  in_review: {
    label: 'Em Revisão',
    variant: 'default' as const,
    icon: Clock,
  },
  changes_requested: {
    label: 'Ajustes Solicitados',
    variant: 'warning' as const,
    icon: AlertCircle,
  },
  approved: {
    label: 'Aprovado',
    variant: 'success' as const,
    icon: CheckCircle,
  },
};

export const ReviewActions = ({ assetId, currentStatus, shareToken }: ReviewActionsProps) => {
  const { setStatus, generateShareToken, isLoading } = useReview();
  const [copied, setCopied] = useState(false);
  
  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;

  const handleApprove = async () => {
    await setStatus('approved');
    toast({
      title: 'Projeto aprovado!',
      description: 'O cliente foi notificado da aprovação.',
    });
  };

  const handleRequestChanges = async () => {
    await setStatus('changes_requested');
    toast({
      title: 'Ajustes solicitados',
      description: 'O cliente receberá as solicitações de mudança.',
      variant: 'default',
    });
  };

  const handleCopyLink = async () => {
    try {
      const token = shareToken || await generateShareToken();
      if (!token) {
        toast({
          title: 'Erro',
          description: 'Não foi possível gerar o link de compartilhamento.',
          variant: 'destructive',
        });
        return;
      }

      const link = `${window.location.origin}/review/${token}`;
      await navigator.clipboard.writeText(link);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: 'Link copiado!',
        description: 'O link de revisão foi copiado para a área de transferência.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="border-b bg-background p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Status da Revisão</h2>
          <Badge variant={config.variant} className="flex items-center gap-1.5">
            <StatusIcon className="h-3.5 w-3.5" />
            {config.label}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleApprove}
          disabled={isLoading || currentStatus === 'approved'}
          variant="default"
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Aprovar
        </Button>

        <Button
          onClick={handleRequestChanges}
          disabled={isLoading || currentStatus === 'changes_requested'}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Solicitar Ajustes
        </Button>

        <Button
          onClick={handleCopyLink}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2 ml-auto"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copiar Link
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

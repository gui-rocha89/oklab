import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar,
  MessageSquare,
  Instagram,
  Heart,
  MessageCircle as MessageCircleIcon,
  Send,
  Bookmark,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramPost } from './InstagramPost';
import { InstagramCarousel } from './InstagramCarousel';
import { PriorityIndicator } from './PriorityIndicator';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Attachment {
  name: string;
  url?: string;
}

interface CreativeApproval {
  id?: string;
  caption?: string;
  publish_date?: string;
  status: 'pending' | 'approved' | 'changes_requested';
  feedback?: string;
}

interface CreativeApprovalCardProps {
  keyframeId: string;
  attachments: Attachment[];
  creativoTitle: string;
  approval?: CreativeApproval;
  onApprovalUpdate: (approval: CreativeApproval) => void;
  profileName?: string;
}

export const CreativeApprovalCard: React.FC<CreativeApprovalCardProps> = ({
  keyframeId,
  attachments,
  creativoTitle,
  approval,
  onApprovalUpdate,
  profileName = "oklab_oficial"
}) => {
  const [feedback, setFeedback] = useState(approval?.feedback || '');
  const [submitting, setSubmitting] = useState(false);

  const handleAction = async (action: 'approved' | 'changes_requested') => {
    if (action === 'changes_requested' && !feedback.trim()) {
      toast.error("Por favor, descreva as alterações desejadas.");
      return;
    }

    setSubmitting(true);
    
    try {
      const approvalData = {
        keyframe_id: keyframeId,
        attachment_index: 0, // Always 0 since we treat entire keyframe as one creative
        status: action,
        feedback: feedback.trim() || null
      };

      const { data, error } = await supabase
        .from('creative_approvals')
        .upsert(approvalData, { 
          onConflict: 'keyframe_id,attachment_index'
        })
        .select()
        .single();

      if (error) throw error;

      const updatedApproval: CreativeApproval = {
        id: data.id,
        caption: data.caption,
        publish_date: data.publish_date,
        status: data.status as 'pending' | 'approved' | 'changes_requested',
        feedback: data.feedback
      };

      onApprovalUpdate(updatedApproval);

      toast.success(action === 'approved' ? "✅ Criativo Aprovado!" : "📝 Feedback Enviado!");

    } catch (error) {
      console.error('Error updating approval:', error);
      toast.error("Erro ao processar ação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = () => {
    switch (approval?.status) {
      case 'approved':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Aprovado',
          variant: 'default' as const
        };
      case 'changes_requested':
        return {
          icon: AlertCircle,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          label: 'Alterações Solicitadas',
          variant: 'secondary' as const
        };
      default:
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Pendente',
          variant: 'outline' as const
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Dados mocados para demonstração visual
  const mockCaption = `🎯 Conteúdo incrível chegando! ✨
  
Prepare-se para uma experiência única com nossa nova campanha. 
  
#oklab #marketing #criatividade #conteudo #instagram`;

  const mockPublishDate = new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000);
  const formattedDate = format(mockPublishDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const formattedTime = format(mockPublishDate, "HH:mm", { locale: ptBR });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className={`shadow-card border-2 transition-all duration-300 ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bgColor}`}>
                <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">
                  {creativoTitle}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {attachments.length === 1 ? '1 imagem' : `${attachments.length} imagens (carrossel)`}
                </p>
              </div>
            </div>
            <Badge variant={statusConfig.variant}>
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Instagram Preview */}
          <div className="bg-background rounded-lg p-4 border border-border">
            <div className="max-w-md mx-auto">
              {/* Instagram Header */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 via-purple-500 to-yellow-500 rounded-full p-0.5">
                    <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center text-xs font-bold text-white">
                        OK
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{profileName}</p>
                    <p className="text-xs text-muted-foreground">Patrocinado</p>
                  </div>
                </div>
                <MoreHorizontal className="w-6 h-6 text-muted-foreground cursor-pointer" />
              </div>

              {/* Instagram Image or Carousel */}
              <div className="aspect-square bg-muted flex items-center justify-center rounded-lg overflow-hidden">
                {attachments.length > 1 ? (
                  <InstagramCarousel attachments={attachments} />
                ) : (
                  <>
                    {attachments[0]?.url ? (
                      <img 
                        src={attachments[0].url} 
                        alt={attachments[0].name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                          <span className="text-2xl font-bold text-primary">OK</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{attachments[0]?.name}</p>
                          <p className="text-xs text-muted-foreground">Preview do Post</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Instagram Actions */}
              <div className="px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-4">
                    <Heart className="w-6 h-6 text-foreground cursor-pointer hover:text-red-500 transition-colors" />
                    <MessageCircleIcon className="w-6 h-6 text-foreground cursor-pointer hover:text-muted-foreground transition-colors" />
                    <Send className="w-6 h-6 text-foreground cursor-pointer hover:text-muted-foreground transition-colors" />
                  </div>
                  <Bookmark className="w-6 h-6 text-foreground cursor-pointer hover:text-muted-foreground transition-colors" />
                </div>

                <p className="font-semibold text-sm text-foreground mb-1">0 curtidas</p>

                {/* Caption */}
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-semibold text-foreground">{profileName}</span>{' '}
                    <span className="text-foreground whitespace-pre-line">{mockCaption}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Publishing Schedule */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-foreground">Cronograma de Publicação</h4>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                <span className="font-medium">Data:</span> {formattedDate}
              </p>
              <p className="text-sm text-foreground">
                <span className="font-medium">Horário sugerido:</span> {formattedTime}
              </p>
              <p className="text-sm text-muted-foreground">
                📱 Instagram Feed • 📊 Melhor horário para engajamento
              </p>
            </div>
          </div>

          {/* Feedback Section - Only show when status is changes_requested or when rejecting */}
          {(approval?.status === 'changes_requested' || (!approval || approval.status === 'pending')) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium text-foreground">
                  Feedback (opcional para aprovação, obrigatório para alterações)
                </label>
              </div>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Descreva suas observações ou sugestões para este criativo..."
                className="min-h-[100px] resize-none"
              />
            </div>
          )}

          {/* Existing Feedback */}
          {approval?.feedback && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Feedback Anterior</span>
              </div>
              <p className="text-sm text-amber-700">{approval.feedback}</p>
            </div>
          )}

          {/* Action Buttons */}
          {approval?.status !== 'approved' && (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => handleAction('approved')}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {submitting ? 'Aprovando...' : 'Aprovar este Criativo'}
              </Button>
              <Button
                onClick={() => handleAction('changes_requested')}
                disabled={submitting}
                variant="outline"
                className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {submitting ? 'Enviando...' : 'Solicitar Alteração'}
              </Button>
            </div>
          )}

          {/* Approved Message */}
          {approval?.status === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">
                Este criativo foi aprovado e está pronto para publicação!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

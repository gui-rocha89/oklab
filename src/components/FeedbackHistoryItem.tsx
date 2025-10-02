import React from 'react';
import { MessageSquare, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FeedbackHistoryItemProps {
  feedback: {
    id: string;
    comment: string;
    team_response: string | null;
    keyframe_title: string;
    created_at: string;
  };
  formatTime: (timestamp: string) => string;
}

export function FeedbackHistoryItem({ feedback, formatTime }: FeedbackHistoryItemProps) {
  return (
    <Card className="p-3 bg-muted/30 border-border/50">
      <div className="space-y-3">
        {/* Header com timestamp e status */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            📌 {formatTime(feedback.created_at)}
          </span>
          <Badge variant="secondary" className="text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Resolvido
          </Badge>
        </div>

        {/* Comentário do Cliente */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">Cliente solicitou:</span>
          </div>
          <p className="text-sm text-foreground/90 pl-5 leading-relaxed">
            {feedback.comment}
          </p>
        </div>

        {/* Resposta da Equipe */}
        {feedback.team_response && (
          <div className="space-y-1.5 pt-2 border-t border-border/30">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-semibold text-foreground">Equipe respondeu:</span>
            </div>
            <p className="text-sm text-foreground/80 pl-5 leading-relaxed italic">
              {feedback.team_response}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

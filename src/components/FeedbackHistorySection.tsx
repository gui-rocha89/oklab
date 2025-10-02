import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, CheckCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FeedbackItem {
  id: string;
  comment: string;
  team_response: string | null;
  created_at: string;
  attachments?: any[];
}

interface HistoricalKeyframe {
  id: string;
  title: string;
  project_feedback: FeedbackItem[];
}

interface FeedbackHistorySectionProps {
  keyframes: HistoricalKeyframe[];
  roundNumber: number;
  formatTime: (seconds: number) => string;
}

export function FeedbackHistorySection({ 
  keyframes, 
  roundNumber,
  formatTime 
}: FeedbackHistorySectionProps) {
  if (keyframes.length === 0) return null;

  const totalResolvedFeedbacks = keyframes.reduce(
    (sum, kf) => sum + kf.project_feedback.length, 
    0
  );

  return (
    <Card className="mb-6 overflow-hidden">
      <Accordion type="single" collapsible defaultValue="history">
        <AccordionItem value="history" className="border-none">
          <AccordionTrigger className="px-6 py-4 bg-muted/30 hover:bg-muted/50 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div className="text-left">
                  <h3 className="text-base font-semibold">
                    📋 Histórico de Correções - Rodada {roundNumber}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {totalResolvedFeedbacks} {totalResolvedFeedbacks === 1 ? 'ajuste concluído' : 'ajustes concluídos'}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                Concluída
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-4">
            <div className="space-y-4">
              {keyframes.map((keyframe) => (
                <Card key={keyframe.id} className="p-4 bg-muted/20 border-border/50">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <span className="text-primary">⏱️</span>
                    {keyframe.title}
                  </h4>
                  
                  <div className="space-y-3">
                    {keyframe.project_feedback.map((feedback) => (
                      <div key={feedback.id} className="space-y-2.5 pl-4 border-l-2 border-border/30">
                        {/* Comentário do Cliente */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-semibold text-foreground">
                              Cliente solicitou:
                            </span>
                          </div>
                          <p className="text-sm text-foreground/90 pl-5 leading-relaxed">
                            {feedback.comment}
                          </p>
                          {feedback.attachments && feedback.attachments.length > 0 && (
                            <div className="pl-5 pt-1">
                              <p className="text-xs text-muted-foreground">
                                📎 {feedback.attachments.length} {feedback.attachments.length === 1 ? 'anexo' : 'anexos'}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Resposta da Equipe */}
                        {feedback.team_response && (
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              <span className="text-xs font-semibold text-foreground">
                                Equipe respondeu:
                              </span>
                            </div>
                            <p className="text-sm text-foreground/80 pl-5 leading-relaxed italic">
                              {feedback.team_response}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

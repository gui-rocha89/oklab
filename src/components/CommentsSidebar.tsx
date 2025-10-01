import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Pencil, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Keyframe {
  id: string;
  time: number;
  comment: string;
  created_at?: string;
}

interface Annotation {
  id: string;
  timestamp_ms: number;
  comment?: string;
  screenshot_url?: string;
}

interface CommentsSidebarProps {
  keyframes: Keyframe[];
  annotations: Annotation[];
  currentTime: number;
  onSeekToTime: (time: number) => void;
  onLoadAnnotation: (annotationId: string) => void;
  formatTime: (seconds: number) => string;
}

export function CommentsSidebar({
  keyframes,
  annotations,
  currentTime,
  onSeekToTime,
  onLoadAnnotation,
  formatTime
}: CommentsSidebarProps) {
  const totalComments = keyframes.filter(k => k.comment.trim()).length + annotations.length;

  return (
    <Card className="h-full flex flex-col">
      {/* Header fixo */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Comentários</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {totalComments}
          </Badge>
        </div>
      </div>

      {/* Área de scroll para comentários */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Comentários de Texto (Keyframes) */}
          {keyframes.filter(k => k.comment.trim()).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <span>Comentários de Texto</span>
              </div>
              
              {keyframes
                .filter(k => k.comment.trim())
                .sort((a, b) => a.time - b.time)
                .map((keyframe) => {
                  const isActive = Math.abs(currentTime - keyframe.time) < 0.5;
                  
                  return (
                    <motion.div
                      key={keyframe.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        p-3 rounded-lg border transition-all cursor-pointer
                        ${isActive 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }
                      `}
                      onClick={() => onSeekToTime(keyframe.time)}
                    >
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-semibold text-primary">
                              {formatTime(keyframe.time)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground break-words">
                            {keyframe.comment}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}

          {/* Anotações Visuais */}
          {annotations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Pencil className="w-4 h-4" />
                <span>Anotações Visuais</span>
              </div>
              
              {annotations
                .sort((a, b) => a.timestamp_ms - b.timestamp_ms)
                .map((annotation, index) => {
                  const isActive = Math.abs(currentTime - annotation.timestamp_ms / 1000) < 0.5;
                  
                  return (
                    <motion.div
                      key={annotation.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        p-3 rounded-lg border transition-all cursor-pointer
                        ${isActive 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }
                      `}
                      onClick={() => {
                        onSeekToTime(annotation.timestamp_ms / 1000);
                        onLoadAnnotation(annotation.id);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {annotation.screenshot_url && (
                          <div className="w-16 h-12 shrink-0 rounded overflow-hidden bg-muted">
                            <img 
                              src={annotation.screenshot_url} 
                              alt="Thumbnail da anotação"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="font-mono text-xs font-semibold text-primary">
                              {formatTime(annotation.timestamp_ms / 1000)}
                            </span>
                          </div>
                          {annotation.comment && (
                            <p className="text-sm text-foreground break-words">
                              {annotation.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}

          {/* Empty State */}
          {totalComments === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum comentário ainda
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Adicione comentários ou anotações visuais durante a revisão
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

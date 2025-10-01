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
    <>
      {/* Header fixo */}
      <div className="px-4 pt-4 pb-3 border-b bg-card/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Comentários ({totalComments})</h3>
        </div>
      </div>

      {/* Área de scroll para comentários */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Comentários de Texto (Keyframes) */}
          {keyframes.filter(k => k.comment.trim()).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
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
                        p-2 rounded-md border transition-all cursor-pointer
                        ${isActive 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }
                      `}
                      onClick={() => onSeekToTime(keyframe.time)}
                    >
                      <div className="flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[10px] font-semibold text-primary">
                              {formatTime(keyframe.time)}
                            </span>
                          </div>
                          <p className="text-xs text-foreground break-words leading-snug">
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
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Pencil className="w-3.5 h-3.5 text-primary" />
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
                        p-2 rounded-md border transition-all cursor-pointer
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
                      <div className="flex items-start gap-2">
                        {annotation.screenshot_url && (
                          <div className="w-14 h-10 shrink-0 rounded overflow-hidden bg-muted">
                            <img 
                              src={annotation.screenshot_url} 
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span className="font-mono text-[10px] font-semibold text-primary">
                              {formatTime(annotation.timestamp_ms / 1000)}
                            </span>
                          </div>
                          {annotation.comment && (
                            <p className="text-xs text-foreground break-words leading-snug">
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
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">
                Nenhum comentário ainda
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                Adicione comentários ou anotações
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

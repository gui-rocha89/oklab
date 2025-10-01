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
      {/* Timeline Header - Frame.io Style */}
      <div className="px-3 pt-3 pb-2.5 border-b border-border bg-muted/10">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Timeline
          {totalComments > 0 && (
            <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {totalComments}
            </span>
          )}
        </h3>
      </div>

      {/* Timeline Items - Scrollable */}
      <ScrollArea className="flex-1">
        <div className="p-2.5 space-y-2">
          {/* Text Comments Timeline */}
          {keyframes.filter(k => k.comment.trim()).length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium text-muted-foreground px-1 mb-1 flex items-center gap-1.5">
                <div className="h-0.5 w-3 bg-primary rounded-full"></div>
                Comentários
              </h4>
              
              {keyframes
                .filter(k => k.comment.trim())
                .sort((a, b) => a.time - b.time)
                .map((keyframe) => {
                  const isActive = Math.abs(currentTime - keyframe.time) < 0.5;
                  
                  return (
                    <motion.div
                      key={keyframe.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => onSeekToTime(keyframe.time)}
                      className={`
                        p-2 rounded-md border cursor-pointer transition-all duration-200
                        ${isActive 
                          ? 'bg-primary/10 border-primary/50 shadow-sm' 
                          : 'bg-card border-border/50 hover:bg-muted/30 hover:border-primary/30'
                        }
                      `}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`p-1 rounded-md shrink-0 ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                          <MessageSquare className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-mono font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                              {formatTime(keyframe.time)}
                            </span>
                            {isActive && (
                              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                                ATUAL
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {keyframe.comment}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}

          {/* Visual Annotations Timeline */}
          {annotations.length > 0 && (
            <div className="space-y-1.5 mt-3">
              <h4 className="text-xs font-medium text-muted-foreground px-1 mb-1 flex items-center gap-1.5">
                <div className="h-0.5 w-3 bg-primary rounded-full"></div>
                Anotações Visuais
              </h4>
              
              {annotations
                .sort((a, b) => a.timestamp_ms - b.timestamp_ms)
                .map((annotation, index) => {
                  const isActive = Math.abs(currentTime - annotation.timestamp_ms / 1000) < 0.5;
                  
                  return (
                    <motion.div
                      key={annotation.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => {
                        onSeekToTime(annotation.timestamp_ms / 1000);
                        onLoadAnnotation(annotation.id);
                      }}
                      className={`
                        p-2 rounded-md border cursor-pointer transition-all duration-200
                        ${isActive 
                          ? 'bg-primary/10 border-primary/50 shadow-sm' 
                          : 'bg-card border-border/50 hover:bg-muted/30 hover:border-primary/30'
                        }
                      `}
                    >
                      <div className="flex items-start gap-2">
                        {annotation.screenshot_url && (
                          <div className="w-12 h-9 shrink-0 rounded overflow-hidden bg-muted">
                            <img 
                              src={annotation.screenshot_url} 
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-mono font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                              {formatTime(annotation.timestamp_ms / 1000)}
                            </span>
                            {isActive && (
                              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                                ATUAL
                              </span>
                            )}
                          </div>
                          {annotation.comment && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
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
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/20 mb-1.5" />
              <p className="text-xs text-muted-foreground">
                Nenhum comentário
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Adicione comentários ou anotações
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

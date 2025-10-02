import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

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
  onUpdateKeyframe: (id: string, comment: string) => void;
  onDeleteKeyframe: (id: string) => void;
  onUpdateAnnotation: (id: string, comment: string) => void;
  onDeleteAnnotation: (id: string) => void;
  formatTime: (seconds: number) => string;
}

export function CommentsSidebar({
  keyframes,
  annotations,
  currentTime,
  onSeekToTime,
  onLoadAnnotation,
  onUpdateKeyframe,
  onDeleteKeyframe,
  onUpdateAnnotation,
  onDeleteAnnotation,
  formatTime
}: CommentsSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingType, setEditingType] = useState<'keyframe' | 'annotation' | null>(null);
  
  // Show ALL keyframes including empty ones + annotations
  const totalComments = keyframes.length + annotations.length;
  
  // Auto-open edit mode for newly created empty keyframes
  useEffect(() => {
    const emptyKeyframe = keyframes.find(k => !k.comment.trim() && !editingId);
    if (emptyKeyframe) {
      setEditingId(emptyKeyframe.id);
      setEditingText('');
      setEditingType('keyframe');
    }
  }, [keyframes, editingId]);

  const startEditing = (id: string, currentText: string, type: 'keyframe' | 'annotation') => {
    setEditingId(id);
    setEditingText(currentText);
    setEditingType(type);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
    setEditingType(null);
  };

  const saveEditing = () => {
    if (!editingId || !editingType) return;
    
    if (editingType === 'keyframe') {
      onUpdateKeyframe(editingId, editingText);
    } else {
      onUpdateAnnotation(editingId, editingText);
    }
    
    cancelEditing();
  };

  return (
    <>
      {/* Timeline Header - Frame.io Style */}
      <div className="px-3 pt-3 pb-2.5 border-b border-border bg-muted/10">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Feedback
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
          {/* All Feedback Items - Unified */}
          {totalComments > 0 && (
            <div className="space-y-1.5">
              {/* Merge ALL keyframes (including empty) and annotations, sort by time */}
              {[
                ...keyframes.map(k => ({ ...k, type: 'keyframe' as const })),
                ...annotations.map(a => ({ ...a, type: 'annotation' as const, time: a.timestamp_ms / 1000 }))
              ]
                .sort((a, b) => a.time - b.time)
                .map((item) => {
                  const isActive = Math.abs(currentTime - item.time) < 0.5;
                  const isEditing = editingId === item.id;
                  const isKeyframe = item.type === 'keyframe';
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`
                        p-2 rounded-md border transition-all duration-200
                        ${isActive 
                          ? 'bg-primary/10 border-primary/50 shadow-sm' 
                          : 'bg-card border-border/50 hover:bg-muted/30'
                        }
                      `}
                    >
                      <div className="flex items-start gap-2">
                        {/* Icon or Thumbnail */}
                        {isKeyframe ? (
                          <div className={`p-1 rounded-md shrink-0 ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                            <MessageSquare className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                        ) : (
                          'screenshot_url' in item && item.screenshot_url && (
                            <div className="w-12 h-9 shrink-0 rounded overflow-hidden bg-muted">
                              <img 
                                src={item.screenshot_url} 
                                alt="Thumbnail"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )
                        )}
                        
                        <div className="flex-1 min-w-0">
                          {/* Time and Status */}
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              onClick={() => {
                                onSeekToTime(item.time);
                                if (!isKeyframe) {
                                  onLoadAnnotation(item.id);
                                }
                              }}
                              className={`text-xs font-mono font-semibold hover:underline ${isActive ? 'text-primary' : 'text-foreground'}`}
                            >
                              {formatTime(item.time)}
                            </button>
                            {isActive && (
                              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                                ATUAL
                              </span>
                            )}
                          </div>
                          
                          {/* Comment - Editable */}
                          {isEditing ? (
                            <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                              <Textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="min-h-[60px] text-xs"
                                placeholder="Adicione seu comentário..."
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    saveEditing();
                                  }
                                }}
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7 text-xs"
                                  onClick={saveEditing}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Salvar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs"
                                  onClick={cancelEditing}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className={`text-xs leading-relaxed mb-1.5 ${
                                isKeyframe && !item.comment.trim() 
                                  ? 'text-muted-foreground/50 italic' 
                                  : 'text-muted-foreground'
                              }`}>
                                {isKeyframe 
                                  ? (item.comment.trim() || 'Clique em Editar para adicionar comentário')
                                  : ('comment' in item ? item.comment : 'Anotação visual')
                                }
                              </p>
                              
                              {/* Action Buttons */}
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs hover:bg-primary/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(
                                      item.id, 
                                      isKeyframe ? item.comment : ('comment' in item ? item.comment || '' : ''),
                                      item.type
                                    );
                                  }}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Deseja realmente excluir este feedback?')) {
                                      if (isKeyframe) {
                                        onDeleteKeyframe(item.id);
                                      } else {
                                        onDeleteAnnotation(item.id);
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Excluir
                                </Button>
                              </div>
                            </>
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
                Nenhum feedback adicionado
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Use o botão + ou desenhe no vídeo
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Pencil, Trash2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { AttachmentUploader } from '@/components/AttachmentUploader';
import { AttachmentList } from '@/components/AttachmentList';
import { Attachment } from '@/lib/attachmentUtils';
import { Separator } from '@/components/ui/separator';
import { FeedbackHistoryItem } from '@/components/FeedbackHistoryItem';
import { Badge } from '@/components/ui/badge';
import type { Thread } from '@/types/review';
import { useThreadNavigation } from '@/hooks/useThreadNavigation';

interface Keyframe {
  id: string;
  time: number;
  comment: string;
  attachments?: Attachment[];
  created_at?: string;
  x?: number;
  y?: number;
  pinNumber?: number;
}

interface Annotation {
  id: string;
  timestamp_ms: number;
  comment?: string;
  attachments?: Attachment[];
  screenshot_url?: string;
}

interface FeedbackHistory {
  id: string;
  comment: string;
  team_response: string | null;
  keyframe_title: string;
  created_at: string;
}

interface CommentsSidebarProps {
  keyframes: Keyframe[];
  annotations: Annotation[];
  feedbackHistory?: FeedbackHistory[];
  threads?: Thread[];
  selectedThreadId?: string;
  currentTime: number;
  onSeekToTime: (time: number) => void;
  onLoadAnnotation: (annotationId: string) => void;
  onUpdateKeyframe: (id: string, comment: string, attachments?: Attachment[]) => void;
  onDeleteKeyframe: (id: string) => void;
  onUpdateAnnotation: (id: string, comment: string, attachments?: Attachment[]) => void;
  onDeleteAnnotation: (id: string) => void;
  onSelectThread?: (threadId: string) => void;
  onSeekToThread?: (time: number) => void;
  formatTime: (seconds: number) => string;
}

export function CommentsSidebar({
  keyframes,
  annotations,
  feedbackHistory = [],
  threads = [],
  selectedThreadId,
  currentTime,
  onSeekToTime,
  onLoadAnnotation,
  onUpdateKeyframe,
  onDeleteKeyframe,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onSelectThread,
  onSeekToThread,
  formatTime
}: CommentsSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingType, setEditingType] = useState<'keyframe' | 'annotation' | null>(null);
  const [editingAttachments, setEditingAttachments] = useState<Attachment[]>([]);
  const [threadFilter, setThreadFilter] = useState<'all' | 'open' | 'resolved'>('all');
  
  // Filter threads based on state
  const filteredThreads = threads.filter(t => {
    if (threadFilter === 'all') return true;
    if (threadFilter === 'open') return t.state === 'open';
    if (threadFilter === 'resolved') return t.state === 'resolved';
    return true;
  });
  
  // Thread navigation
  const navigation = threads.length > 0 && onSelectThread && onSeekToThread ? useThreadNavigation({
    threads: filteredThreads,
    selectedThreadId: selectedThreadId || '',
    onSelectThread: onSelectThread,
    onSeekToThread: onSeekToThread
  }) : null;
  
  // Keyboard shortcuts for navigation
  useEffect(() => {
    if (!navigation) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'j') {
        navigation.goToPrevious();
      } else if (e.key.toLowerCase() === 'k') {
        navigation.goToNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigation]);
  
  // Show ALL keyframes including empty ones + annotations
  const totalComments = keyframes.length + annotations.length + threads.length;
  
  // Auto-open edit mode for newly created empty keyframes
  useEffect(() => {
    const emptyKeyframe = keyframes.find(k => !k.comment.trim() && !editingId);
    if (emptyKeyframe) {
      setEditingId(emptyKeyframe.id);
      setEditingText('');
      setEditingType('keyframe');
    }
  }, [keyframes, editingId]);

  const startEditing = (id: string, currentText: string, type: 'keyframe' | 'annotation', currentAttachments?: Attachment[]) => {
    setEditingId(id);
    setEditingText(currentText);
    setEditingType(type);
    setEditingAttachments(currentAttachments || []);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
    setEditingType(null);
    setEditingAttachments([]);
  };

  const saveEditing = () => {
    if (!editingId || !editingType) return;
    
    if (editingType === 'keyframe') {
      onUpdateKeyframe(editingId, editingText, editingAttachments);
    } else {
      onUpdateAnnotation(editingId, editingText, editingAttachments);
    }
    
    cancelEditing();
  };

  return (
    <>
      {/* Timeline Header - Frame.io Style */}
      <div className="px-3 pt-3 pb-2.5 border-b border-border bg-muted/10">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-primary" />
          Feedback
          {totalComments > 0 && (
            <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {totalComments}
            </span>
          )}
        </h3>
        
        {/* Thread Navigation & Filters */}
        {threads.length > 0 && (
          <div className="space-y-2">
            {/* Navigation Buttons */}
            {navigation && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={navigation.goToPrevious}
                    disabled={!navigation.hasPrevious}
                    className="h-7 px-2 text-xs"
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={navigation.goToNext}
                    disabled={!navigation.hasNext}
                    className="h-7 px-2 text-xs"
                  >
                    Próximo
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">
                  {navigation.currentIndex >= 0 ? navigation.currentIndex + 1 : 0}/{navigation.totalThreads}
                </span>
              </div>
            )}
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={threadFilter === 'all' ? 'default' : 'ghost'}
                onClick={() => setThreadFilter('all')}
                className="h-7 px-2.5 text-xs flex-1"
              >
                Todos ({threads.length})
              </Button>
              <Button
                size="sm"
                variant={threadFilter === 'open' ? 'default' : 'ghost'}
                onClick={() => setThreadFilter('open')}
                className="h-7 px-2.5 text-xs flex-1"
              >
                Aberto ({threads.filter(t => t.state === 'open').length})
              </Button>
              <Button
                size="sm"
                variant={threadFilter === 'resolved' ? 'default' : 'ghost'}
                onClick={() => setThreadFilter('resolved')}
                className="h-7 px-2.5 text-xs flex-1"
              >
                Resolvido ({threads.filter(t => t.state === 'resolved').length})
              </Button>
            </div>
            
            <p className="text-[10px] text-muted-foreground text-center">
              Use <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">J</kbd> e <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">K</kbd> para navegar
            </p>
          </div>
        )}
      </div>

      {/* Timeline Items - Scrollable */}
      <ScrollArea className="flex-1">
        <div className="p-2.5 space-y-2">
          {/* Histórico de Correções Anteriores (Imutável) */}
          {feedbackHistory.length > 0 && (
            <div className="mb-4">
              <div className="px-2 py-2 bg-muted/30 border-b border-border rounded-t-md">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  📋 Correções Anteriores
                </h4>
              </div>
              <div className="space-y-2 pt-2">
                {feedbackHistory.map(feedback => (
                  <FeedbackHistoryItem 
                    key={feedback.id}
                    feedback={feedback}
                    formatTime={(timestamp) => {
                      const date = new Date(timestamp);
                      return date.toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Separador entre histórico e novos feedbacks */}
          {feedbackHistory.length > 0 && totalComments > 0 && (
            <div className="py-2">
              <Separator className="my-2" />
              <div className="px-2 py-2 bg-primary/5 border-b border-primary/20 rounded-t-md">
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">
                  🆕 Novos Feedbacks
                </h4>
              </div>
            </div>
          )}

          {/* Threads Section */}
          {filteredThreads.length > 0 && (
            <div className="mb-4">
              <div className="px-2 py-2 bg-primary/5 border-b border-primary/20 rounded-t-md mb-2">
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">
                  📌 Anotações Visuais
                </h4>
              </div>
              <div className="space-y-1.5">
                {filteredThreads.map(thread => {
                  const isSelected = selectedThreadId === thread.id;
                  
                  return (
                    <motion.div
                      key={thread.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => {
                        if (onSelectThread && onSeekToThread) {
                          onSelectThread(thread.id);
                          onSeekToThread(thread.tStart);
                        }
                      }}
                      className={`
                        p-2 rounded-md border transition-all duration-200 cursor-pointer
                        ${isSelected 
                          ? 'bg-primary/10 border-primary/50 shadow-sm ring-2 ring-primary/20' 
                          : 'bg-card border-border/50 hover:bg-muted/50 hover:border-border'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Chip Number */}
                        <div className="w-8 h-8 shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                            isSelected 
                              ? 'bg-primary text-white border-primary' 
                              : 'bg-muted text-foreground border-border'
                          }`}>
                            {thread.chip}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Time Range */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-mono font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {formatTime(thread.tStart)}
                              {thread.tEnd && ` - ${formatTime(thread.tEnd)}`}
                            </span>
                            <Badge 
                              variant={thread.state === 'resolved' ? 'secondary' : 'default'}
                              className="text-[10px] h-4 px-1.5"
                            >
                              {thread.state === 'resolved' ? 'Resolvido' : 'Aberto'}
                            </Badge>
                          </div>
                          
                          {/* First Comment Preview */}
                          {thread.comments.length > 0 ? (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {thread.comments[0].body}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground/50 italic">
                              Clique para adicionar comentário
                            </p>
                          )}
                          
                          {/* Comment Count */}
                          {thread.comments.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">
                                {thread.comments.length} {thread.comments.length === 1 ? 'comentário' : 'comentários'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* All Feedback Items - Unified */}
          {(keyframes.length > 0 || annotations.length > 0) && (
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
                      id={`keyframe-${item.id}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => {
                        onSeekToTime(item.time);
                        if (!isKeyframe) {
                          onLoadAnnotation(item.id);
                        }
                      }}
                      className={`
                        p-2 rounded-md border transition-all duration-200 cursor-pointer
                        ${isActive 
                          ? 'bg-primary/10 border-primary/50 shadow-sm' 
                          : 'bg-card border-border/50 hover:bg-muted/50 hover:border-border'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon or Thumbnail - Fixed Width Container */}
                        <div className="w-12 h-9 shrink-0 flex items-center justify-center">
                          {isKeyframe ? (
                            'pinNumber' in item && item.pinNumber ? (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                                isActive 
                                  ? 'bg-primary text-white border-primary' 
                                  : 'bg-muted text-foreground border-border'
                              }`}>
                                {item.pinNumber}
                              </div>
                            ) : (
                              <div className={`p-2 rounded-md ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                                <MessageSquare className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                              </div>
                            )
                          ) : (
                            'screenshot_url' in item && item.screenshot_url && (
                              <div className="w-12 h-9 rounded overflow-hidden bg-muted">
                                <img 
                                  src={item.screenshot_url} 
                                  alt="Thumbnail"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                          {/* Time and Status */}
                          <div className="flex items-center gap-2 min-h-[22px]">
                            <span className={`text-xs font-mono font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                              {formatTime(item.time)}
                            </span>
                            {isActive && (
                              <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                                ATUAL
                              </span>
                            )}
                          </div>
                          
                          {/* Comment - Editable */}
                          {isEditing ? (
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
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
                              
                              <AttachmentUploader
                                attachments={editingAttachments}
                                onAttachmentsChange={setEditingAttachments}
                              />
                              
                              <div className="flex items-center gap-2">
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
                              <p className={`text-xs leading-relaxed ${
                                isKeyframe && !item.comment.trim() 
                                  ? 'text-muted-foreground/50 italic' 
                                  : 'text-muted-foreground'
                              }`}>
                                {isKeyframe 
                                  ? (item.comment.trim() || 'Clique em Editar para adicionar comentário')
                                  : ('comment' in item ? item.comment : 'Anotação visual')
                                }
                              </p>
                              
                              {/* Attachments */}
                              {'attachments' in item && item.attachments && item.attachments.length > 0 && (
                                <div className="mt-2">
                                  <AttachmentList
                                    attachments={item.attachments}
                                    editable={false}
                                  />
                                </div>
                              )}
                              
                              {/* Action Buttons */}
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2.5 text-xs hover:bg-primary/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(
                                      item.id, 
                                      isKeyframe ? item.comment : ('comment' in item ? item.comment || '' : ''),
                                      item.type,
                                      'attachments' in item ? item.attachments : undefined
                                    );
                                  }}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2.5 text-xs hover:bg-destructive/10 hover:text-destructive"
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
                Use o botão + para comentar no tempo atual.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

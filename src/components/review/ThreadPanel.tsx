import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MessageSquare, CheckCircle, Circle, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThreadNavigation } from '@/hooks/useThreadNavigation';
import type { Thread } from '@/types/review';

interface ThreadPanelProps {
  threads: Thread[];
  selectedThreadId?: string;
  onSelectThread: (threadId: string) => void;
  onSeekToThread: (time: number) => void;
  formatTime: (seconds: number) => string;
}

export const ThreadPanel = ({
  threads,
  selectedThreadId,
  onSelectThread,
  onSeekToThread,
  formatTime
}: ThreadPanelProps) => {
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const { hasPrevious, hasNext, goToPrevious, goToNext } = useThreadNavigation({
    threads,
    selectedThreadId,
    onSelectThread,
    onSeekToThread
  });

  // Keyboard shortcuts: J (next), K (previous)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        goToPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToNext, goToPrevious]);

  const openThreads = threads.filter(t => t.state === 'open');
  const resolvedThreads = threads.filter(t => t.state === 'resolved');

  const filteredThreads = filter === 'all' 
    ? threads 
    : filter === 'open' 
    ? openThreads 
    : resolvedThreads;

  const renderThread = (thread: Thread) => {
    const isSelected = selectedThreadId === thread.id;
    const commentCount = thread.comments.length;

    return (
      <Card
        key={thread.id}
        className={cn(
          "p-3 cursor-pointer transition-colors hover:bg-accent/50",
          isSelected && "border-primary bg-accent"
        )}
        onClick={() => onSelectThread(thread.id)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
            {thread.chip}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSeekToThread(thread.tStart);
                }}
                className="text-xs font-mono text-muted-foreground hover:text-primary"
              >
                {formatTime(thread.tStart)}
              </button>
              {thread.state === 'resolved' && (
                <Badge variant="outline" className="h-5 text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Resolvido
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              <span>{commentCount} {commentCount === 1 ? 'comentário' : 'comentários'}</span>
            </div>

            {thread.comments[0] && (
              <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                {thread.comments[0].body}
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Comentários</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              disabled={!hasPrevious}
              title="Thread anterior (K)"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              disabled={!hasNext}
              title="Próxima thread (J)"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="flex-1"
          >
            Todos ({threads.length})
          </Button>
          <Button
            variant={filter === 'open' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('open')}
            className="flex-1"
          >
            Abertos ({openThreads.length})
          </Button>
          <Button
            variant={filter === 'resolved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('resolved')}
            className="flex-1"
          >
            Resolvidos ({resolvedThreads.length})
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredThreads.length > 0 ? (
            filteredThreads.map(renderThread)
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {filter === 'open' && 'Nenhuma thread aberta'}
                {filter === 'resolved' && 'Nenhuma thread resolvida'}
                {filter === 'all' && 'Nenhum comentário ainda'}
              </p>
              {filter === 'all' && (
                <p className="text-xs mt-1">Adicione desenhos no vídeo para começar</p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

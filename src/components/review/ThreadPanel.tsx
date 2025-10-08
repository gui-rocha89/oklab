import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MessageSquare, CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const openThreads = threads.filter(t => t.state === 'open');
  const resolvedThreads = threads.filter(t => t.state === 'resolved');

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
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Comentários</h3>
        <p className="text-sm text-muted-foreground">
          {openThreads.length} abertos, {resolvedThreads.length} resolvidos
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {openThreads.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Circle className="w-3 h-3" />
                Abertos
              </h4>
              <div className="space-y-2">
                {openThreads.map(renderThread)}
              </div>
            </div>
          )}

          {resolvedThreads.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                Resolvidos
              </h4>
              <div className="space-y-2">
                {resolvedThreads.map(renderThread)}
              </div>
            </div>
          )}

          {threads.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum comentário ainda</p>
              <p className="text-xs mt-1">Adicione desenhos no vídeo para começar</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

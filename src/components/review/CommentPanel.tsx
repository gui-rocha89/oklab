import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, CheckCircle, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Thread } from '@/types/review';
import { useReview } from '@/stores/reviewStore';

interface CommentPanelProps {
  thread: Thread;
  formatTime: (seconds: number) => string;
}

export const CommentPanel = ({ thread, formatTime }: CommentPanelProps) => {
  const [newComment, setNewComment] = useState('');
  const { addComment, resolveThread, reopenThread } = useReview();

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    await addComment(thread.id, {
      authorId: 'current-user-id', // TODO: Get from auth context
      body: newComment
    });

    setNewComment('');
  };

  const handleResolve = () => {
    if (thread.state === 'open') {
      resolveThread(thread.id);
    } else {
      reopenThread(thread.id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              {thread.chip}
            </div>
            <div>
              <div className="font-medium">Comentário #{thread.chip}</div>
              <div className="text-sm text-muted-foreground">
                {formatTime(thread.tStart)}
                {thread.tEnd && ` - ${formatTime(thread.tEnd)}`}
              </div>
            </div>
          </div>
          
          <Button
            variant={thread.state === 'resolved' ? 'outline' : 'default'}
            size="sm"
            onClick={handleResolve}
          >
            {thread.state === 'resolved' ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reabrir
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Resolver
              </>
            )}
          </Button>
        </div>

        {thread.state === 'resolved' && (
          <Badge variant="outline" className="w-fit">
            <CheckCircle className="w-3 h-3 mr-1" />
            Resolvido
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {thread.comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhum comentário ainda</p>
              <p className="text-xs mt-1">Seja o primeiro a comentar</p>
            </div>
          ) : (
            thread.comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {comment.authorId.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Usuário</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {comment.body}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicione um comentário..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleAddComment();
              }
            }}
          />
          <Button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Pressione Cmd/Ctrl + Enter para enviar
        </p>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { MessageSquare } from 'lucide-react';

interface AnnotationCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (comment: string) => void;
  timestamp: number;
}

export const AnnotationCommentModal = ({
  isOpen,
  onClose,
  onSave,
  timestamp,
}: AnnotationCommentModalProps) => {
  const [comment, setComment] = useState('');

  const handleSave = () => {
    if (comment.trim()) {
      onSave(comment);
      setComment('');
      onClose();
    }
  };

  const handleCancel = () => {
    setComment('');
    onClose();
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Adicionar Comentário ao Desenho
          </DialogTitle>
          <DialogDescription>
            Descreva o que você desenhou e o que deseja alterar no vídeo (em {formatTime(timestamp)})
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Ex: Remover este elemento da cena, ajustar cor do fundo, etc..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[120px]"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!comment.trim()}>
            Salvar Comentário
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

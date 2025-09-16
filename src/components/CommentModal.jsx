import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  User, 
  Clock, 
  Paperclip,
  X,
  Check,
  Edit3,
  Trash2,
  Reply
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/UserContext';

const CommentModal = ({ isOpen, onClose, project }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const { user } = useUser();

  // Mock comments data
  useEffect(() => {
    if (project) {
      const mockComments = [
        {
          id: 1,
          author: 'Ana Silva',
          avatar: null,
          content: 'Ótimo trabalho! Apenas uma pequena sugestão: poderia aumentar um pouco o contraste do texto principal?',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
          edited: false,
          replies: [
            {
              id: 11,
              author: 'João Santos',
              avatar: null,
              content: 'Concordo com a Ana, o contraste pode melhorar a legibilidade.',
              timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
              edited: false
            }
          ]
        },
        {
          id: 2,
          author: 'Carlos Oliveira',
          avatar: null,
          content: 'O layout está perfeito! Só gostaria de alterar a cor do botão principal para algo mais vibrante.',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hora atrás
          edited: true,
          replies: []
        },
        {
          id: 3,
          author: 'Maria Santos',
          avatar: null,
          content: 'Impressionante! A tipografia ficou muito elegante. Aprovado da minha parte.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
          edited: false,
          replies: []
        }
      ];
      setComments(mockComments);
    }
  }, [project]);

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      author: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário',
      avatar: null,
      content: newComment.trim(),
      timestamp: new Date(),
      edited: false,
      replies: []
    };

    if (replyTo) {
      setComments(prev => prev.map(c => 
        c.id === replyTo 
          ? { ...c, replies: [...c.replies, { ...comment, id: `${replyTo}-${Date.now()}` }] }
          : c
      ));
      setReplyTo(null);
    } else {
      setComments(prev => [comment, ...prev]);
    }

    setNewComment('');
    setAttachments([]);
    
    toast({
      title: "✅ Comentário adicionado!",
      description: replyTo ? "Sua resposta foi publicada" : "Seu comentário foi publicado",
      duration: 2000,
    });
  };

  const handleEditComment = (commentId, newContent) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return { ...c, content: newContent, edited: true };
      }
      // Handle replies
      return {
        ...c,
        replies: c.replies.map(r => 
          r.id === commentId 
            ? { ...r, content: newContent, edited: true }
            : r
        )
      };
    }));
    setEditingComment(null);
    
    toast({
      title: "✏️ Comentário atualizado!",
      duration: 2000,
    });
  };

  const handleDeleteComment = (commentId) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    
    toast({
      title: "🗑️ Comentário removido",
      duration: 2000,
    });
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  const CommentItem = ({ comment, isReply = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isReply ? 'ml-12 mt-3' : 'mb-6'}`}
    >
      <div className="flex items-start space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.avatar} />
          <AvatarFallback className="text-xs">
            {comment.author.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 text-sm">{comment.author}</span>
                {comment.edited && (
                  <Badge variant="secondary" className="text-xs">editado</Badge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">{formatTimestamp(comment.timestamp)}</span>
                <button
                  onClick={() => setEditingComment(comment.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            {editingComment === comment.id ? (
              <EditCommentForm 
                comment={comment}
                onSave={handleEditComment}
                onCancel={() => setEditingComment(null)}
              />
            ) : (
              <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
            )}
          </div>
          
          {!isReply && (
            <div className="flex items-center space-x-4 mt-2 ml-3">
              <button
                onClick={() => setReplyTo(comment.id)}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Reply className="w-3 h-3" />
                <span>Responder</span>
              </button>
            </div>
          )}
          
          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3">
              {comment.replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {replyTo === comment.id && !isReply && (
        <div className="ml-12 mt-3">
          <ReplyForm 
            onSubmit={handleSubmitComment}
            onCancel={() => setReplyTo(null)}
            value={newComment}
            onChange={setNewComment}
          />
        </div>
      )}
    </motion.div>
  );

  const EditCommentForm = ({ comment, onSave, onCancel }) => {
    const [content, setContent] = useState(comment.content);
    
    return (
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="text-sm resize-none"
          rows={3}
        />
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => onSave(comment.id, content)}
            size="sm"
            className="flex items-center space-x-1"
          >
            <Check className="w-3 h-3" />
            <span>Salvar</span>
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  };

  const ReplyForm = ({ onSubmit, onCancel, value, onChange }) => (
    <div className="bg-blue-50 rounded-lg p-3 space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escreva sua resposta..."
        className="text-sm resize-none bg-white"
        rows={2}
      />
      <div className="flex items-center space-x-2">
        <Button
          onClick={onSubmit}
          size="sm"
          disabled={!value.trim()}
          className="flex items-center space-x-1"
        >
          <Send className="w-3 h-3" />
          <span>Responder</span>
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <span>Comentários - {project.title}</span>
            <Badge variant="secondary">
              {comments.reduce((total, c) => total + 1 + c.replies.length, 0)} comentários
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Project Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3 mb-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Por {project.author}</span>
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {new Date(project.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <p className="text-sm text-gray-700">{project.description}</p>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length > 0 ? (
              comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-900 font-medium mb-2">
                  Nenhum comentário ainda
                </h3>
                <p className="text-sm text-gray-500">
                  Seja o primeiro a comentar neste projeto
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* New Comment Form */}
        {!replyTo && (
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">
                  {(user?.user_metadata?.full_name || user?.email)
                    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Paperclip className="w-4 h-4" />
                <span>Anexar arquivo</span>
              </button>
              
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Comentar</span>
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setAttachments(prev => [...prev, ...files]);
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
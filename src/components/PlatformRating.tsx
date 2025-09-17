import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PlatformRatingProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  completedAction: string;
}

export const PlatformRating: React.FC<PlatformRatingProps> = ({
  projectId,
  isOpen,
  onClose,
  completedAction
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Avaliação Obrigatória",
        description: "Por favor, selecione uma avaliação de 1 a 5 estrelas.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('platform_reviews')
        .insert({
          project_id: projectId,
          client_email: clientEmail || 'anonimo@oklab.com',
          client_name: clientName || 'Cliente Anônimo',
          rating,
          comment
        });

      if (error) throw error;

      toast({
        title: "⭐ Obrigado pela Avaliação!",
        description: "Seu feedback nos ajuda a melhorar nossa plataforma.",
      });

      onClose();

    } catch (error) {
      console.error('Error saving rating:', error);
      toast({
        title: "Erro ao Salvar Avaliação",
        description: "Mas não se preocupe, seu projeto já foi processado!",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (stars: number) => {
    switch (stars) {
      case 1: return "Muito insatisfeito";
      case 2: return "Insatisfeito";
      case 3: return "Neutro";
      case 4: return "Satisfeito";
      case 5: return "Muito satisfeito";
      default: return "Clique para avaliar";
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-background rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6 border border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto mb-3"
            >
              <span className="text-2xl font-bold text-white">OK</span>
            </motion.div>
            <h3 className="text-xl font-bold text-foreground">Avalie Nossa Plataforma</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {completedAction === 'approved' 
                ? 'Projeto aprovado com sucesso! 🎉' 
                : 'Feedback enviado com sucesso! 📝'
              }
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Rating Stars */}
        <div className="space-y-4">
          <div className="text-center">
            <Label className="text-base font-medium">Como foi sua experiência?</Label>
            <div className="flex justify-center gap-2 mt-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-all duration-200"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-muted-foreground hover:text-yellow-300'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {getRatingText(hoveredRating || rating)}
            </p>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-name" className="text-sm">Nome (opcional)</Label>
              <Input
                id="client-name"
                placeholder="Seu nome"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email" className="text-sm">E-mail (opcional)</Label>
              <Input
                id="client-email"
                type="email"
                placeholder="seu@email.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="rating-comment" className="text-sm">
              Comentário (opcional)
            </Label>
            <Textarea
              id="rating-comment"
              placeholder="Conte-nos sobre sua experiência com nossa plataforma..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Pular Avaliação
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar Avaliação
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Um produto criado e desenvolvido By Stream Lab
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
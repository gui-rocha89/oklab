import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SimplePlatformRatingProps {
  projectId?: string;
}

export const SimplePlatformRating: React.FC<SimplePlatformRatingProps> = ({
  projectId
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma avaliação de 1 a 5 estrelas.");
      return;
    }

    // Input validation
    if (clientName && clientName.length > 100) {
      toast.error("Nome muito longo. Máximo de 100 caracteres.");
      return;
    }

    if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      toast.error("E-mail inválido.");
      return;
    }

    if (comment && comment.length > 1000) {
      toast.error("Comentário muito longo. Máximo de 1000 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-platform-review', {
        body: {
          project_id: projectId || 'anonymous',
          rating,
          client_name: clientName,
          client_email: clientEmail,
          comment: comment || undefined,
        }
      });

      if (error) throw error;

      toast.success("⭐ Obrigado pela avaliação! Seu feedback nos ajuda a melhorar.");
      setIsSubmitted(true);

    } catch (error: any) {
      console.error('Error saving rating:', error);
      const errorMessage = error?.message || "Erro ao salvar avaliação. Tente novamente mais tarde.";
      toast.error(errorMessage);
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

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-6 bg-green-50 rounded-lg border border-green-200"
      >
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <Star className="w-6 h-6 text-white fill-white" />
        </div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">Obrigado pela avaliação!</h3>
        <p className="text-sm text-green-600">Seu feedback é muito importante para nós.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rating Stars */}
      <div className="text-center">
        <div className="flex justify-center gap-2">
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
                className={`w-8 h-8 transition-colors ${
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

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || rating === 0}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {isSubmitting ? (
          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Send className="w-4 h-4 mr-2" />
        )}
        {rating === 0 ? 'Selecione uma avaliação' : 'Enviar Avaliação'}
      </Button>
    </div>
  );
};
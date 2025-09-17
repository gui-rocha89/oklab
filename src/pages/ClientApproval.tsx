import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  MessageSquare, 
  Star, 
  Send, 
  ThumbsUp, 
  ThumbsDown,
  ExternalLink,
  Calendar,
  User,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ClientApproval = () => {
  const { shareId } = useParams();
  const [project, setProject] = useState(null);
  const [keyframes, setKeyframes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [actionCompleted, setActionCompleted] = useState(false);
  const [completedAction, setCompletedAction] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchProject();
  }, [shareId]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      
      // Fetch project by share_id
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('share_id', shareId)
        .maybeSingle();

      if (projectError) {
        console.error('Error fetching project:', projectError);
        return;
      }

      if (!projectData) {
        console.log('Project not found for share_id:', shareId);
        return;
      }

      setProject(projectData);

      // Fetch keyframes for this project
      const { data: keyframesData, error: keyframesError } = await supabase
        .from('project_keyframes')
        .select('*')
        .eq('project_id', projectData.id)
        .order('created_at', { ascending: true });

      if (keyframesError) {
        console.error('Error fetching keyframes:', keyframesError);
      } else {
        setKeyframes(keyframesData || []);
      }

    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    await handleAction('approved');
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback Obrigatório",
        description: "Por favor, descreva as alterações desejadas.",
        variant: "destructive",
      });
      return;
    }
    await handleAction('changes_requested');
  };

  const handleAction = async (action) => {
    setSubmitting(true);
    
    try {
      // Update project status
      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          status: action,
          approval_date: action === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', project.id);

      if (updateError) throw updateError;

      // If there's feedback, save it
      if (feedback.trim() && keyframes.length > 0) {
        const { error: feedbackError } = await supabase
          .from('project_feedback')
          .insert({
            keyframe_id: keyframes[0].id,
            user_id: project.user_id,
            comment: feedback,
            status: 'pending',
            x_position: 0,
            y_position: 0
          });

        if (feedbackError) {
          console.error('Error saving feedback:', feedbackError);
        }
      }

      setCompletedAction(action);
      setActionCompleted(true);
      setShowRating(true);

      toast({
        title: action === 'approved' ? "✅ Projeto Aprovado!" : "📝 Feedback Enviado!",
        description: action === 'approved' 
          ? "Obrigado pela aprovação!" 
          : "Suas solicitações foram enviadas para a equipe.",
      });

    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Erro",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Avaliação Obrigatória",
        description: "Por favor, selecione uma avaliação de 1 a 5 estrelas.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('platform_reviews')
        .insert({
          project_id: project.id,
          client_email: clientEmail,
          client_name: clientName,
          rating,
          comment: ratingComment
        });

      if (error) throw error;

      toast({
        title: "⭐ Obrigado pela Avaliação!",
        description: "Seu feedback nos ajuda a melhorar nossa plataforma.",
      });

      setShowRating(false);

    } catch (error) {
      console.error('Error saving rating:', error);
      toast({
        title: "Erro ao Salvar Avaliação",
        description: "Mas não se preocupe, seu projeto já foi processado!",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Projeto não encontrado</h1>
          <p className="text-muted-foreground">Verifique se o link está correto.</p>
        </div>
      </div>
    );
  }

  if (actionCompleted && !showRating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Helmet>
          <title>Ação Concluída - StreamLab</title>
        </Helmet>
        
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6 space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {completedAction === 'approved' ? 'Projeto Aprovado!' : 'Feedback Enviado!'}
              </h1>
              <p className="text-muted-foreground">
                {completedAction === 'approved' 
                  ? 'Obrigado pela aprovação! A equipe iniciará a produção.'
                  : 'Suas solicitações foram enviadas para análise da equipe.'
                }
              </p>
            </div>

            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                Obrigado por usar nossa plataforma! 🚀
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{project.title} - Aprovação - StreamLab</title>
        <meta name="description" content={`Aprove ou solicite alterações para o projeto: ${project.title}`} />
      </Helmet>

      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-foreground">StreamLab</span>
            </div>
            <Badge variant="outline">Cliente</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Project Info */}
        <Card className="mb-8">
          <CardHeader>
            <div className="space-y-2">
              <CardTitle className="text-2xl">{project.title}</CardTitle>
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Cliente: {project.client}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Criado em: {new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Badge variant={project.status === 'approved' ? 'default' : 'secondary'}>
              {project.status === 'approved' ? 'Aprovado' : 
               project.status === 'changes_requested' ? 'Alterações Solicitadas' : 
               'Aguardando Aprovação'}
            </Badge>
          </CardContent>
        </Card>

        {/* Keyframes/Creatives */}
        {keyframes.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Criativos para Aprovação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {keyframes.map((keyframe) => (
                <div key={keyframe.id} className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-3">{keyframe.title}</h3>
                  
                  {keyframe.attachments && keyframe.attachments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {keyframe.attachments.map((attachment, index) => (
                        <div key={index} className="border border-border rounded-lg p-3 text-center">
                          <div className="w-full h-32 bg-muted rounded-lg mb-2 flex items-center justify-center">
                            <ExternalLink className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium">{attachment.name}</p>
                          {attachment.publicationDate && (
                            <p className="text-xs text-muted-foreground">
                              Data: {new Date(attachment.publicationDate).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhum anexo disponível</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Feedback Section */}
        {!actionCompleted && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Seu Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedback">Comentários (opcional para aprovação, obrigatório para alterações)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Descreva suas observações, sugestões ou solicitações de alteração..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {submitting ? (
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <ThumbsUp className="w-4 h-4 mr-2" />
                  )}
                  Aprovar Projeto
                </Button>

                <Button
                  onClick={handleRequestChanges}
                  disabled={submitting}
                  variant="outline"
                  className="flex-1"
                >
                  {submitting ? (
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <ThumbsDown className="w-4 h-4 mr-2" />
                  )}
                  Solicitar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-xl shadow-2xl w-full max-w-md p-6 space-y-6"
            >
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-foreground">Avalie Nossa Plataforma</h3>
                <p className="text-muted-foreground">
                  Como foi sua experiência usando nossa plataforma?
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Avaliação (1-5 estrelas)</Label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition-colors"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Seu nome (opcional)</Label>
                    <Input
                      id="client-name"
                      placeholder="Seu nome"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-email">Seu e-mail (opcional)</Label>
                    <Input
                      id="client-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating-comment">Comentário sobre a plataforma (opcional)</Label>
                  <Textarea
                    id="rating-comment"
                    placeholder="Conte-nos sobre sua experiência..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowRating(false)}
                  className="flex-1"
                >
                  Pular Avaliação
                </Button>
                <Button
                  onClick={handleRatingSubmit}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Avaliação
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientApproval;
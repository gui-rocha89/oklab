import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CheckCircle, MessageSquare, Send, ThumbsUp, XCircle, Plus, Trash2, Loader2, Play, Pause, Info, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { supabase } from '@/integrations/supabase/client';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().substr(14, 5);
};

interface Keyframe {
  id: string;
  time: number;
  comment: string;
  created_at?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  client: string;
  status: string;
  video_url: string;
  share_id: string;
  type: string;
  created_at: string;
}

export default function AudiovisualApproval() {
  const { shareId } = useParams<{ shareId: string }>();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [hasSubmittedRating, setHasSubmittedRating] = useState(false);

  // Fetch project data from Supabase
  useEffect(() => {
    const fetchProject = async () => {
      if (!shareId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch project by share_id
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('share_id', shareId)
          .single();

        if (projectError) {
          console.error('Error fetching project:', projectError);
          setLoading(false);
          return;
        }

        if (!projectData) {
          setLoading(false);
          return;
        }

        setProject(projectData);

        // Fetch existing keyframes for this project
        const { data: keyframesData, error: keyframesError } = await supabase
          .from('project_keyframes')
          .select('*')
          .eq('project_id', projectData.id)
          .order('created_at', { ascending: true });

        if (keyframesError) {
          console.error('Error fetching keyframes:', keyframesError);
        } else if (keyframesData && keyframesData.length > 0) {
          // Convert database keyframes to component format
          const formattedKeyframes: Keyframe[] = keyframesData.map(kf => ({
            id: kf.id,
            time: 0, // Initialize with 0, would need to parse from title or store separately
            comment: kf.title,
            created_at: kf.created_at
          }));
          setKeyframes(formattedKeyframes);
        }

        // Check if project has already been actioned
        if (projectData.status === 'approved' || projectData.status === 'feedback-sent') {
          setShowConfirmation(true);
        }

        // Check if user already submitted a rating
        const { data: existingRating } = await supabase
          .from('platform_reviews')
          .select('*')
          .eq('project_id', projectData.id)
          .maybeSingle();

        if (existingRating) {
          setHasSubmittedRating(true);
          setRating(existingRating.rating);
          setRatingComment(existingRating.comment || '');
        }

      } catch (error) {
        console.error('Error loading project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [shareId]);

  const handleAddKeyframe = () => {
    if (keyframes.some(k => Math.abs(k.time - currentTime) < 1)) {
        toast({
            title: "Atenção",
            description: "Já existe um keyframe neste ponto do vídeo.",
            variant: "destructive",
            duration: 3000,
        });
        return;
    }

    const newKeyframe: Keyframe = {
      id: Date.now().toString(),
      time: currentTime,
      comment: '',
    };
    setKeyframes(prev => [...prev, newKeyframe].sort((a, b) => a.time - b.time));
    setIsPlaying(false);
  };

  const handleKeyframeCommentChange = (id: string, comment: string) => {
    setKeyframes(keyframes.map(k => k.id === id ? { ...k, comment } : k));
  };
  
  const handleRemoveKeyframe = (id: string) => {
    setKeyframes(keyframes.filter(k => k.id !== id));
  };

  const seekTo = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setIsPlaying(true);
    videoRef.current.play();
  };
  
  const handleAction = async (action: string) => {
    if (!project || submitting) return;

    setSubmitting(true);

    try {
      // Save all keyframes with comments to the database
      if (action === 'send_feedback' && keyframes.length > 0) {
        const keyframesToSave = keyframes.filter(kf => kf.comment.trim() !== '');
        
        for (const keyframe of keyframesToSave) {
          // Check if keyframe already exists (has a UUID format id)
          const isExistingKeyframe = keyframe.id.length > 20;
          
          if (isExistingKeyframe) {
            // Update existing keyframe
            await supabase
              .from('project_keyframes')
              .update({ title: keyframe.comment })
              .eq('id', keyframe.id);
          } else {
            // Insert new keyframe
            await supabase
              .from('project_keyframes')
              .insert({
                project_id: project.id,
                title: `${formatTime(keyframe.time)} - ${keyframe.comment}`,
                status: 'pending'
              });
          }
        }
      }

      // Update project status
      const newStatus = action === 'approved' ? 'approved' : 'feedback-sent';
      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          status: newStatus,
          approval_date: action === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', project.id);

      if (updateError) {
        throw updateError;
      }

      setShowConfirmation(true);
      
      if (action === 'approved') {
        toast({
            title: "✅ Aprovação Enviada!",
            description: "Obrigado! Sua aprovação foi registrada com sucesso.",
            duration: 6000,
        });
      } else {
        toast({
            title: "👍 Feedback Enviado!",
            description: "A equipe foi notificada sobre seus apontamentos.",
            duration: 6000,
        });
      }
    } catch (error) {
      console.error('Error saving action:', error);
      toast({
        title: "Erro ao processar",
        description: "Não foi possível salvar sua ação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!project || rating === 0) return;

    try {
      const { error } = await supabase
        .from('platform_reviews')
        .insert({
          project_id: project.id,
          rating,
          comment: ratingComment,
          client_name: project.client,
          client_email: '',
        });

      if (error) throw error;

      toast({
        title: "Avaliação Enviada!",
        description: "Obrigado por avaliar sua experiência.",
      });

      setHasSubmittedRating(true);
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua avaliação.",
        variant: "destructive",
      });
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const hasComments = keyframes.some(k => k.comment.trim().length > 0);
  const canApprove = !hasComments;
  const canSendFeedback = hasComments;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <Loader2 className="w-16 h-16 text-[#FF6B2C] animate-spin mb-4" />
        <h1 className="text-2xl font-bold">Carregando Projeto...</h1>
        <p className="text-muted-foreground">Estamos preparando tudo para você.</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <XCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Projeto não encontrado</h1>
        <p className="text-muted-foreground">O link de aprovação pode estar inválido ou o projeto foi removido.</p>
      </div>
    );
  }

  if (showConfirmation) {
    const isApproved = project.status === 'approved';
    
    const confirmationContent = isApproved ? {
      icon: <ThumbsUp className="w-20 h-20 text-green-500 mx-auto animate-bounce" />,
      title: 'Projeto Aprovado!',
      message: 'Obrigado pela sua colaboração. A equipe já foi notificada.',
      bg: 'from-green-50 to-emerald-100',
    } : {
      icon: <Send className="w-20 h-20 text-blue-500 mx-auto" />,
      title: 'Feedback Enviado!',
      message: 'Seu feedback foi recebido. Nossa equipe analisará os pontos.',
      bg: 'from-blue-50 to-sky-100',
    };

    return (
      <div className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-br ${confirmationContent.bg} text-center p-6`}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="bg-card rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          {confirmationContent.icon}
          <h2 className="text-2xl font-bold mb-2">{confirmationContent.title}</h2>
          <p className="text-muted-foreground mb-6">{confirmationContent.message}</p>
          <Button 
            variant="outline" 
            onClick={() => setShowConfirmation(false)}
            className="w-full"
          >
            Revisar Novamente
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Aprovação de Vídeo - {project.title}</title>
      </Helmet>

      {/* Header com identidade visual */}
      <div className="bg-gradient-to-r from-[#FF6B2C] to-[#FF8C5A] py-8 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Logo className="h-12 w-auto" />
          </div>
          <h1 className="text-4xl font-bold text-white text-center">
            Aprove Seu Vídeo
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Project Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Nome do Projeto</h3>
            <p className="text-lg font-semibold">{project.title}</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Descrição</h3>
            <p className="text-sm">{project.description || 'Sem descrição'}</p>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-[#FF6B2C]/10 to-[#FF8C5A]/10 border-[#FF6B2C]/20">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Cliente</h3>
            <p className="text-xl font-bold text-[#FF6B2C]">{project.client}</p>
          </Card>
        </div>

        {/* Instructions Card */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Como Usar</h3>
              <p className="text-muted-foreground">
                Basta você adicionar um comentário, a plataforma vai fazer automaticamente a marcação no tempo exato que você parar o vídeo.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-contain"
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
                  <source src={project.video_url} type="video/mp4" />
                </video>
              </div>
              
              {/* Video Controls */}
              <div className="mt-4 flex items-center space-x-4">
                <Button
                  onClick={togglePlayPause}
                  variant="outline"
                  size="sm"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <Button
                  onClick={handleAddKeyframe}
                  className="bg-[#FF6B2C] hover:bg-[#FF8C5A]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Comentário
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
            </Card>

            {/* Keyframes */}
            {keyframes.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Comentários no Vídeo</h3>
                <div className="space-y-4">
                  {keyframes.map(keyframe => (
                    <motion.div
                      key={keyframe.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => seekTo(keyframe.time)}
                          className="text-[#FF6B2C] hover:text-[#FF8C5A] font-medium"
                        >
                          {formatTime(keyframe.time)}
                        </button>
                        <Button
                          onClick={() => handleRemoveKeyframe(keyframe.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={keyframe.comment}
                        onChange={(e) => handleKeyframeCommentChange(keyframe.id, e.target.value)}
                        placeholder="Adicione seu comentário aqui..."
                        className="w-full"
                      />
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Ações
              </h3>

              <div className="space-y-3">
                <Button
                  onClick={() => handleAction('approved')}
                  disabled={submitting || !canApprove || project.status === 'approved'}
                  className="w-full bg-green-600 hover:bg-green-700"
                  title={hasComments ? "Não é possível aprovar com comentários pendentes" : "Aprovar projeto na íntegra"}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Aprovar Projeto
                </Button>

                <Button
                  onClick={() => handleAction('send_feedback')}
                  disabled={submitting || !canSendFeedback || project.status === 'feedback-sent'}
                  className="w-full"
                  variant="outline"
                  title={!hasComments ? "Adicione comentários antes de enviar feedback" : "Enviar feedback para a equipe"}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4 mr-2" />
                  )}
                  Enviar Feedback
                </Button>

                {!canApprove && hasComments && (
                  <p className="text-sm text-muted-foreground text-center">
                    Para aprovar, não deve haver comentários no vídeo
                  </p>
                )}
                {!canSendFeedback && !hasComments && (
                  <p className="text-sm text-muted-foreground text-center">
                    Adicione comentários para enviar feedback
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Rating Section */}
        <Card className="p-8 mt-8">
          <h3 className="text-2xl font-bold mb-4 text-center">Avalie sua Experiência</h3>
          <p className="text-muted-foreground text-center mb-6">
            Sua opinião é muito importante para melhorarmos nossa plataforma inovadora
          </p>

          {hasSubmittedRating ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-green-600">Obrigado por sua avaliação!</p>
              <div className="flex justify-center gap-1 mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              {ratingComment && (
                <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
                  "{ratingComment}"
                </p>
              )}
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-center">
                  Como você avalia sua experiência?
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 cursor-pointer transition-colors ${
                          star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Comentários (opcional)
                </label>
                <Textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Conte-nos mais sobre sua experiência..."
                  className="min-h-[100px]"
                />
              </div>

              <Button
                onClick={handleRatingSubmit}
                disabled={rating === 0}
                className="w-full"
              >
                Enviar Avaliação
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

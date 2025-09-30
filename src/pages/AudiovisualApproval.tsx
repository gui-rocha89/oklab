import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CheckCircle, MessageSquare, Send, ThumbsUp, XCircle, Plus, Trash2, Loader2, Play, Pause } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
        <Loader2 className="w-16 h-16 text-orange-500 animate-spin mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Carregando Projeto...</h1>
        <p className="text-gray-600">Estamos preparando tudo para você.</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Projeto não encontrado</h1>
        <p className="text-gray-600">O link de aprovação pode estar inválido ou o projeto foi removido.</p>
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
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          {confirmationContent.icon}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{confirmationContent.title}</h2>
          <p className="text-gray-600 mb-6">{confirmationContent.message}</p>
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
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Aprovação - {project.title}</title>
      </Helmet>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h1>
          <p className="text-gray-600 mb-4">{project.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Cliente: {project.client}</span>
            <span>{new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{project.type}</span>
          </div>
        </motion.div>

        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
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
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Comentário
            </Button>
            
            <div className="text-sm text-gray-500">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </motion.div>

        {/* Keyframes */}
        {keyframes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold mb-4">Comentários no Vídeo</h3>
            <div className="space-y-4">
              {keyframes.map(keyframe => (
                <motion.div
                  key={keyframe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => seekTo(keyframe.time)}
                      className="text-orange-600 hover:text-orange-700 font-medium"
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
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => handleAction('approved')}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={submitting}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {submitting ? 'Processando...' : 'Aprovar Projeto'}
            </Button>
            
            <Button
              onClick={() => handleAction('send_feedback')}
              variant="outline"
              className="flex-1"
              disabled={keyframes.filter(k => k.comment.trim() !== '').length === 0 || submitting}
            >
              <Send className="w-5 h-5 mr-2" />
              {submitting ? 'Enviando...' : `Enviar Feedback (${keyframes.filter(k => k.comment.trim() !== '').length})`}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
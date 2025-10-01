import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CheckCircle, MessageSquare, Send, ThumbsUp, XCircle, Plus, Trash2, Loader2, Info, Star, Pencil, FileText, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { VideoAnnotationCanvas } from '@/components/VideoAnnotationCanvas';
import { DrawingToolbar } from '@/components/DrawingToolbar';
import { useVideoAnnotations } from '@/hooks/useVideoAnnotations';
import { AnnotationCommentModal } from '@/components/AnnotationCommentModal';
import { CustomVideoPlayer } from '@/components/CustomVideoPlayer';
import { CommentsSidebar } from '@/components/CommentsSidebar';
import { useVideoAspectRatio } from '@/hooks/useVideoAspectRatio';
import logoWhite from '@/assets/logo-white-bg.png';
import logoDark from '@/assets/logo-dark-mode.svg';
import logoOrange from '@/assets/logo-orange-bg.png';

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
  completed_at?: string | null;
}

export default function AudiovisualApproval() {
  const { shareId } = useParams<{ shareId: string }>();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
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
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [pendingAnnotationTime, setPendingAnnotationTime] = useState<number>(0);
  const [pendingAnnotationTimestamp, setPendingAnnotationTimestamp] = useState<number | null>(null);
  const [currentAnnotationId, setCurrentAnnotationId] = useState<string | null>(null);
  const [showAnnotationOverlay, setShowAnnotationOverlay] = useState(false);

  // Annotation system
  const {
    annotations,
    currentTool,
    setCurrentTool,
    brushColor,
    setBrushColor,
    brushWidth,
    setBrushWidth,
    isDrawingMode,
    setIsDrawingMode,
    loadAnnotations,
    saveAnnotation,
    loadAnnotationToCanvas,
    deleteAnnotation,
    clearCanvas,
    undo,
    redo,
    setCanvas,
    canUndo,
    canRedo,
  } = useVideoAnnotations(project?.id);

  // Hook para detectar proporção do vídeo automaticamente (Frame.IO style)
  const { aspectRatio, isReady: videoReady } = useVideoAspectRatio(videoRef);

  // Fetch project data from Supabase
  useEffect(() => {
    const fetchProject = async () => {
      console.log('🔍 Carregando projeto com shareId:', shareId);
      
      if (!shareId) {
        console.log('❌ ShareId não fornecido');
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

        console.log('📥 Dados do projeto:', { projectData, error: projectError });

        if (projectError) {
          console.error('❌ Erro ao buscar projeto:', projectError);
          setLoading(false);
          return;
        }

        if (!projectData) {
          console.log('❌ Projeto não encontrado');
          setLoading(false);
          return;
        }

        // Check if project has already been completed
        if (projectData.completed_at) {
          console.log('⚠️ Projeto já foi completado em:', projectData.completed_at);
          console.log('🚫 Bloqueando acesso ao formulário');
          setProject(projectData);
          setShowConfirmation(true);
          setLoading(false);
          return;
        }

        console.log('✅ Projeto carregado, permitindo acesso');
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

  // Load annotations when project is loaded
  useEffect(() => {
    if (project?.id) {
      loadAnnotations();
    }
  }, [project?.id, loadAnnotations]);

  // Auto-load annotations during playback
  useEffect(() => {
    if (!isDrawingMode && annotations.length > 0 && duration > 0 && isPlaying) {
      // Find annotation at current time (within 500ms window)
      const currentAnnotation = annotations.find(ann => {
        const annTime = ann.timestamp_ms / 1000;
        return Math.abs(currentTime - annTime) < 0.5;
      });

      if (currentAnnotation && currentAnnotation.id !== currentAnnotationId) {
        setCurrentAnnotationId(currentAnnotation.id);
        loadAnnotationToCanvas(currentAnnotation);
        setShowAnnotationOverlay(true);
        
        // Hide overlay after 3 seconds
        const timer = setTimeout(() => {
          setShowAnnotationOverlay(false);
        }, 3000);
        
        return () => clearTimeout(timer);
      } else if (!currentAnnotation && showAnnotationOverlay) {
        setShowAnnotationOverlay(false);
      }
    }
  }, [currentTime, annotations, isDrawingMode, isPlaying, currentAnnotationId, loadAnnotationToCanvas, duration, showAnnotationOverlay]);

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
    // Don't automatically resume playback after seeking
    setIsPlaying(false);
  };
  
  const handleAction = async (action: string) => {
    console.log('🎯 handleAction iniciado:', { action, hasProject: !!project, submitting, rating });
    
    if (!project || submitting) {
      console.log('❌ handleAction bloqueado:', { hasProject: !!project, submitting });
      return;
    }

    // Validar que avaliação foi preenchida
    if (rating === 0) {
      console.log('❌ Avaliação não preenchida');
      toast({
        title: "Avaliação obrigatória",
        description: "Por favor, avalie sua experiência antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ Validações passaram, iniciando submissão');
    setSubmitting(true);

    try {
      // Update project status and mark as completed using Edge Function
      const newStatus = action === 'approved' ? 'approved' : 'feedback-sent';
      
      // Prepare keyframes data to send to Edge Function
      const keyframesToSave = action === 'send_feedback' ? keyframes.filter(kf => kf.comment.trim() !== '') : [];
      
      console.log('📞 Chamando Edge Function complete-project:', {
        shareId,
        newStatus,
        rating,
        keyframesCount: keyframesToSave.length
      });
      
      const { data: completeData, error: completeError } = await supabase.functions.invoke('complete-project', {
        body: {
          shareId: shareId,
          status: newStatus,
          rating: rating || undefined,
          clientName: project.client,
          clientEmail: 'client@example.com',
          keyframes: keyframesToSave.length > 0 ? keyframesToSave : undefined
        }
      });

      console.log('📥 Resposta da Edge Function:', { completeData, completeError });

      if (completeError) {
        console.error('❌ Erro ao chamar Edge Function:', completeError);
        throw completeError;
      }

      if (!completeData?.success) {
        console.error('❌ Edge Function retornou erro:', completeData?.error);
        throw new Error(completeData?.error || 'Falha ao completar projeto');
      }

      console.log('✅ Projeto completado e feedbacks salvos via Edge Function');

      // Atualizar o estado local do projeto
      setProject({
        ...project,
        status: newStatus,
        completed_at: completeData.completed_at
      });
      
      setShowConfirmation(true);
      setHasSubmittedRating(true);
      
      if (action === 'approved') {
        toast({
            title: "✅ Aprovação Enviada!",
            description: `Obrigado pela avaliação ${rating}⭐ e aprovação!`,
            duration: 6000,
        });
      } else {
        toast({
            title: "👍 Feedback Enviado!",
            description: `Obrigado pela avaliação ${rating}⭐ e pelo feedback detalhado!`,
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


  const captureVideoScreenshot = async (): Promise<string | null> => {
    if (!videoRef.current) return null;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error("Erro ao capturar screenshot:", error);
      return null;
    }
  };

  const handleSaveAnnotation = () => {
    // Use currentTime from state (synced with CustomVideoPlayer), not videoRef
    const currentTimeMs = Math.floor(currentTime * 1000);
    setPendingAnnotationTime(currentTimeMs);
    setPendingAnnotationTimestamp(currentTimeMs);
    
    console.log('Salvando anotação no tempo:', currentTimeMs, 'ms (', formatTime(currentTime), ')');
    
    setShowCommentModal(true);
  };

  const handleSaveAnnotationWithComment = async (comment: string) => {
    try {
      const screenshot = await captureVideoScreenshot();
      
      console.log('Salvando anotação com comentário:', {
        time: pendingAnnotationTime,
        timeFormatted: formatTime(pendingAnnotationTime / 1000),
        comment: comment,
        hasScreenshot: !!screenshot
      });
      
      // Save annotation with the exact timestamp captured when user clicked "Salvar"
      await saveAnnotation(pendingAnnotationTime, comment);
      clearCanvas();
      
      // Turn off drawing mode after saving
      setIsDrawingMode(false);
      
      toast({
        title: "Anotação salva!",
        description: `Marcação visual salva em ${formatTime(pendingAnnotationTime / 1000)}`,
      });
    } catch (error) {
      console.error("Erro ao salvar anotação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a anotação.",
        variant: "destructive",
      });
    }
  };

  const handleAnnotationClick = (annotationId: string) => {
    const annotation = annotations.find(a => a.id === annotationId);
    if (annotation) {
      const timeInSeconds = annotation.timestamp_ms / 1000;
      seekTo(timeInSeconds);
      setIsPlaying(false);
      loadAnnotationToCanvas(annotation);
      setCurrentAnnotationId(annotationId);
      setShowAnnotationOverlay(true);
    }
  };

  const navigateToAnnotation = (direction: 'prev' | 'next') => {
    const sortedAnnotations = [...annotations].sort((a, b) => a.timestamp_ms - b.timestamp_ms);
    const currentIndex = sortedAnnotations.findIndex(a => a.id === currentAnnotationId);
    
    let targetIndex: number;
    if (currentIndex === -1) {
      // If no current annotation, go to first or last
      targetIndex = direction === 'next' ? 0 : sortedAnnotations.length - 1;
    } else {
      targetIndex = direction === 'next' 
        ? Math.min(currentIndex + 1, sortedAnnotations.length - 1)
        : Math.max(currentIndex - 1, 0);
    }
    
    if (sortedAnnotations[targetIndex]) {
      handleAnnotationClick(sortedAnnotations[targetIndex].id);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current || isDrawingMode) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const hasComments = keyframes.some(k => k.comment.trim().length > 0);
  const hasAnnotations = annotations.length > 0;
  const hasFeedback = hasComments || hasAnnotations;
  const canApprove = !hasFeedback;
  const canSendFeedback = hasFeedback;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
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

  // Check if video is still uploading or unavailable
  if (project.status === 'uploading' || !project.video_url) {
    const handleRefreshStatus = async () => {
      setLoading(true);
      try {
        const { data: updatedProject } = await supabase
          .from('projects')
          .select('*')
          .eq('share_id', shareId)
          .single();
        
        if (updatedProject) {
          setProject(updatedProject);
          
          if (updatedProject.status !== 'uploading' && updatedProject.video_url) {
            toast({
              title: "Vídeo disponível!",
              description: "O vídeo foi processado com sucesso.",
            });
          } else if (updatedProject.status === 'error') {
            toast({
              title: "Erro no upload",
              description: "Houve um problema ao processar o vídeo. Entre em contato com o suporte.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Ainda processando",
              description: "O vídeo ainda está sendo processado. Tente novamente em alguns instantes.",
            });
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
        toast({
          title: "Erro",
          description: "Não foi possível verificar o status do projeto.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-8 max-w-2xl mx-auto">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
        <h1 className="text-3xl font-bold mb-4">
          {project.status === 'error' ? 'Erro no Processamento' : 'Vídeo em Processamento'}
        </h1>
        <p className="text-muted-foreground mb-6 text-lg">
          {project.status === 'error' 
            ? 'Houve um problema ao processar o vídeo. Por favor, entre em contato com o suporte ou solicite o reenvio do projeto.'
            : 'O vídeo está sendo processado em segundo plano. Isso pode levar alguns minutos dependendo do tamanho do arquivo.'
          }
        </p>
        <div className="bg-muted/50 p-6 rounded-lg mb-6 text-left w-full">
          <h3 className="font-semibold mb-3 text-lg">Informações do Projeto:</h3>
          <div className="space-y-2 text-muted-foreground">
            <p><strong>Título:</strong> {project.title}</p>
            <p><strong>Cliente:</strong> {project.client}</p>
            <p><strong>Status:</strong> {project.status === 'error' ? 'Erro' : 'Processando...'}</p>
            <p className="text-sm mt-4">
              {project.status === 'error' 
                ? '❌ O upload falhou. O arquivo pode ter excedido o tamanho máximo permitido.'
                : '⏳ Aguarde alguns instantes e clique em "Verificar Status" para atualizar.'
              }
            </p>
          </div>
        </div>
        <Button 
          onClick={handleRefreshStatus}
          disabled={loading}
          size="lg"
          className="min-w-[200px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            'Verificar Status'
          )}
        </Button>
      </div>
    );
  }

  if (showConfirmation) {
    const isApproved = project.status === 'approved';

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-3xl"
          >
            {/* Logo Grande Centralizada */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-12 inline-block"
            >
              <img 
                src={logoWhite} 
                alt="OK Lab Logo" 
                className="h-32 w-auto"
              />
            </motion.div>

            {/* Título em Laranja */}
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-6xl font-bold text-primary mb-8 font-['Inter']"
            >
              {isApproved ? "Projeto Aprovado!" : "Feedback Enviado!"}
            </motion.h1>

            {/* Texto Descritivo - Cor Escura */}
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-2xl text-gray-700 mb-6 font-['Inter'] leading-relaxed"
            >
              {isApproved
                ? "Obrigado por aprovar o projeto! Nossa equipe foi notificada e dará continuidade ao trabalho."
                : "Obrigado pelo seu feedback detalhado! Nossa equipe irá analisar cada ponto e retornar em até 48 horas."}
            </motion.p>

            {/* Subtexto */}
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-lg text-gray-500 font-['Inter']"
            >
              {project.completed_at && new Date(project.completed_at).toLocaleDateString('pt-BR') !== new Date().toLocaleDateString('pt-BR')
                ? `Este link já foi utilizado em ${new Date(project.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} e não está mais disponível para novas ações.`
                : 'Você receberá atualizações por e-mail.'}
            </motion.p>

            {/* Detalhe Laranja Decorativo */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
              className="mt-12 h-1 w-32 bg-gradient-to-r from-primary to-primary/60 mx-auto rounded-full"
            />
          </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Helmet>
        <title>Aprovação de Vídeo - {project.title}</title>
      </Helmet>

      {/* Header Premium Clean com Logo, Título e Badge */}
      <header className={`bg-gradient-to-r from-primary to-primary/90 shadow-lg ${isMobile ? 'py-3' : 'py-4'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <img 
              src={logoOrange} 
              alt="OK Lab Logo" 
              className={`w-auto ${isMobile ? 'h-10' : 'h-14'}`}
            />
            
            {/* Título Centralizado */}
            <div className="flex-1 text-center">
              <h1 className={`font-bold text-white tracking-tight ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                APROVE SEU CONTEÚDO
              </h1>
            </div>
            
            {/* Badge Cliente */}
            <div className={`bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 ${isMobile ? 'px-2 py-0.5' : ''}`}>
              <span className={`text-white font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Cliente
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={`flex-1 container mx-auto max-w-7xl ${isMobile ? 'px-3 py-4' : 'px-6 py-6'}`}>
        {/* Cards de Informação - Layout Horizontal com Tipografia Hierárquica */}
        <div className={`grid grid-cols-1 md:grid-cols-3 ${isMobile ? 'gap-3 mb-4' : 'gap-5 mb-6'}`}>
          <Card className={`bg-card border-border/50 hover:border-primary/30 transition-all ${isMobile ? 'p-4' : 'p-5'} h-[110px]`}>
            <div className="flex items-start gap-3 h-full">
              <div className={`rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ${isMobile ? 'h-10 w-10' : 'h-11 w-11'}`}>
                <FileText className={isMobile ? 'w-5 h-5 text-primary' : 'w-5 h-5 text-primary'} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className={`text-muted-foreground mb-1.5 uppercase tracking-wider ${isMobile ? 'text-[9px]' : 'text-[10px]'} font-medium`}>
                  Projeto
                </p>
                <h2 className={`font-bold text-foreground leading-snug ${isMobile ? 'text-base' : 'text-2xl'}`}>
                  {project.title}
                </h2>
              </div>
            </div>
          </Card>
          
          <Card className={`bg-primary/5 border-primary/20 hover:border-primary/40 transition-all ${isMobile ? 'p-4' : 'p-5'} h-[110px]`}>
            <div className="flex items-start gap-3 h-full">
              <div className={`rounded-lg bg-primary/20 flex items-center justify-center shrink-0 ${isMobile ? 'h-10 w-10' : 'h-11 w-11'}`}>
                <User className={isMobile ? 'w-5 h-5 text-primary' : 'w-5 h-5 text-primary'} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className={`text-primary/70 mb-1.5 uppercase tracking-wider ${isMobile ? 'text-[9px]' : 'text-[10px]'} font-medium`}>
                  Cliente
                </p>
                <h3 className={`font-semibold text-primary ${isMobile ? 'text-sm' : 'text-lg'}`}>
                  {project.client}
                </h3>
              </div>
            </div>
          </Card>

          {project.description && (
            <Card className={`bg-card border-border/50 hover:border-primary/30 transition-all ${isMobile ? 'p-4' : 'p-5'} h-[110px]`}>
              <div className="flex items-start gap-3 h-full">
                <div className={`rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ${isMobile ? 'h-10 w-10' : 'h-11 w-11'}`}>
                  <Info className={isMobile ? 'w-5 h-5 text-primary' : 'w-5 h-5 text-primary'} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className={`text-muted-foreground mb-1.5 uppercase tracking-wider ${isMobile ? 'text-[9px]' : 'text-[10px]'} font-medium`}>
                    Descrição
                  </p>
                  <p className={`text-foreground leading-snug line-clamp-2 ${isMobile ? 'text-xs' : 'text-base'}`}>
                    {project.description}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Card de Instruções Estilo Premium */}
        <Card className={`bg-primary/5 border-primary/20 ${isMobile ? 'mb-4' : 'mb-6'}`}>
          <div className={`flex items-start gap-3 ${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <Info className={isMobile ? 'h-4 w-4 text-primary' : 'h-4 w-4 text-primary'} />
            </div>
            <div className="flex-1">
              <p className={`text-foreground/90 leading-relaxed ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <span className="font-semibold text-primary">Como revisar:</span> Assista ao vídeo, adicione comentários nos momentos específicos ou desenhe diretamente no vídeo para marcar correções. Depois, aprove ou envie feedback.
              </p>
            </div>
          </div>
        </Card>

        {/* Grid Layout - 60/40 Proportion (Padronizado com ClientReturn) */}
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-5 gap-6'}`}>
          {/* Coluna Esquerda: Vídeo (60% - 3/5 columns) */}
          <div className={`flex flex-col ${isMobile ? 'space-y-4' : 'lg:col-span-3 space-y-0'}`}>
            {/* Card do Player de Vídeo */}
            <Card className={`bg-card border-primary/20 shadow-xl ${isMobile ? 'p-3' : 'p-6'}`}>
              {/* Container adaptativo que respeita a proporção do vídeo */}
              <div 
                className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center"
                style={{ 
                  aspectRatio: aspectRatio.toString(),
                  maxHeight: isMobile ? '60vh' : '70vh'
                }}
              >
                {/* Hidden video element for syncing with canvas */}
                <video
                  ref={videoRef}
                  className="hidden"
                  src={project.video_url}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                <div className="relative w-full h-full">
                  <CustomVideoPlayer
                    src={project.video_url}
                    currentTime={currentTime}
                    onTimeUpdate={setCurrentTime}
                    onDurationChange={setDuration}
                    annotations={annotations}
                    onSeek={(time) => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = time;
                      }
                    }}
                    isPlaying={isPlaying}
                    onPlayPauseChange={setIsPlaying}
                    isDrawingMode={isDrawingMode}
                    onAnnotationClick={handleAnnotationClick}
                  />
                  
                  {/* Drawing Canvas Overlay - Positioned absolutely over the video */}
                  {(isDrawingMode || showAnnotationOverlay) && (
                    <div 
                      className="absolute top-0 left-0 w-full h-full pointer-events-none" 
                      style={{ zIndex: isDrawingMode ? 50 : 5 }}
                    >
              <VideoAnnotationCanvas
                videoRef={videoRef}
                isDrawingMode={isDrawingMode}
                currentTool={currentTool}
                brushColor={brushColor}
                brushWidth={brushWidth}
                onCanvasReady={setCanvas}
              />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Drawing Toolbar - Below Video */}
              {isDrawingMode && (
                <div className="mt-2">
                  <DrawingToolbar
                    currentTool={currentTool}
                    onToolChange={setCurrentTool}
                    brushColor={brushColor}
                    onColorChange={setBrushColor}
                    brushWidth={brushWidth}
                    onBrushWidthChange={setBrushWidth}
                    onUndo={undo}
                    onRedo={redo}
                    onClear={clearCanvas}
                    onSave={handleSaveAnnotation}
                    canUndo={canUndo}
                    canRedo={canRedo}
                  />
                </div>
              )}

              {/* Annotation Comment Modal */}
              <AnnotationCommentModal
                isOpen={showCommentModal}
                onClose={() => setShowCommentModal(false)}
                onSave={handleSaveAnnotationWithComment}
                timestamp={pendingAnnotationTime}
              />
              
              {/* Drawing and Comment Controls */}
              <div className={`mt-4 flex ${isMobile ? 'flex-col gap-3' : 'items-center space-x-4'}`}>
                <Button
                  onClick={() => {
                    const newMode = !isDrawingMode;
                    
                    if (newMode) {
                      // CRITICAL: Force BOTH videos to pause before drawing mode
                      setIsPlaying(false);
                      if (videoRef.current) {
                        videoRef.current.pause();
                      }
                    }
                    
                    // Set drawing mode immediately (no setTimeout)
                    setIsDrawingMode(newMode);
                    
                    if (newMode) {
                      toast({
                        title: "Modo Desenho Ativado",
                        description: "Vídeo pausado. Desenhe suas anotações e clique em Salvar.",
                      });
                    }
                  }}
                  variant={isDrawingMode ? "default" : "outline"}
                  size={isMobile ? "default" : "sm"}
                  className={isMobile ? "touch-manipulation min-h-[44px] px-6 flex-1" : ""}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  {isDrawingMode ? 'Desativar Desenho' : 'Modo Desenho'}
                </Button>
                
                <Button
                  onClick={handleAddKeyframe}
                  className={`bg-primary hover:bg-primary/90 touch-manipulation ${isMobile ? 'w-full min-h-[44px]' : ''}`}
                  size={isMobile ? "default" : "sm"}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Comentário
                </Button>
              </div>
            </Card>

            {/* Keyframes Editing Section - Below Video */}
            {keyframes.length > 0 && (
              <Card className={`bg-white border-gray-200 shadow-sm mt-4 ${isMobile ? 'p-4' : 'p-6'}`}>
                <h3 className={`font-semibold mb-4 text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>Editar Comentários</h3>
                <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
                  {keyframes.map(keyframe => (
                    <motion.div
                      key={keyframe.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4 bg-white"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => seekTo(keyframe.time)}
                          className={`text-primary hover:text-primary/80 font-medium touch-manipulation ${isMobile ? 'min-h-[44px] text-base' : ''}`}
                        >
                          {formatTime(keyframe.time)}
                        </button>
                        <Button
                          onClick={() => handleRemoveKeyframe(keyframe.id)}
                          variant="ghost"
                          size={isMobile ? "default" : "sm"}
                          className={isMobile ? "touch-manipulation min-h-[44px]" : ""}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={keyframe.comment}
                        onChange={(e) => handleKeyframeCommentChange(keyframe.id, e.target.value)}
                        placeholder="Adicione seu comentário aqui..."
                        className={`w-full ${isMobile ? 'min-h-[100px] text-base' : ''}`}
                      />
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Coluna Direita: Sidebar Unificado (40% - 2/5 columns) */}
          <div className={`${isMobile ? '' : 'lg:col-span-2'}`}>
            <Card className={`bg-card border-primary/20 shadow-xl flex flex-col ${isMobile ? 'p-4' : 'p-0'}`} style={{ height: isMobile ? 'auto' : 'fit-content' }}>
              {/* Seção de Ações - Estilo Frame.io Premium */}
              <div className={`border-b border-border/50 bg-primary/5 ${isMobile ? 'pb-4 mb-4 px-4 pt-4' : 'p-5 pb-5'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <h3 className={`font-bold text-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
                    Avaliação e Ações
                  </h3>
                </div>

                {/* Compact Rating */}
                {hasSubmittedRating ? (
                  <div className="text-center mb-3">
                    <CheckCircle className={`text-green-600 mx-auto mb-1.5 ${isMobile ? 'w-8 h-8' : 'w-9 h-9'}`} />
                    <p className={`font-semibold text-green-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Obrigado pela avaliação!
                    </p>
                    <div className="flex justify-center gap-0.5 mt-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${
                            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 mb-3">
                    <div>
                      <label className={`block font-medium mb-1.5 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        Avalie sua experiência
                      </label>
                      <div className="flex justify-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="transition-transform hover:scale-110 touch-manipulation p-0.5"
                            disabled={hasSubmittedRating}
                          >
                            <Star
                              className={`cursor-pointer transition-colors ${
                                isMobile ? 'w-5 h-5' : 'w-6 h-6'
                              } ${
                                star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {rating === 0 && (
                      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-1.5">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
                          ⚠️ Avaliação obrigatória
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Compact Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleAction('approved')}
                    disabled={submitting || !canApprove || rating === 0 || project.status === 'approved'}
                    className={`w-full bg-green-600 hover:bg-green-700 touch-manipulation ${isMobile ? 'min-h-[44px] text-sm' : 'h-10 text-sm'}`}
                    title={
                      rating === 0
                        ? "Avalie sua experiência antes de aprovar"
                        : hasFeedback 
                          ? "Não é possível aprovar com comentários ou anotações visuais pendentes" 
                          : "Aprovar projeto na íntegra"
                    }
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
                    disabled={submitting || !canSendFeedback || rating === 0 || project.status === 'feedback-sent'}
                    className={`w-full touch-manipulation ${isMobile ? 'min-h-[44px] text-sm' : 'h-10 text-sm'}`}
                    variant="outline"
                    title={
                      rating === 0
                        ? "Avalie sua experiência antes de enviar feedback"
                        : !hasFeedback 
                          ? "Adicione comentários ou anotações visuais antes de enviar feedback" 
                          : "Enviar todos os comentários e anotações"
                    }
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4 mr-2" />
                    )}
                    Enviar Feedback
                  </Button>
                </div>
              </div>

              {/* Comments Section Below - Scrollable */}
              <div className="flex-1 overflow-hidden">
                <CommentsSidebar
                  keyframes={keyframes}
                  annotations={annotations}
                  currentTime={currentTime}
                  onSeekToTime={seekTo}
                  onLoadAnnotation={(annotationId) => {
                    const annotation = annotations.find(a => a.id === annotationId);
                    if (annotation) {
                      loadAnnotationToCanvas(annotation);
                      setCurrentAnnotationId(annotationId);
                      setShowAnnotationOverlay(true);
                    }
                  }}
                  formatTime={formatTime}
                />
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}

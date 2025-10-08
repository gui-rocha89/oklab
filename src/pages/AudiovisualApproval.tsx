import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CheckCircle, MessageSquare, Send, ThumbsUp, XCircle, Plus, Trash2, Loader2, Info, Star, Pencil, FileText, User, MapPin, Badge as BadgeIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { CustomVideoPlayer } from '@/components/CustomVideoPlayer';
import { CommentsSidebar } from '@/components/CommentsSidebar';
import { useVideoAspectRatio } from '@/hooks/useVideoAspectRatio';
import { ThreadDetailSheet } from '@/components/review/ThreadDetailSheet';
import type { Thread, Pt } from '@/types/review';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Paperclip, Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import logoWhite from '@/assets/logo-white-bg.png';
import logoDark from '@/assets/logo-dark-mode.svg';
import logoOrange from '@/assets/logo-orange-bg.png';
import { Attachment } from '@/lib/attachmentUtils';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().substr(14, 5);
};

// Mapping functions for letterboxing (object-fit: contain)
type VR = { x: number; y: number; w: number; h: number };

function computeVideoRect(container: DOMRect, videoAR: number): VR {
  const contAR = container.width / container.height;
  if (contAR > videoAR) {
    const h = container.height;
    const w = h * videoAR;
    return { x: (container.width - w) / 2, y: 0, w, h };
  } else {
    const w = container.width;
    const h = w / videoAR;
    return { x: 0, y: (container.height - h) / 2, w, h };
  }
}

function pxToNorm(x: number, y: number, vr: VR): Pt {
  return { x: (x - vr.x) / vr.w, y: (y - vr.y) / vr.h };
}

function normToPx(p: Pt, vr: VR): { x: number; y: number } {
  return { x: vr.x + p.x * vr.w, y: vr.y + p.y * vr.h };
}

function centroid(points: Pt[]): Pt {
  if (points.length === 0) return { x: 0.5, y: 0.5 };
  const n = points.length;
  return {
    x: points.reduce((a, p) => a + p.x, 0) / n,
    y: points.reduce((a, p) => a + p.y, 0) / n
  };
}

interface Keyframe {
  id: string;
  time: number;
  comment: string;
  attachments?: Attachment[];
  created_at?: string;
  x?: number; // normalized 0-1
  y?: number; // normalized 0-1
  pinNumber?: number;
}

interface VideoPin {
  id: string;
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  number: number;
  keyframeId?: string;
}

interface FeedbackHistory {
  id: string;
  comment: string;
  team_response: string | null;
  keyframe_title: string;
  created_at: string;
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
  current_feedback_round?: number;
}

export default function AudiovisualApproval() {
  const { shareId } = useParams<{ shareId: string }>();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackHistory[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [hasSubmittedRating, setHasSubmittedRating] = useState(false);
  const [videoPins, setVideoPins] = useState<VideoPin[]>([]);
  const [isPinMode, setIsPinMode] = useState(false);
  const [tLock, setTLock] = useState<number | null>(null);
  
  // Review features states
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [openThreadDetail, setOpenThreadDetail] = useState<Thread | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'in_review' | 'changes_requested' | 'approved'>('in_review');
  const [videoRect, setVideoRect] = useState<VR | null>(null);
  const [videoNaturalSize, setVideoNaturalSize] = useState<{ width: number; height: number } | null>(null);
  
  // Composer state (for Anotações tab)
  const [composerText, setComposerText] = useState('');
  const [composerAttachmentUrl, setComposerAttachmentUrl] = useState('');
  const [composerAttachmentName, setComposerAttachmentName] = useState('');
  const [composerLinkUrl, setComposerLinkUrl] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);

  // Hook para detectar proporção do vídeo automaticamente (Frame.IO style)
  const { aspectRatio, isReady: videoReady } = useVideoAspectRatio(videoRef);

  // Setup canvas overlay ResizeObserver + DPR
  useEffect(() => {
    if (!canvasRef.current || !videoContainerRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const container = videoContainerRef.current;
    const video = videoRef.current;

    const updateCanvasSize = () => {
      const r = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.style.width = r.width + 'px';
      canvas.style.height = r.height + 'px';
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // Update video rect for chip positioning
      if (videoNaturalSize) {
        const videoAR = videoNaturalSize.width / videoNaturalSize.height;
        setVideoRect(computeVideoRect(r, videoAR));
      }
    };

    const ro = new ResizeObserver(updateCanvasSize);
    ro.observe(container);
    
    const handleLoadedMetadata = () => {
      setVideoNaturalSize({
        width: video.videoWidth,
        height: video.videoHeight
      });
      updateCanvasSize();
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    if (video.videoWidth > 0) {
      handleLoadedMetadata();
    }

    return () => {
      ro.disconnect();
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoNaturalSize]);

  // Lock time on first keypress when composer is focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if composer is focused and tLock is not set
      if (document.activeElement === composerRef.current && tLock === null && videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
        
        const locked = Math.round(videoRef.current.currentTime * 100) / 100;
        setTLock(locked);
        
        toast({
          title: "⏸️ Vídeo pausado",
          description: `Comentário será criado em ${formatTime(locked)}.`,
          duration: 2500,
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tLock]);

  // Render shapes on canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRect || !videoNaturalSize) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw shapes for visible threads
    threads.forEach(thread => {
      // Check if thread is visible at current time
      const isVisible = currentTime >= thread.tStart && (!thread.tEnd || currentTime <= thread.tEnd);
      if (!isVisible || thread.shapes.length === 0) return;

      const isSelected = selectedThreadId === thread.id;
      
      thread.shapes.forEach(shape => {
        ctx.strokeStyle = isSelected ? '#FFB84D' : shape.color;
        ctx.lineWidth = shape.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (shape.type === 'path' && shape.points.length > 0) {
          ctx.beginPath();
          const firstPoint = normToPx(shape.points[0], videoRect);
          ctx.moveTo(firstPoint.x, firstPoint.y);
          
          for (let i = 1; i < shape.points.length; i++) {
            const point = normToPx(shape.points[i], videoRect);
            ctx.lineTo(point.x, point.y);
          }
          ctx.stroke();
        } else if (shape.type === 'circle' && shape.points.length >= 2) {
          const center = normToPx(shape.points[0], videoRect);
          const radiusPoint = shape.points[1];
          const radius = radiusPoint.x * videoRect.w; // radius stored in x
          
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      });
    });
  }, [threads, currentTime, selectedThreadId, videoRect, videoNaturalSize]);

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

        // Check if project has been completed, but allow access if status is 'in-revision' (corrected video resent)
        if (projectData.completed_at && projectData.status !== 'in-revision') {
          console.log('⚠️ Projeto já foi completado em:', projectData.completed_at);
          console.log('🚫 Bloqueando acesso ao formulário');
          setProject(projectData);
          setShowConfirmation(true);
          setLoading(false);
          return;
        }

        console.log('✅ Projeto carregado, permitindo acesso');
        setProject(projectData);

        // For audiovisual projects, start with empty keyframes so client can add new feedback
        // Previous feedback is shown in the history sidebar
        setKeyframes([]);
        
        // Initialize threads as empty (client will create new ones)
        setThreads([]);

        // Fetch resolved feedback history (only previous round corrections)
        const currentRound = projectData.current_feedback_round || 1;
        const previousRound = currentRound - 1;
        
        const { data: previousFeedbacks, error: feedbackError } = await supabase
          .from('project_feedback')
          .select(`
            id,
            comment,
            team_response,
            created_at,
            feedback_round,
            keyframe_id,
            project_keyframes!inner(title)
          `)
          .eq('project_keyframes.project_id', projectData.id)
          .eq('resolved', true)
          .eq('feedback_round', previousRound)
          .order('created_at', { ascending: true });

        if (feedbackError) {
          console.error('Error fetching feedback history:', feedbackError);
        } else if (previousFeedbacks && previousFeedbacks.length > 0) {
          const formattedHistory: FeedbackHistory[] = previousFeedbacks.map(fb => ({
            id: fb.id,
            comment: fb.comment,
            team_response: fb.team_response,
            keyframe_title: (fb.project_keyframes as any)?.title || 'Sem título',
            created_at: fb.created_at
          }));
          setFeedbackHistory(formattedHistory);
          console.log('📋 Histórico de feedbacks carregado:', formattedHistory.length, 'itens');
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



  const handleSaveComment = () => {
    if (!composerText.trim()) {
      toast({
        title: "❌ Texto obrigatório",
        description: "Por favor, adicione um texto ao comentário.",
        variant: "destructive"
      });
      return;
    }
    
    // tLock must be set (captured on focus/first keypress)
    if (tLock === null) {
      toast({
        title: "⚠️ Erro interno",
        description: "Timecode não foi capturado. Por favor, clique no campo novamente.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate link URL if provided
    if (composerLinkUrl && !composerLinkUrl.match(/^https?:\/\/.+/i)) {
      toast({
        title: "❌ Link inválido",
        description: "O link deve começar com http:// ou https://",
        variant: "destructive"
      });
      return;
    }
    
    // Check for existing keyframe at tLock (within 0.01s tolerance)
    const conflictingKeyframe = keyframes.find(k => Math.abs(k.time - tLock) < 0.01);
    
    if (conflictingKeyframe) {
      // Append comment to existing thread
      toast({
        title: "💬 Comentário adicionado",
        description: `Comentário anexado ao thread existente em ${formatTime(tLock)}.`,
        duration: 3000,
      });
      
      // In real implementation, would append to existing thread's comments
      // For now, we'll treat it as update
      handleKeyframeCommentChange(conflictingKeyframe.id, composerText);
      
      // Reset composer and tLock
      setComposerText('');
      setComposerAttachmentUrl('');
      setComposerAttachmentName('');
      setComposerLinkUrl('');
      setShowAttachmentInput(false);
      setShowLinkInput(false);
      setTLock(null);
      return;
    }
    
    const attachments: Attachment[] = [];
    if (composerAttachmentUrl) {
      attachments.push({
        id: crypto.randomUUID(),
        name: composerAttachmentName || 'Anexo',
        url: composerAttachmentUrl,
        type: 'document',
        mimeType: 'application/octet-stream',
        size: 0,
        uploadedAt: new Date().toISOString()
      });
    }
    
    if (composerLinkUrl) {
      attachments.push({
        id: crypto.randomUUID(),
        name: composerLinkUrl,
        url: composerLinkUrl,
        type: 'video-link',
        mimeType: 'text/uri-list',
        size: 0,
        uploadedAt: new Date().toISOString()
      });
    }
    
    const newKeyframe: Keyframe = {
      id: Date.now().toString(),
      time: tLock, // Use tLock instead of currentTime
      comment: composerText,
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    
    setKeyframes(prev => [...prev, newKeyframe].sort((a, b) => a.time - b.time));
    
    // Reset composer and tLock
    setComposerText('');
    setComposerAttachmentUrl('');
    setComposerAttachmentName('');
    setComposerLinkUrl('');
    setShowAttachmentInput(false);
    setShowLinkInput(false);
    setTLock(null);
    
    toast({
      title: "✅ Comentário adicionado",
      description: `Comentário criado em ${formatTime(tLock)}.`,
      duration: 3000,
    });
  };
  
  const handleCancelComment = () => {
    // If tLock was set and no comment was posted, check for empty thread
    if (tLock !== null) {
      const keyframe = keyframes.find(k => Math.abs(k.time - tLock) < 0.01);
      
      // If keyframe exists but has no comment, remove it (empty thread cleanup)
      if (keyframe && !keyframe.comment.trim()) {
        setKeyframes(prev => prev.filter(k => k.id !== keyframe.id));
        setVideoPins(prev => prev.filter(p => p.keyframeId !== keyframe.id));
        
        toast({
          title: "🗑️ Thread vazio removido",
          description: "Nenhum comentário foi adicionado.",
          duration: 2000,
        });
      }
    }
    
    // Reset composer fields and tLock
    setComposerText('');
    setComposerAttachmentUrl('');
    setComposerAttachmentName('');
    setComposerLinkUrl('');
    setShowAttachmentInput(false);
    setShowLinkInput(false);
    setTLock(null);
  };

  const handleAddKeyframe = () => {
    // Pause video immediately
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
    
    // Check for existing keyframe within 0.5 seconds (reduced from 1 second)
    const conflictingKeyframe = keyframes.find(k => Math.abs(k.time - currentTime) < 0.5);
    
    if (conflictingKeyframe) {
        toast({
            title: "⚠️ Comentário muito próximo",
            description: `Já existe um comentário em ${formatTime(conflictingKeyframe.time)}. Mova o vídeo pelo menos 0.5 segundos para adicionar um novo comentário.`,
            variant: "destructive",
            duration: 4000,
        });
        return;
    }

    const newKeyframe: Keyframe = {
      id: Date.now().toString(),
      time: currentTime,
      comment: '',
    };
    
    setKeyframes(prev => [...prev, newKeyframe].sort((a, b) => a.time - b.time));
    
    toast({
      title: "✅ Comentário adicionado",
      description: `Comentário criado em ${formatTime(currentTime)}. Edite na timeline à direita.`,
      duration: 3000,
    });
  };

  const onComposerFocus = () => {
    if (!videoRef.current || tLock !== null) return;
    
    // Pause video
    videoRef.current.pause();
    setIsPlaying(false);
    
    // Lock time (round to 0.01s)
    const locked = Math.round(videoRef.current.currentTime * 100) / 100;
    setTLock(locked);
    
    toast({
      title: "⏸️ Vídeo pausado",
      description: `Comentário será criado em ${formatTime(locked)}.`,
      duration: 2500,
    });
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPinMode || !videoContainerRef.current) return;
    
    // Pause video when placing pin
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
    
    const rect = videoContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const pinNumber = videoPins.length + 1;
    
    // Create new keyframe with pin marker and coordinates
    const newKeyframe: Keyframe = {
      id: Date.now().toString(),
      time: currentTime,
      comment: '',
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      pinNumber: pinNumber,
    };
    
    const newPin: VideoPin = {
      id: newKeyframe.id,
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      number: pinNumber,
      keyframeId: newKeyframe.id,
    };
    
    setKeyframes(prev => [...prev, newKeyframe].sort((a, b) => a.time - b.time));
    setVideoPins(prev => [...prev, newPin]);
    
    toast({
      title: "📍 Pin adicionado",
      description: `Marcador #${newPin.number} criado em ${formatTime(currentTime)}. Adicione seu comentário na lateral.`,
      duration: 3000,
    });
  };

  const handleRemovePin = (pinId: string) => {
    setVideoPins(prev => prev.filter(p => p.id !== pinId));
  };

  const handleKeyframeCommentChange = (id: string, comment: string, attachments?: Attachment[]) => {
    setKeyframes(keyframes.map(k => k.id === id ? { ...k, comment, attachments: attachments || k.attachments } : k));
  };
  
  const handleRemoveKeyframe = (id: string) => {
    setKeyframes(keyframes.filter(k => k.id !== id));
    // Also remove associated pin
    setVideoPins(prev => prev.filter(p => p.keyframeId !== id));
    toast({
      title: "Comentário removido",
      description: "O feedback foi excluído com sucesso.",
    });
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
      // Update review status badge
      const newReviewStatus = action === 'approved' ? 'approved' : 'changes_requested';
      setReviewStatus(newReviewStatus);
      
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
          ratingComment: ratingComment || undefined,
          clientName: project.client,
          clientEmail: 'client@example.com',
          keyframes: keyframesToSave.length > 0 ? keyframesToSave : undefined,
          feedbackRound: project.current_feedback_round || 1 // Include current feedback round
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




  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Only count keyframes with actual comments for feedback validation
  const hasComments = keyframes.some(k => k.comment.trim().length > 0);
  const hasFeedback = hasComments;
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

      {/* Header Premium Clean com Título e Badge */}
      <header className={`bg-gradient-to-r from-primary to-primary/90 shadow-lg ${isMobile ? 'py-3' : 'py-4'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            {/* Espaçador */}
            <div className="w-20" />
            
            {/* Título Centralizado */}
            <div className="flex-1 text-center">
              <h1 className={`font-bold text-white tracking-tight ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                APROVE SEU VÍDEO
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

      {/* Logo Section - Destaque Centralizado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-background py-6 sm:py-8 border-b shadow-sm"
      >
        <div className="container mx-auto px-4 flex justify-center">
          <img 
            src={logoWhite} 
            alt="OK Lab Logo" 
            className={`w-auto ${isMobile ? 'h-16' : 'h-20 md:h-24'}`}
          />
        </div>
      </motion.div>

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
                <p className="text-sm text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">
                  PROJETO
                </p>
                <h2 className={`font-normal text-foreground leading-snug ${isMobile ? 'text-base' : 'text-lg'}`}>
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
                <p className="text-sm text-primary/70 mb-1.5 uppercase tracking-wider font-bold">
                  CLIENTE
                </p>
                <h3 className={`font-normal text-primary ${isMobile ? 'text-sm' : 'text-lg'}`}>
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
                  <p className="text-sm text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">
                    DESCRIÇÃO
                  </p>
                  <p className={`text-foreground leading-snug line-clamp-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
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
                <span className="font-bold text-primary">Como revisar:</span> Assista ao vídeo, adicione comentários nos momentos específicos ou desenhe diretamente no vídeo para marcar correções. Depois, aprove ou envie feedback.
              </p>
            </div>
          </div>
        </Card>

        {/* Grid Layout - 60/40 Proportion (Padronizado com ClientReturn) */}
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-5 gap-6 items-start'}`}>
          {/* Coluna Esquerda: Vídeo (60% - 3/5 columns) */}
          <div className={`flex flex-col ${isMobile ? 'space-y-4' : 'lg:col-span-3 space-y-4'}`}>
            {/* Card do Player de Vídeo */}
            <Card className={`bg-card border-primary/20 shadow-xl ${isMobile ? 'p-3' : 'p-6'}`}>
              {/* Container adaptativo que respeita a proporção do vídeo */}
              <div 
                ref={videoContainerRef}
                className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center"
                style={{ 
                  aspectRatio: aspectRatio.toString(),
                  maxHeight: isMobile ? '60vh' : '70vh'
                }}
              >
                {/* Canvas overlay for drawing annotations (readonly now) */}
                <canvas
                  ref={canvasRef}
                  data-testid="review-overlay"
                  className="absolute inset-0 z-20"
                  style={{ pointerEvents: 'none' }}
                />
                
                {/* Numbered chips for threads */}
                {videoRect && threads.map(thread => {
                  if (thread.shapes.length === 0) return null;
                  
                  const firstShape = thread.shapes[0];
                  const center = centroid(firstShape.points);
                  const { x, y } = normToPx(center, videoRect);
                  const isSelected = selectedThreadId === thread.id;
                  
                  return (
                    <button
                      key={thread.id}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full w-8 h-8 text-sm font-semibold
                                  transition-all duration-200 shadow-lg ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/30 scale-110'
                                      : 'bg-white text-black ring-1 ring-black/10 hover:scale-105'
                                  }`}
                      style={{ left: x, top: y, zIndex: 21 }}
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.pause();
                          videoRef.current.currentTime = thread.tStart;
                        }
                        setIsPlaying(false);
                        setSelectedThreadId(thread.id);
                        setOpenThreadDetail(thread);
                      }}
                    >
                      {thread.chip}
                    </button>
                  );
                })}
                
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
                    annotations={[]}
                    keyframes={keyframes.filter(k => !k.pinNumber)}
                    pins={keyframes.filter(k => k.pinNumber && k.x !== undefined && k.y !== undefined).map(k => ({
                      id: k.id,
                      time: k.time,
                      comment: k.comment,
                      pinNumber: k.pinNumber!,
                      x: k.x!,
                      y: k.y!,
                    }))}
                    onSeek={(time) => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = time;
                      }
                    }}
                    isPlaying={isPlaying}
                    onPlayPauseChange={setIsPlaying}
                    isDrawingMode={false}
                    onAnnotationClick={() => {}}
                    onKeyframeClick={(keyframeId) => {
                      const keyframe = keyframes.find(k => k.id === keyframeId);
                      if (keyframe) {
                        seekTo(keyframe.time);
                      }
                    }}
                    onPinClick={(pinId) => {
                      const pin = keyframes.find(k => k.id === pinId);
                      if (pin) {
                        seekTo(pin.time);
                        // Scroll to comment in sidebar
                        const element = document.getElementById(`keyframe-${pinId}`);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                  />
                  
                  {/* Clickable Pin Overlay */}
                  <div
                    className={`absolute inset-0 ${isPinMode ? 'cursor-crosshair' : 'pointer-events-none'}`}
                    onClick={handleVideoClick}
                    style={{ zIndex: isPinMode ? 10 : 5 }}
                  >
                    {/* Render pins */}
                    {videoPins.map((pin) => (
                      <div
                        key={pin.id}
                        className="absolute group pointer-events-auto"
                        style={{
                          left: `${pin.x * 100}%`,
                          top: `${pin.y * 100}%`,
                          transform: 'translate(-50%, -100%)',
                        }}
                      >
                        <div className="relative">
                          {/* Pin marker - clickable to focus comment */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const keyframe = keyframes.find(k => k.id === pin.id);
                              if (keyframe) {
                                seekTo(keyframe.time);
                                // Scroll to comment in sidebar
                                const element = document.getElementById(`keyframe-${pin.id}`);
                                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }}
                            className="flex flex-col items-center cursor-pointer transition-transform hover:scale-110"
                          >
                            <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white hover:shadow-xl">
                              {pin.number}
                            </div>
                            <div className="w-0.5 h-4 bg-primary" />
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          </button>
                          
                          {/* Remove button on hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePin(pin.id);
                              handleRemoveKeyframe(pin.id);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
            </Card>
          </div>

          {/* Coluna Direita: Sidebar com Tabs (40% - 2/5 columns) */}
          <div className={`${isMobile ? '' : 'lg:col-span-2 sticky top-6'}`}>
            <Card className={`bg-card border-primary/20 shadow-xl flex flex-col ${isMobile ? 'p-0' : 'p-0'} overflow-hidden`}>
              <Tabs defaultValue="anotacoes" className="flex flex-col h-full">
                <div className="border-b border-border/50 px-4 pt-4">
                  <TabsList className="w-full grid grid-cols-2 mb-4">
                    <TabsTrigger value="anotacoes" className="text-xs sm:text-sm">
                      Anotações
                    </TabsTrigger>
                    <TabsTrigger value="acoes" className="text-xs sm:text-sm">
                      Ações e Aprovação
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                {/* Tab 1: Anotações */}
                <TabsContent value="anotacoes" className="flex-1 overflow-hidden m-0 flex flex-col">
                  
                  <div className="flex-1 overflow-hidden">
                    <CommentsSidebar
                      keyframes={keyframes}
                      annotations={[]}
                      feedbackHistory={feedbackHistory}
                      threads={threads}
                      selectedThreadId={selectedThreadId}
                      currentTime={currentTime}
                      onSeekToTime={seekTo}
                      onLoadAnnotation={() => {}}
                      onUpdateKeyframe={handleKeyframeCommentChange}
                      onDeleteKeyframe={handleRemoveKeyframe}
                      onUpdateAnnotation={() => {}}
                      onDeleteAnnotation={() => {}}
                      onSelectThread={(threadId) => {
                        setSelectedThreadId(threadId);
                        const thread = threads.find(t => t.id === threadId);
                        if (thread) {
                          seekTo(thread.tStart);
                          setOpenThreadDetail(thread);
                        }
                      }}
                      onSeekToThread={(time) => seekTo(time)}
                      formatTime={formatTime}
                    />
                  </div>
                  
                  {/* Fixed Composer */}
                  <div className="sticky bottom-0 bg-background border-t border-border p-4 space-y-3">
                    <Textarea
                      ref={composerRef}
                      placeholder="Escreva aqui seu feedback…"
                      value={composerText}
                      onChange={(e) => setComposerText(e.target.value)}
                      onFocus={onComposerFocus}
                      className="min-h-[80px] text-sm resize-none"
                    />
                    
                    {/* Time Badge */}
                    {tLock !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          ⏱️ {formatTime(tLock)}
                        </Badge>
                        <span>← Comentário será criado neste momento</span>
                      </motion.div>
                    )}
                    
                    {/* Compact Icons for Attachments/Links + Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                        className="p-1.5 hover:bg-accent rounded-md transition-colors"
                        title="Anexar arquivo"
                      >
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => setShowLinkInput(!showLinkInput)}
                        className="p-1.5 hover:bg-accent rounded-md transition-colors"
                        title="Link de vídeo"
                      >
                        <LinkIcon className="w-4 h-4 text-muted-foreground" />
                      </button>
                      
                      <div className="flex-1" /> {/* Spacer */}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelComment}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveComment}
                        disabled={!composerText.trim() || tLock === null}
                      >
                        Salvar
                      </Button>
                    </div>
                    
                    {showAttachmentInput && (
                      <div className="space-y-2">
                        <Input
                          placeholder="URL do arquivo"
                          value={composerAttachmentUrl}
                          onChange={(e) => setComposerAttachmentUrl(e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Nome do arquivo (opcional)"
                          value={composerAttachmentName}
                          onChange={(e) => setComposerAttachmentName(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    )}
                    
                    {showLinkInput && (
                      <Input
                        placeholder="https://..."
                        value={composerLinkUrl}
                        onChange={(e) => setComposerLinkUrl(e.target.value)}
                        className="text-sm"
                      />
                    )}
                  </div>
                </TabsContent>
                
                {/* Tab 2: Ações e Aprovação */}
                <TabsContent value="acoes" className="flex-1 overflow-auto m-0 p-6 space-y-6">
                  {/* Review Status Badge */}
                  <div className="flex justify-center">
                    <Badge 
                      variant="outline"
                      className={`px-3 py-1.5 text-xs font-medium ${
                        reviewStatus === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : reviewStatus === 'changes_requested'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <BadgeIcon className="w-3 h-3 mr-1.5" />
                      {reviewStatus === 'approved' ? 'Aprovado' : reviewStatus === 'changes_requested' ? 'Ajustes solicitados' : 'Em revisão'}
                    </Badge>
                  </div>

                  {/* Compact Rating */}
                  {hasSubmittedRating ? (
                    <div className="text-center">
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
                    <div className="space-y-3">
                      <div>
                        <label className={`block font-medium mb-1.5 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          Avalie sua experiência com a plataforma
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

                      {/* Campo de comentário aparece quando rating > 0 */}
                      {rating > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.3 }}
                        >
                          <label className={`block font-medium mb-1.5 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            Deixe seu depoimento (opcional)
                          </label>
                          <Textarea
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                            placeholder="Conte sobre sua experiência usando a plataforma de aprovação..."
                            className={`w-full resize-none ${isMobile ? 'min-h-[80px] text-sm' : 'min-h-[100px]'}`}
                            disabled={hasSubmittedRating}
                          />
                        </motion.div>
                      )}

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
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>

      </div>
      
      {/* ThreadDetailSheet */}
      <ThreadDetailSheet
        thread={openThreadDetail}
        open={!!openThreadDetail}
        onClose={() => setOpenThreadDetail(null)}
        formatTime={formatTime}
      />
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import ReactPlayer from 'react-player';
import { CheckCircle, MessageSquare, Send, ThumbsUp, XCircle, Plus, Trash2, Loader2, Play, Pause, Rewind, FastForward } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().substr(14, 5);
};

const mockProjects = [
  {
    id: 1,
    shareId: "abc123",
    title: "Campanha Verão 2024",
    description: "Vídeo promocional para a nova coleção de verão",
    status: "pending",
    priority: "high",
    author: "Maria Silva",
    type: "Vídeo",
    createdAt: "2024-01-15",
    keyframes: [
      { id: 1, time: 30, comment: "Ajustar cor do logo", timestamp: "2024-01-15T10:30:00Z" },
      { id: 2, time: 60, comment: "Música muito alta", timestamp: "2024-01-15T11:00:00Z" }
    ],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  },
  {
    id: 2,
    shareId: "def456",
    title: "Banner Black Friday",
    description: "Design para banner da promoção Black Friday",
    status: "approved",
    priority: "medium", 
    author: "João Santos",
    type: "Design",
    createdAt: "2024-01-10",
    keyframes: [],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
  }
];

export default function AudiovisualApproval() {
  const { shareId } = useParams<{ shareId: string }>();
  const { toast } = useToast();
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const playerRef = useRef<any>(null);
  const [keyframes, setKeyframes] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ playedSeconds: 0, played: 0 });
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const foundProject = mockProjects.find(p => p.shareId === shareId);
    if (foundProject) {
      setProject(foundProject);
      setKeyframes(foundProject.keyframes || []);
      if (foundProject.status === 'approved' || foundProject.status === 'feedback-sent' || foundProject.status === 'rejected') {
        setShowConfirmation(true);
      }
    }
    setLoading(false);
  }, [shareId]);

  const handleAddKeyframe = () => {
    const currentTime = progress.playedSeconds;
    if (keyframes.some(k => Math.abs(k.time - currentTime) < 1)) {
        toast({
            title: "Atenção",
            description: "Já existe um keyframe neste ponto do vídeo.",
            variant: "destructive",
            duration: 3000,
        });
        return;
    }

    const newKeyframe = {
      id: Date.now(),
      time: currentTime,
      comment: '',
    };
    setKeyframes(prev => [...prev, newKeyframe].sort((a, b) => a.time - b.time));
    setIsPlaying(false);
  };

  const handleKeyframeCommentChange = (id: number, comment: string) => {
    setKeyframes(keyframes.map(k => k.id === id ? { ...k, comment } : k));
  };
  
  const handleRemoveKeyframe = (id: number) => {
    setKeyframes(keyframes.filter(k => k.id !== id));
  };

  const seekTo = (time: number) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(time, 'seconds');
    setIsPlaying(true);
  };
  
  const handleAction = (action: string) => {
    if (action === 'approved') {
        toast({
            title: "✅ Aprovação Enviada!",
            description: "Obrigado! Sua aprovação foi registrada com sucesso.",
            duration: 6000,
        });
    } else if (action === 'send_feedback') {
        const feedbackData = { keyframes: keyframes.filter(k => k.comment.trim() !== '') };
        toast({
            title: "👍 Feedback Enviado!",
            description: "A equipe foi notificada sobre seus apontamentos.",
            duration: 6000,
        });
    }
    setShowConfirmation(true);
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
    const isFeedback = project.status === 'feedback-sent' || project.status === 'rejected';
    
    let confirmationContent;
    if (isApproved) {
        confirmationContent = {
            icon: <ThumbsUp className="w-20 h-20 text-green-500 mx-auto animate-bounce" />,
            title: 'Projeto Aprovado!',
            message: 'Obrigado pela sua colaboração. A equipe já foi notificada.',
            bg: 'from-green-50 to-emerald-100',
        };
    } else if (isFeedback) {
        confirmationContent = {
            icon: <Send className="w-20 h-20 text-blue-500 mx-auto" />,
            title: 'Feedback Enviado!',
            message: 'Seu feedback foi recebido. Nossa equipe analisará os pontos.',
            bg: 'from-blue-50 to-sky-100',
        };
    } else {
        return null;
    }

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
          <div className="space-y-3">
            <Button className="w-full bg-orange-500 hover:bg-orange-600">
              Voltar ao Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmation(false)}
              className="w-full"
            >
              Revisar Novamente
            </Button>
          </div>
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
            <span>Por {project.author}</span>
            <span>{new Date(project.createdAt).toLocaleDateString('pt-BR')}</span>
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
          <div className="relative w-full bg-black rounded-lg" style={{ paddingBottom: '56.25%' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <Play className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg font-medium">{project.title}</p>
                <p className="text-sm opacity-60">Player integrado com funcionalidades avançadas</p>
              </div>
            </div>
          </div>
          
          {/* Video Controls */}
          <div className="mt-4 flex items-center space-x-4">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              variant="outline"
              size="sm"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button
              onClick={handleAddKeyframe}
              disabled={!isReady}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Comentário
            </Button>
            
            <div className="text-sm text-gray-500">
              {formatTime(progress.playedSeconds)} / {formatTime(duration)}
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
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Aprovar Projeto
            </Button>
            
            <Button
              onClick={() => handleAction('send_feedback')}
              variant="outline"
              className="flex-1"
              disabled={keyframes.filter(k => k.comment.trim() !== '').length === 0}
            >
              <Send className="w-5 h-5 mr-2" />
              Enviar Feedback ({keyframes.filter(k => k.comment.trim() !== '').length})
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import ReactPlayer from 'react-player';
import { CheckCircle, MessageSquare, Send, ThumbsUp, XCircle, Plus, Trash2, Loader2, Play, Pause, Rewind, FastForward } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().substr(14, 5);
};

const AudiovisualApprovalPage = ({ projects, onClientAction }) => {
  const { shareId } = useParams();
  const { toast } = useToast();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const playerRef = useRef(null);
  const [keyframes, setKeyframes] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ playedSeconds: 0, played: 0 });
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    const foundProject = projects.find(p => p.shareId === shareId);
    if (foundProject) {
      setProject(foundProject);
      setKeyframes(foundProject.keyframes || []);
      if (foundProject.status === 'approved' || foundProject.status === 'feedback-sent' || foundProject.status === 'rejected') {
        setShowConfirmation(true);
      }
      const url = foundProject.creatives?.[0]?.attachments?.[0]?.url;
      if (url) {
        setVideoUrl(url);
      }
    }
    setLoading(false);
  }, [shareId, projects]);

  const handleAddKeyframe = () => {
    if (!playerRef.current) return;
    const currentTime = playerRef.current.getCurrentTime();
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

  const handleKeyframeCommentChange = (id, comment) => {
    setKeyframes(keyframes.map(k => k.id === id ? { ...k, comment } : k));
  };
  
  const handleRemoveKeyframe = (id) => {
    setKeyframes(keyframes.filter(k => k.id !== id));
  };

  const seekTo = (time) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(time, 'seconds');
    setIsPlaying(true);
  };
  
  const handleAction = (action) => {
    if (action === 'approved') {
        onClientAction(shareId, 'approved');
        toast({
            title: "✅ Aprovação Enviada!",
            description: "Obrigado! Sua aprovação foi registrada com sucesso.",
            duration: 6000,
        });
    } else if (action === 'send_feedback') {
        const feedbackData = { keyframes: keyframes.filter(k => k.comment.trim() !== '') };
        onClientAction(shareId, 'feedback-sent', feedbackData);
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
        <h1 className="text-2xl font-bold text-foreground">Carregando Projeto...</h1>
        <p className="text-muted-foreground">Estamos preparando tudo para você.</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Projeto não encontrado</h1>
        <p className="text-muted-foreground">O link de aprovação pode estar inválido ou o projeto foi removido.</p>
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
          <h1 className="text-3xl font-bold text-foreground mt-6">
            {confirmationContent.title}
          </h1>
          <p className="text-muted-foreground mt-2">
            {confirmationContent.message}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Aprovação de Vídeo: {project.title}</title>
        <meta name="description" content={`Aprove o vídeo "${project.title}"`} />
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl">
          <header className="text-center mb-8">
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <img alt="OK LAB Logo" className="h-16 w-auto mx-auto mb-4" src="https://images.unsplash.com/photo-1599533508708-b07f6c57d2ba" />
              <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
              <p className="text-muted-foreground mt-1">{project.description}</p>
            </motion.div>
          </header>
          
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div 
              initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="lg:col-span-2 bg-white p-4 rounded-2xl shadow-lg border border-gray-200"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                {videoUrl ? (
                    <ReactPlayer
                        ref={playerRef}
                        url={videoUrl}
                        width="100%"
                        height="100%"
                        playing={isPlaying}
                        onProgress={setProgress}
                        onDuration={setDuration}
                        onReady={() => setIsReady(true)}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        controls={false}
                        playsinline
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
                        <p>Não foi possível carregar o vídeo.</p>
                    </div>
                )}
                 {!isReady && videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </div>
                )}
              </div>
              <div className="mt-4 px-2">
                <div className="relative h-2 bg-gray-200 rounded-full cursor-pointer" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const width = rect.width;
                    const seekTime = (clickX / width) * duration;
                    seekTo(seekTime);
                }}>
                  <div 
                    className="absolute h-2 bg-orange-500 rounded-full" 
                    style={{ width: `${progress.played * 100}%` }}
                  />
                  {keyframes.map(kf => (
                    <div 
                      key={kf.id}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-pointer hover:scale-125 transition-transform"
                      style={{ left: `${(kf.time / duration) * 100}%` }}
                      onClick={(e) => {e.stopPropagation(); seekTo(kf.time)}}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{formatTime(progress.playedSeconds)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center mt-4 space-x-4">
                 <Button onClick={() => playerRef.current && playerRef.current.seekTo(Math.max(0, progress.playedSeconds - 5))} variant="ghost" disabled={!isReady}> <Rewind className="w-5 h-5"/> </Button>
                 <Button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 rounded-full text-2xl" disabled={!isReady}>
                    {isPlaying ? <Pause className="w-8 h-8"/> : <Play className="w-8 h-8 ml-1"/>}
                 </Button>
                 <Button onClick={() => playerRef.current && playerRef.current.seekTo(Math.min(duration, progress.playedSeconds + 5))} variant="ghost" disabled={!isReady}> <FastForward className="w-5 h-5"/> </Button>
              </div>

              <div className="mt-6 text-center">
                 <Button onClick={handleAddKeyframe} className="bg-blue-500 hover:bg-blue-600" disabled={!isReady}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Keyframe para Comentário
                 </Button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 flex flex-col"
            >
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                <MessageSquare className="w-6 h-6 mr-3 text-orange-500" />
                Pontos de Ajuste
              </h2>
              <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                <AnimatePresence>
                  {keyframes.length > 0 ? keyframes.map(kf => (
                    <motion.div 
                        key={kf.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-gray-50 p-4 rounded-lg border"
                    >
                      <div className="flex justify-between items-center mb-2">
                          <Button variant="link" className="p-0 h-auto" onClick={() => seekTo(kf.time)}>
                            <span className="font-mono text-blue-600">@{formatTime(kf.time)}</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleRemoveKeyframe(kf.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                      </div>
                      <Textarea 
                        placeholder="Escreva seu comentário aqui..."
                        value={kf.comment}
                        onChange={(e) => handleKeyframeCommentChange(kf.id, e.target.value)}
                        className="text-sm"
                      />
                    </motion.div>
                  )) : (
                    <div className="text-center text-gray-500 py-10">
                      <p>Nenhum ponto de ajuste criado.</p>
                      <p className="text-sm mt-1">Aprove o vídeo ou crie um keyframe para comentar.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
              <div className="mt-6 pt-6 border-t">
                 <div className="grid grid-cols-1 gap-3">
                    <Button 
                      onClick={() => handleAction('send_feedback')}
                      disabled={!isReady || keyframes.length === 0 || keyframes.every(k => k.comment.trim() === '')}
                      className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300"
                    >
                      <Send className="w-4 h-4 mr-2"/>
                      Enviar Feedback
                    </Button>
                    <Button 
                      onClick={() => handleAction('approved')}
                      disabled={!isReady || keyframes.length > 0}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300"
                    >
                      <CheckCircle className="w-4 h-4 mr-2"/>
                      Aprovar Vídeo na Íntegra
                    </Button>
                 </div>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AudiovisualApprovalPage;
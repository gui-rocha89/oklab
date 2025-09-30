import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  CheckCircle, 
  MessageCircle, 
  Clock, 
  Eye,
  Pencil,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CustomVideoPlayer } from './CustomVideoPlayer';
import { VideoAnnotationCanvas } from './VideoAnnotationCanvas';
import { useVideoAnnotations } from '@/hooks/useVideoAnnotations';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AudiovisualFeedbackPanelProps {
  projectId: string;
  projectTitle: string;
  projectDescription?: string;
  videoUrl: string;
  shareId: string;
  onStatusChange?: (status: 'pending' | 'resolved' | 'rejected') => void;
}

export const AudiovisualFeedbackPanel: React.FC<AudiovisualFeedbackPanelProps> = ({
  projectId,
  projectTitle,
  projectDescription,
  videoUrl,
  shareId,
  onStatusChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [keyframes, setKeyframes] = useState<any[]>([]);
  const [responses, setResponses] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const {
    annotations,
    loadAnnotations,
    isDrawingMode,
    setCanvas,
  } = useVideoAnnotations(projectId);

  useEffect(() => {
    loadAnnotations();
    loadKeyframes();
  }, [projectId]);

  const loadKeyframes = async () => {
    try {
      const { data, error } = await supabase
        .from('project_keyframes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setKeyframes(data || []);
    } catch (error) {
      console.error('Error loading keyframes:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (ms: number): string => {
    return formatTime(ms / 1000);
  };

  const navigateToAnnotation = (timestampMs: number, annotationId: string) => {
    if (videoRef.current) {
      const timeInSeconds = timestampMs / 1000;
      videoRef.current.currentTime = timeInSeconds;
      setCurrentTime(timeInSeconds);
      setSelectedAnnotation(annotationId);
      setIsPlaying(false);
    }
  };

  const handleResolveAnnotation = async (annotationId: string) => {
    try {
      const { error } = await supabase
        .from('video_annotations')
        .update({ 
          comment: annotations.find(a => a.id === annotationId)?.comment + ' [RESOLVIDO]' 
        })
        .eq('id', annotationId);

      if (error) throw error;

      toast({
        title: "✅ Anotação Resolvida",
        description: "Anotação marcada como resolvida com sucesso.",
      });

      loadAnnotations();
      onStatusChange?.('resolved');
    } catch (error) {
      console.error('Error resolving annotation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível resolver a anotação.",
        variant: "destructive"
      });
    }
  };

  const handleRespondToAnnotation = async (annotationId: string) => {
    const response = responses[annotationId];
    if (!response?.trim()) {
      toast({
        title: "Atenção",
        description: "Digite uma resposta antes de enviar.",
        variant: "destructive"
      });
      return;
    }

    try {
      const annotation = annotations.find(a => a.id === annotationId);
      const newComment = `${annotation?.comment || ''}\n\n[RESPOSTA]: ${response}`;

      const { error } = await supabase
        .from('video_annotations')
        .update({ comment: newComment })
        .eq('id', annotationId);

      if (error) throw error;

      toast({
        title: "✅ Resposta Enviada",
        description: "Sua resposta foi registrada com sucesso.",
      });

      setResponses(prev => ({ ...prev, [annotationId]: '' }));
      loadAnnotations();
    } catch (error) {
      console.error('Error responding to annotation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a resposta.",
        variant: "destructive"
      });
    }
  };

  const allAnnotations = [
    ...annotations.map(a => ({ 
      type: 'visual' as const, 
      ...a, 
      timestamp: a.timestamp_ms 
    })),
    ...keyframes.flatMap(kf => 
      kf.attachments?.map((att: any, idx: number) => ({
        type: 'keyframe' as const,
        id: `${kf.id}-${idx}`,
        timestamp: 0,
        comment: kf.title,
        keyframe: kf
      })) || []
    )
  ].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="space-y-6">
      {/* Header do Projeto */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{projectTitle}</CardTitle>
              {projectDescription && (
                <p className="text-muted-foreground">{projectDescription}</p>
              )}
            </div>
            <Badge variant="outline" className="text-sm">
              <MessageCircle className="w-3 h-3 mr-1" />
              {allAnnotations.length} feedbacks
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Player de Vídeo + Lista de Anotações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <CustomVideoPlayer
                  src={videoUrl}
                  currentTime={currentTime}
                  onTimeUpdate={setCurrentTime}
                  onDurationChange={setDuration}
                  annotations={annotations}
                  isPlaying={isPlaying}
                  onPlayPauseChange={setIsPlaying}
                  isDrawingMode={isDrawingMode}
                  onAnnotationClick={(id) => {
                    setSelectedAnnotation(id);
                  }}
                />
                
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  <VideoAnnotationCanvas
                    videoRef={videoRef}
                    isDrawingMode={false}
                    currentTool="select"
                    brushColor="#ff0000"
                    brushWidth={3}
                    onCanvasReady={setCanvas}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instruções */}
          <Card className="border-0 shadow-sm mt-4">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Como revisar:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Clique nas anotações ao lado para navegar pelo vídeo</li>
                    <li>Responda aos comentários quando necessário</li>
                    <li>Marque como resolvido após atender o feedback</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Anotações */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-md sticky top-6 max-h-[calc(100vh-120px)] overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Feedbacks ({allAnnotations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-y-auto max-h-[calc(100vh-240px)]">
                {allAnnotations.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum feedback ainda</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {allAnnotations.map((annotation, index) => {
                      const isSelected = selectedAnnotation === annotation.id;
                      const isVisual = annotation.type === 'visual';
                      
                      return (
                        <motion.div
                          key={annotation.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 cursor-pointer hover:bg-accent/50 transition-colors ${
                            isSelected ? 'bg-accent' : ''
                          }`}
                          onClick={() => navigateToAnnotation(annotation.timestamp, annotation.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {isVisual ? (
                                <Pencil className="w-4 h-4 text-yellow-600" />
                              ) : (
                                <MessageCircle className="w-4 h-4 text-blue-600" />
                              )}
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTimestamp(annotation.timestamp)}
                              </Badge>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${
                              isSelected ? 'rotate-90' : ''
                            }`} />
                          </div>

                          {annotation.comment && (
                            <p className="text-sm text-foreground mb-3 line-clamp-3">
                              {annotation.comment}
                            </p>
                          )}

                          {/* Área de Resposta */}
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-3 pt-3 border-t border-border space-y-2"
                            >
                              <Textarea
                                placeholder="Digite sua resposta..."
                                value={responses[annotation.id] || ''}
                                onChange={(e) => setResponses(prev => ({ 
                                  ...prev, 
                                  [annotation.id]: e.target.value 
                                }))}
                                className="min-h-[80px] text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRespondToAnnotation(annotation.id);
                                  }}
                                  className="flex-1"
                                >
                                  Responder
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleResolveAnnotation(annotation.id);
                                  }}
                                  className="flex-1"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Resolver
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

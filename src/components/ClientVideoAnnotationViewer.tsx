import { useState, useRef, useEffect } from "react";
import { Canvas as FabricCanvas, util } from "fabric";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipBack, SkipForward, Maximize, MessageSquare, Pencil, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { convertFromReferenceResolution, REFERENCE_WIDTH, REFERENCE_HEIGHT } from "@/lib/annotationUtils";
import { useVideoAspectRatio } from "@/hooks/useVideoAspectRatio";

interface VideoAnnotation {
  id: string;
  timestamp_ms: number;
  comment: string | null;
  canvas_data: any;
  created_at: string;
}

interface ClientVideoAnnotationViewerProps {
  videoUrl: string;
  annotations: VideoAnnotation[];
}

export const ClientVideoAnnotationViewer = ({ videoUrl, annotations }: ClientVideoAnnotationViewerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentAnnotationIndex, setCurrentAnnotationIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Hook para detectar proporção do vídeo automaticamente (Frame.IO style)
  const { aspectRatio, isReady: videoReady } = useVideoAspectRatio(videoRef);

  // Inicializar canvas e configurar dimensões baseadas no player renderizado
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || !containerRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      selection: false,
      hoverCursor: 'default',
      moveCursor: 'default',
    });
    
    fabricCanvasRef.current = canvas;

    const updateCanvasSize = () => {
      if (!videoRef.current || !canvas || !containerRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const container = containerRef.current;
      const canvasElement = canvasRef.current;
      
      // Obter dimensões RENDERIZADAS e calcular offset exato
      const videoRect = video.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const offsetLeft = videoRect.left - containerRect.left;
      const offsetTop = videoRect.top - containerRect.top;
      
      // Posicionar canvas EXATAMENTE sobre o vídeo
      canvasElement.style.left = `${offsetLeft}px`;
      canvasElement.style.top = `${offsetTop}px`;
      canvasElement.style.width = `${videoRect.width}px`;
      canvasElement.style.height = `${videoRect.height}px`;
      
      canvas.setDimensions({
        width: videoRect.width,
        height: videoRect.height,
      });
      canvas.renderAll();
      
      console.log('📐 Canvas posicionado:', {
        videoSize: `${videoRect.width}x${videoRect.height}`,
        offset: `left=${offsetLeft}px, top=${offsetTop}px`,
        aspectRatio: (videoRect.width / videoRect.height).toFixed(3)
      });
    };

    // Aguardar carregamento do vídeo antes de dimensionar
    const video = videoRef.current;
    video.addEventListener('loadedmetadata', updateCanvasSize);
    video.addEventListener('canplay', updateCanvasSize);
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      video.removeEventListener('loadedmetadata', updateCanvasSize);
      video.removeEventListener('canplay', updateCanvasSize);
      window.removeEventListener('resize', updateCanvasSize);
      canvas.dispose();
    };
  }, []);

  // Atualizar anotação atual baseado no tempo do vídeo
  useEffect(() => {
    if (annotations.length === 0) return;

    // Encontrar a anotação mais próxima do tempo atual
    const closest = annotations.reduce((prev, curr, index) => {
      const prevDiff = Math.abs(prev.annotation.timestamp_ms - currentTime);
      const currDiff = Math.abs(curr.timestamp_ms - currentTime);
      
      return currDiff < prevDiff ? { annotation: curr, index } : prev;
    }, { annotation: annotations[0], index: 0 });

    // Se estiver muito próximo (dentro de 2 segundos), mostrar a anotação
    if (Math.abs(closest.annotation.timestamp_ms - currentTime) < 2000) {
      if (currentAnnotationIndex !== closest.index) {
        setCurrentAnnotationIndex(closest.index);
        loadAnnotationToCanvas(closest.annotation);
      }
    } else if (currentAnnotationIndex !== null) {
      setCurrentAnnotationIndex(null);
      clearCanvas();
    }
  }, [currentTime, annotations]);

  const loadAnnotationToCanvas = async (annotation: VideoAnnotation) => {
    if (!fabricCanvasRef.current || !videoRef.current) return;

    const canvas = fabricCanvasRef.current;
    const video = videoRef.current;
    
    try {
      clearCanvas();
      
      if (!annotation.canvas_data?.objects || annotation.canvas_data.objects.length === 0) {
        return;
      }

      // Usar dimensões RENDERIZADAS do vídeo (player atual)
      const rect = video.getBoundingClientRect();
      const currentWidth = Math.floor(rect.width);
      const currentHeight = Math.floor(rect.height);

      canvas.setDimensions({
        width: currentWidth,
        height: currentHeight
      });

      // Converter objetos da resolução de referência para o tamanho ATUAL do player
      const convertedObjects = convertFromReferenceResolution(
        annotation.canvas_data.objects || [],
        currentWidth,
        currentHeight
      );

      console.log('🎯 Carregando anotação:', {
        reference: `${REFERENCE_WIDTH}x${REFERENCE_HEIGHT}`,
        currentPlayer: `${currentWidth}x${currentHeight}`,
        scaleX: (currentWidth / REFERENCE_WIDTH).toFixed(3),
        scaleY: (currentHeight / REFERENCE_HEIGHT).toFixed(3),
        objectCount: convertedObjects.length
      });

      const objects = await util.enlivenObjects(convertedObjects);

      objects.forEach((obj: any, index: number) => {
        if (obj) {
          console.log(`🎨 Objeto ${index} (${obj.type}): pos=(${obj.left?.toFixed(1)}, ${obj.top?.toFixed(1)}) scale=(${obj.scaleX?.toFixed(2)}, ${obj.scaleY?.toFixed(2)})`);
          
          obj.set({
            selectable: false,
            evented: false,
            stroke: '#FF0000',
            strokeWidth: 5,
            fill: obj.type === 'path' ? undefined : (obj.fill || 'rgba(255, 0, 0, 0.3)')
          });
          obj.setCoords();
          canvas.add(obj);
        }
      });

      console.log(`✅ ${objects.length} objetos adicionados ao canvas`);

      canvas.renderAll();
    } catch (error) {
      console.error('Erro ao carregar anotação:', error);
    }
  };

  const clearCanvas = () => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      canvas.clear();
      canvas.renderAll();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime * 1000);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration * 1000);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekToAnnotation = (annotation: VideoAnnotation, index: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = annotation.timestamp_ms / 1000;
    setCurrentAnnotationIndex(index);
    loadAnnotationToCanvas(annotation);
    
    // Pausar para visualizar a anotação
    videoRef.current.pause();
    setIsPlaying(false);
  };

  const skipToPrevAnnotation = () => {
    if (currentAnnotationIndex === null || currentAnnotationIndex === 0) return;
    const prevIndex = currentAnnotationIndex - 1;
    seekToAnnotation(annotations[prevIndex], prevIndex);
  };

  const skipToNextAnnotation = () => {
    if (currentAnnotationIndex === null || currentAnnotationIndex >= annotations.length - 1) return;
    const nextIndex = currentAnnotationIndex + 1;
    seekToAnnotation(annotations[nextIndex], nextIndex);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTimestamp = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const currentAnnotation = currentAnnotationIndex !== null ? annotations[currentAnnotationIndex] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Video Player (60%) - Adaptativo */}
      <div className="lg:col-span-3">
        <Card className="overflow-hidden border-0 shadow-lg">
          {/* Container adaptativo que respeita a proporção do vídeo */}
          <div 
            ref={containerRef} 
            className="relative w-full bg-black group flex items-center justify-center"
            style={{ 
              aspectRatio: aspectRatio.toString(),
              maxHeight: '70vh'
            }}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Canvas para anotações - posicionado exatamente sobre o vídeo */}
            <canvas
              ref={canvasRef}
              className="absolute pointer-events-none"
              style={{ zIndex: 30 }}
            />

            {/* Overlay para controles - aparece no hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />

            {/* Play/Pause Central */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <Button
                  size="icon"
                  onClick={togglePlay}
                  className="w-20 h-20 rounded-full bg-primary/90 hover:bg-primary backdrop-blur-sm shadow-2xl"
                >
                  <Play className="w-10 h-10 ml-1" />
                </Button>
              </div>
            )}

            {/* Controles Inferiores */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Timeline com marcadores */}
              <div className="mb-3">
                <div className="relative h-2 bg-white/10 rounded-full backdrop-blur-sm overflow-visible cursor-pointer group/timeline">
                  {/* Progresso */}
                  <div 
                    className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  
                  {/* Marcadores de anotações */}
                  {annotations.map((annotation, index) => (
                    <button
                      key={annotation.id}
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all z-10",
                        "w-3 h-3 rounded-full border-2 border-white shadow-lg",
                        "hover:scale-150 hover:shadow-xl",
                        currentAnnotationIndex === index 
                          ? "bg-primary scale-125 shadow-primary/50" 
                          : "bg-warning hover:bg-warning/80"
                      )}
                      style={{ left: `${(annotation.timestamp_ms / duration) * 100}%` }}
                      onClick={() => seekToAnnotation(annotation, index)}
                      title={`${index + 1}. ${formatTimestamp(annotation.timestamp_ms)}`}
                    />
                  ))}
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center gap-3">
                {/* Controles de navegação */}
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={skipToPrevAnnotation}
                    disabled={currentAnnotationIndex === null || currentAnnotationIndex === 0}
                    className="h-9 w-9 text-white hover:bg-white/20 disabled:opacity-30"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={togglePlay}
                    className="h-10 w-10 text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </Button>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={skipToNextAnnotation}
                    disabled={currentAnnotationIndex === null || currentAnnotationIndex >= annotations.length - 1}
                    className="h-9 w-9 text-white hover:bg-white/20 disabled:opacity-30"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>

                {/* Timestamp */}
                <span className="text-white text-sm font-mono px-2 py-1 bg-black/30 rounded backdrop-blur-sm">
                  {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
                </span>

                <div className="flex-1" />

                {/* Fullscreen */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleFullscreen}
                  className="h-9 w-9 text-white hover:bg-white/20"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Painel Lateral - Lista de Anotações (40%) */}
      <div className="lg:col-span-2">
        <Card className="sticky top-4 max-h-[70vh] flex flex-col">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Anotações
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {annotations.length} comentário{annotations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Lista scrollável */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2">
              {annotations.map((annotation, index) => {
                const hasDrawing = annotation.canvas_data?.objects?.length > 0;
                const isCurrentAnnotation = currentAnnotationIndex === index;
                
                return (
                  <button
                    key={annotation.id}
                    onClick={() => seekToAnnotation(annotation, index)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      "hover:shadow-md hover:scale-[1.02]",
                      isCurrentAnnotation 
                        ? "bg-primary/10 border-primary shadow-sm" 
                        : "bg-background hover:bg-muted/50 border-border"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm flex-shrink-0",
                        isCurrentAnnotation
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="font-mono font-semibold text-sm">
                            {formatTimestamp(annotation.timestamp_ms)}
                          </span>
                        </div>
                        
                        {annotation.comment && (
                          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2 mb-2">
                            {annotation.comment}
                          </p>
                        )}
                        
                        {hasDrawing && (
                          <Badge variant="secondary" className="text-xs">
                            <Pencil className="w-3 h-3 mr-1" />
                            {annotation.canvas_data.objects.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anotação Atual - Overlay Flutuante */}
      {currentAnnotation && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full px-4 pointer-events-none lg:hidden animate-fade-in">
          <div className="bg-background/98 backdrop-blur-md border shadow-2xl rounded-lg p-4 pointer-events-auto">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                {(currentAnnotationIndex || 0) + 1}
              </div>
              <div className="flex-1 min-w-0">
                {currentAnnotation.comment && (
                  <p className="text-sm leading-relaxed mb-2">{currentAnnotation.comment}</p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTimestamp(currentAnnotation.timestamp_ms)}
                  </Badge>
                  {currentAnnotation.canvas_data?.objects?.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Pencil className="w-3 h-3 mr-1" />
                      {currentAnnotation.canvas_data.objects.length} desenho(s)
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

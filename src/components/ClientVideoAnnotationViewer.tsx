import { useState, useRef, useEffect } from "react";
import { Canvas as FabricCanvas, util } from "fabric";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Play, Pause, SkipBack, SkipForward, Maximize, MessageSquare, Pencil, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);
  const [originalCanvasDimensions, setOriginalCanvasDimensions] = useState<{ width: number; height: number } | null>(null);

  // Inicializar canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      selection: false,
      hoverCursor: 'default',
      moveCursor: 'default',
    });
    
    fabricCanvasRef.current = canvas;

    const updateCanvasSize = () => {
      if (!videoRef.current || !canvas) return;
      
      const video = videoRef.current;
      const rect = video.getBoundingClientRect();
      
      canvas.setDimensions({
        width: rect.width,
        height: rect.height,
      });
      canvas.renderAll();
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
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
    if (!fabricCanvasRef.current || !videoRef.current) {
      console.log('❌ Canvas ou video não disponível');
      return;
    }

    const canvas = fabricCanvasRef.current;
    const video = videoRef.current;
    
    try {
      clearCanvas();
      
      if (!annotation.canvas_data?.objects || annotation.canvas_data.objects.length === 0) {
        console.log('⚠️ Nenhum objeto para carregar');
        return;
      }

      // Get exact video element dimensions
      const videoRect = video.getBoundingClientRect();
      const currentWidth = Math.floor(videoRect.width);
      const currentHeight = Math.floor(videoRect.height);

      console.log('🎯 DIMENSÕES:');
      console.log('Video nativo:', video.videoWidth, 'x', video.videoHeight);
      console.log('Video renderizado:', currentWidth, 'x', currentHeight);
      console.log('Canvas atual:', canvas.width, canvas.height);

      // Resize canvas to EXACTLY match video element
      canvas.setDimensions({
        width: currentWidth,
        height: currentHeight
      });

      console.log('Canvas redimensionado para:', canvas.width, 'x', canvas.height);

      // Calculate scale based on original canvas dimensions in the annotation data
      const originalWidth = annotation.canvas_data.width || video.videoWidth;
      const originalHeight = annotation.canvas_data.height || video.videoHeight;
      
      const scaleX = currentWidth / originalWidth;
      const scaleY = currentHeight / originalHeight;
      
      console.log('🔢 ESCALA:', { scaleX, scaleY, originalWidth, originalHeight });
      console.log('📦 Objetos a carregar:', annotation.canvas_data.objects.length);

      // DEBUG: Super visible background
      canvas.backgroundColor = 'rgba(255, 0, 0, 0.3)';
      canvas.renderAll();

      // Load objects from JSON - Fabric.js v6
      const objects = await util.enlivenObjects(annotation.canvas_data.objects);

      console.log('✅ Objetos criados:', objects.length);

      // Add each object with proper scaling
      objects.forEach((obj: any, index) => {
        if (obj) {
          const originalLeft = obj.left || 0;
          const originalTop = obj.top || 0;
          
          // Apply scaling to position and size
          obj.set({
            left: originalLeft * scaleX,
            top: originalTop * scaleY,
            scaleX: (obj.scaleX || 1) * scaleX,
            scaleY: (obj.scaleY || 1) * scaleY,
            selectable: false,
            evented: false,
            stroke: obj.stroke || '#ff0000',
            strokeWidth: (obj.strokeWidth || 2) * Math.max(scaleX, scaleY),
            fill: obj.fill || 'transparent'
          });
          
          obj.setCoords();
          canvas.add(obj);
          
          console.log(`✏️ Objeto ${index + 1}:`, {
            tipo: obj.type,
            original: `${originalLeft}, ${originalTop}`,
            escalado: `${obj.left}, ${obj.top}`,
            visivel: obj.left >= 0 && obj.left <= currentWidth && obj.top >= 0 && obj.top <= currentHeight
          });
        }
      });

      // Force multiple renders with RAF
      canvas.renderAll();
      requestAnimationFrame(() => {
        canvas.renderAll();
        requestAnimationFrame(() => {
          canvas.renderAll();
          console.log('🎨 Renderização completa! Total de objetos:', canvas.getObjects().length);
        });
      });

    } catch (error) {
      console.error('❌ Erro ao carregar anotação:', error);
    }
  };

  const clearCanvas = () => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      canvas.clear();
      canvas.backgroundColor = 'transparent';
      canvas.renderAll();
      console.log('🧹 Canvas limpo');
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
      
      // Detectar aspect ratio nativo do vídeo
      const video = videoRef.current;
      if (video.videoWidth && video.videoHeight) {
        const aspectRatio = video.videoWidth / video.videoHeight;
        console.log(`📹 Vídeo carregado: ${video.videoWidth}x${video.videoHeight} (aspect ratio: ${aspectRatio.toFixed(2)})`);
        setVideoAspectRatio(aspectRatio);
        setOriginalCanvasDimensions({ width: video.videoWidth, height: video.videoHeight });
      }
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Video Player - Área Principal */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="overflow-hidden border-0 shadow-lg">
          <AspectRatio ratio={videoAspectRatio}>
            <div ref={containerRef} className="relative w-full h-full group">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            
            {/* Canvas para anotações */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ 
                zIndex: 30,
                border: '3px solid lime',
                boxSizing: 'border-box'
              }}
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
          </AspectRatio>
        </Card>
      </div>

      {/* Painel Lateral - Lista de Anotações */}
      <div className="lg:col-span-1">
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

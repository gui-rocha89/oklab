import { useState, useRef, useEffect } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      canvas.setDimensions({
        width: video.offsetWidth,
        height: video.offsetHeight,
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

  const loadAnnotationToCanvas = (annotation: VideoAnnotation) => {
    if (!fabricCanvasRef.current || !annotation.canvas_data) return;

    const canvas = fabricCanvasRef.current;
    canvas.clear();

    // Carregar os objetos do canvas_data
    if (annotation.canvas_data.objects) {
      canvas.loadFromJSON(annotation.canvas_data, () => {
        canvas.renderAll();
        // Desabilitar interação com objetos
        canvas.forEachObject((obj) => {
          obj.selectable = false;
          obj.evented = false;
        });
      });
    }
  };

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.clear();
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
    <div className="space-y-4">
      {/* Video Player com Canvas Sobreposto */}
      <Card>
        <CardContent className="p-0">
          <div ref={containerRef} className="relative bg-black aspect-video">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Canvas para anotações */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ zIndex: 10 }}
            />

            {/* Informação da anotação atual */}
            {currentAnnotation && (
              <div className="absolute top-4 left-4 right-4 z-20">
                <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                      {(currentAnnotationIndex || 0) + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      {currentAnnotation.comment && (
                        <p className="text-sm leading-relaxed mb-2">{currentAnnotation.comment}</p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {currentAnnotation.canvas_data?.objects?.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Pencil className="w-3 h-3 mr-1" />
                            {currentAnnotation.canvas_data.objects.length} desenho(s)
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(currentAnnotation.timestamp_ms)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Controles do Player */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-20">
              <div className="flex items-center gap-2 mb-3">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={skipToPrevAnnotation}
                  disabled={currentAnnotationIndex === null || currentAnnotationIndex === 0}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="w-5 h-5" />
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={skipToNextAnnotation}
                  disabled={currentAnnotationIndex === null || currentAnnotationIndex >= annotations.length - 1}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>

                <div className="flex-1 px-3">
                  <div className="relative">
                    <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                    {/* Marcadores de anotações */}
                    {annotations.map((annotation, index) => (
                      <div
                        key={annotation.id}
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white cursor-pointer transition-all hover:scale-125",
                          currentAnnotationIndex === index ? "bg-primary" : "bg-warning"
                        )}
                        style={{ left: `${(annotation.timestamp_ms / duration) * 100}%` }}
                        onClick={() => seekToAnnotation(annotation, index)}
                        title={`Anotação ${index + 1}: ${formatTimestamp(annotation.timestamp_ms)}`}
                      />
                    ))}
                  </div>
                </div>

                <span className="text-white text-sm font-mono min-w-[80px] text-right">
                  {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
                </span>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Anotações */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Navegação Rápida ({annotations.length} anotações)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {annotations.map((annotation, index) => (
              <Button
                key={annotation.id}
                variant={currentAnnotationIndex === index ? "default" : "outline"}
                size="sm"
                onClick={() => seekToAnnotation(annotation, index)}
                className="flex flex-col h-auto py-2"
              >
                <span className="font-bold text-lg">{index + 1}</span>
                <span className="text-xs font-mono">{formatTimestamp(annotation.timestamp_ms)}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

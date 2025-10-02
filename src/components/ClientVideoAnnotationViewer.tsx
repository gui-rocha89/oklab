import { useState, useRef, useEffect } from "react";
import { Canvas as FabricCanvas, util } from "fabric";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkipBack, SkipForward, MessageSquare, Pencil, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { convertFromReferenceResolution, REFERENCE_WIDTH, REFERENCE_HEIGHT } from "@/lib/annotationUtils";
import { useVideoAspectRatio } from "@/hooks/useVideoAspectRatio";
import { toast } from "sonner";
import { CustomVideoPlayer } from "./CustomVideoPlayer";

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
      
      // ✅ Recarregar anotação atual após redimensionar
      if (currentAnnotationIndex !== null && annotations[currentAnnotationIndex]) {
        setTimeout(() => {
          loadAnnotationToCanvas(annotations[currentAnnotationIndex]);
        }, 50);
      } else {
        canvas.renderAll();
      }
      
      console.log('📐 Canvas redimensionado e anotação recarregada:', {
        videoSize: `${videoRect.width}x${videoRect.height}`,
        offset: `left=${offsetLeft}px, top=${offsetTop}px`,
        activeAnnotation: currentAnnotationIndex !== null
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
  }, [currentAnnotationIndex, annotations]);

  // Listener para fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setTimeout(() => {
        if (videoRef.current && fabricCanvasRef.current && containerRef.current && canvasRef.current) {
          const canvas = fabricCanvasRef.current;
          const video = videoRef.current;
          const container = containerRef.current;
          const canvasElement = canvasRef.current;
          
          const videoRect = video.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          const offsetLeft = videoRect.left - containerRect.left;
          const offsetTop = videoRect.top - containerRect.top;
          
          canvasElement.style.left = `${offsetLeft}px`;
          canvasElement.style.top = `${offsetTop}px`;
          canvasElement.style.width = `${videoRect.width}px`;
          canvasElement.style.height = `${videoRect.height}px`;
          
          canvas.setDimensions({
            width: videoRect.width,
            height: videoRect.height,
          });
          
          if (currentAnnotationIndex !== null && annotations[currentAnnotationIndex]) {
            loadAnnotationToCanvas(annotations[currentAnnotationIndex]);
          } else {
            canvas.renderAll();
          }
        }
      }, 100);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [currentAnnotationIndex, annotations]);

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
      console.error('❌ Canvas ou vídeo não disponível');
      return;
    }

    const canvas = fabricCanvasRef.current;
    const video = videoRef.current;
    
    try {
      console.group('🎯 CARREGANDO ANOTAÇÃO');
      console.log('Annotation ID:', annotation.id);
      console.log('Timestamp:', annotation.timestamp_ms, 'ms');
      
      clearCanvas();
      
      if (!annotation.canvas_data) {
        console.warn('⚠️ Sem canvas_data na anotação');
        console.groupEnd();
        return;
      }

      if (!annotation.canvas_data.objects || annotation.canvas_data.objects.length === 0) {
        console.warn('⚠️ Sem objetos no canvas_data');
        console.groupEnd();
        return;
      }

      // Usar dimensões RENDERIZADAS do vídeo (player atual)
      const rect = video.getBoundingClientRect();
      const currentWidth = Math.floor(rect.width);
      const currentHeight = Math.floor(rect.height);

      if (currentWidth === 0 || currentHeight === 0) {
        console.error('❌ Dimensões do vídeo inválidas:', { currentWidth, currentHeight });
        console.groupEnd();
        return;
      }

      console.log('📐 Dimensões:');
      console.log('  - Referência:', `${REFERENCE_WIDTH}x${REFERENCE_HEIGHT}`);
      console.log('  - Player atual:', `${currentWidth}x${currentHeight}`);
      console.log('  - Escala X:', (currentWidth / REFERENCE_WIDTH).toFixed(3));
      console.log('  - Escala Y:', (currentHeight / REFERENCE_HEIGHT).toFixed(3));

      canvas.setDimensions({
        width: currentWidth,
        height: currentHeight
      });

      // Log dos dados originais antes da conversão
      console.log('📦 Dados originais:', JSON.stringify(annotation.canvas_data.objects[0], null, 2).substring(0, 200));

      // Converter objetos da resolução de referência para o tamanho ATUAL do player
      const convertedObjects = convertFromReferenceResolution(
        annotation.canvas_data.objects || [],
        currentWidth,
        currentHeight
      );

      console.log(`🔄 ${convertedObjects.length} objetos convertidos`);
      console.log('Converted data sample:', JSON.stringify(convertedObjects[0], null, 2).substring(0, 300));

      // Adicionar objetos diretamente sem usar enlivenObjects (mais compatível com v6)
      let addedCount = 0;
      for (let i = 0; i < convertedObjects.length; i++) {
        const objData = convertedObjects[i];
        console.log(`🎨 Processando objeto ${i}:`, {
          type: objData.type,
          left: objData.left,
          top: objData.top,
          width: objData.width,
          height: objData.height
        });

        try {
          let obj;
          const normalizedType = objData.type?.toLowerCase();
          
          if (normalizedType === 'path') {
            // Para caminhos (desenho livre)
            const { Path } = await import('fabric');
            obj = new Path(objData.path, {
              ...objData,
              stroke: objData.stroke || '#FF0000',
              strokeWidth: objData.strokeWidth || 3,
              fill: undefined,
              selectable: false,
              evented: false
            });
          } else if (normalizedType === 'circle') {
            const { Circle } = await import('fabric');
            obj = new Circle({
              ...objData,
              stroke: objData.stroke || '#FF0000',
              strokeWidth: objData.strokeWidth || 3,
              fill: objData.fill || 'rgba(255, 0, 0, 0.1)',
              selectable: false,
              evented: false
            });
          } else if (normalizedType === 'rect') {
            const { Rect } = await import('fabric');
            obj = new Rect({
              ...objData,
              stroke: objData.stroke || '#FF0000',
              strokeWidth: objData.strokeWidth || 3,
              fill: objData.fill || 'rgba(255, 0, 0, 0.1)',
              selectable: false,
              evented: false
            });
          } else if (normalizedType === 'textbox' || normalizedType === 'text') {
            const { Textbox } = await import('fabric');
            obj = new Textbox(objData.text || '', {
              ...objData,
              fill: objData.fill || '#FF0000',
              selectable: false,
              evented: false
            });
          }

          if (obj) {
            canvas.add(obj);
            addedCount++;
            console.log(`✅ Objeto ${i} adicionado com sucesso`);
          }
        } catch (error) {
          console.error(`❌ Erro ao criar objeto ${i}:`, error);
        }
      }

      console.log(`✅ ${addedCount}/${convertedObjects.length} objetos adicionados ao canvas`);

      canvas.renderAll();
      
      // Verificação final
      const finalObjectCount = canvas.getObjects().length;
      console.log(`🎯 Canvas final contém ${finalObjectCount} objetos`);
      
      if (finalObjectCount === 0) {
        console.error('❌ PROBLEMA: Canvas está vazio após carregar anotação!');
      }
      
      console.groupEnd();
    } catch (error) {
      console.error('❌ ERRO ao carregar anotação:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
      console.groupEnd();
      toast.error('Erro ao carregar desenho da anotação');
    }
  };

  const clearCanvas = () => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      canvas.clear();
      canvas.renderAll();
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time * 1000);
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration * 1000);
  };

  const handlePlayPauseChange = (playing: boolean) => {
    setIsPlaying(playing);
  };

  const seekToAnnotation = (annotation: VideoAnnotation, index: number) => {
    const timeInSeconds = annotation.timestamp_ms / 1000;
    setCurrentTime(annotation.timestamp_ms);
    setCurrentAnnotationIndex(index);
    loadAnnotationToCanvas(annotation);
    
    // Pausar para visualizar a anotação
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
            <CustomVideoPlayer
              src={videoUrl}
              currentTime={currentTime / 1000}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              isPlaying={isPlaying}
              onPlayPauseChange={handlePlayPauseChange}
              annotations={annotations}
              onAnnotationClick={(annotationId) => {
                const index = annotations.findIndex(a => a.id === annotationId);
                if (index !== -1) {
                  seekToAnnotation(annotations[index], index);
                }
              }}
              className="w-full"
            />
            
            {/* Hidden video for canvas calculations */}
            <video
              ref={videoRef}
              src={videoUrl}
              className="hidden"
            />
            
            {/* Canvas para anotações - posicionado exatamente sobre o vídeo */}
            <canvas
              ref={canvasRef}
              className="absolute pointer-events-none top-0 left-0"
              style={{ zIndex: 50 }}
            />

            {/* Indicador de anotação atual */}
            {currentAnnotation && (
              <div className="absolute top-4 left-4 z-50 bg-primary/90 text-white px-4 py-2 rounded-lg backdrop-blur-sm shadow-lg">
                <div className="text-xs font-medium">
                  Anotação {(currentAnnotationIndex || 0) + 1}/{annotations.length}
                </div>
              </div>
            )}

            {/* Navegação entre anotações */}
            <div className="absolute top-4 right-4 flex gap-2 z-50">
              <Button
                size="icon"
                variant="secondary"
                onClick={skipToPrevAnnotation}
                disabled={currentAnnotationIndex === null || currentAnnotationIndex === 0}
                className="bg-black/60 hover:bg-black/80 text-white disabled:opacity-30 h-9 w-9"
                title="Anotação anterior"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button
                size="icon"
                variant="secondary"
                onClick={skipToNextAnnotation}
                disabled={currentAnnotationIndex === null || currentAnnotationIndex >= annotations.length - 1}
                className="bg-black/60 hover:bg-black/80 text-white disabled:opacity-30 h-9 w-9"
                title="Próxima anotação"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Painel Lateral - Lista de Anotações (40%) */}
      <div className="lg:col-span-2 flex">
        <Card 
          className="w-full flex flex-col overflow-hidden shadow-lg border-0" 
          style={{ 
            aspectRatio: aspectRatio || 'auto',
            maxHeight: '70vh'
          }}
        >
          <CardContent className="p-4 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-4 pb-3 border-b shrink-0">
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

            {/* Lista scrollável com limites rígidos */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 pr-2 min-h-0">
              {annotations.map((annotation, index) => {
                const hasDrawing = annotation.canvas_data?.objects?.length > 0;
                const drawingCount = annotation.canvas_data?.objects?.length || 0;
                const isCurrentAnnotation = currentAnnotationIndex === index;
                
                return (
                  <button
                    key={annotation.id}
                    onClick={() => seekToAnnotation(annotation, index)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all duration-200",
                      "hover:shadow-md hover:border-primary/50",
                      "overflow-hidden", // Previne overflow
                      isCurrentAnnotation 
                        ? "bg-primary/10 border-primary shadow-sm" 
                        : "bg-card hover:bg-accent/50 border-border"
                    )}
                  >
                    <div className="flex flex-col gap-2.5 min-w-0"> {/* min-w-0 permite shrink */}
                      {/* Header: Número + Timestamp + Badge */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "flex items-center justify-center w-7 h-7 rounded-full font-semibold text-xs shrink-0",
                          isCurrentAnnotation
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {index + 1}
                        </div>
                        
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs font-medium truncate">
                            {formatTimestamp(annotation.timestamp_ms)}
                          </span>
                        </div>
                        
                        {hasDrawing && (
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0 gap-0.5">
                            <Pencil className="w-2.5 h-2.5" />
                            <span>{drawingCount}</span>
                          </Badge>
                        )}
                      </div>
                      
                      {/* Comentário */}
                      {annotation.comment && (
                        <p className="text-xs leading-relaxed text-muted-foreground break-words min-w-0">
                          {annotation.comment}
                        </p>
                      )}
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

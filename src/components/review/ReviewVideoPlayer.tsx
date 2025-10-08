import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize, Pencil } from 'lucide-react';
import { DrawingCanvas } from './DrawingCanvas';
import { cn } from '@/lib/utils';
import type { Shape, Thread } from '@/types/review';
import { denormalizeShape } from '@/lib/shapeUtils';

interface ReviewVideoPlayerProps {
  src: string;
  threads: Thread[];
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onAddShapes: (shapes: Shape[], timestamp: number, tEnd?: number) => void;
  onThreadClick: (threadId: string) => void;
}

export const ReviewVideoPlayer = ({
  src,
  threads,
  currentTime,
  onTimeUpdate,
  onAddShapes,
  onThreadClick
}: ReviewVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (!videoRef.current || isDrawing) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = percent * duration;
  };

  const startDrawing = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setIsDrawing(true);
  };

  const handleDrawingComplete = (shapes: Shape[], tEnd?: number) => {
    onAddShapes(shapes, currentTime, tEnd);
    setIsDrawing(false);
  };

  const handleDrawingCancel = () => {
    setIsDrawing(false);
  };

  const calculateChipPosition = (shape: Shape) => {
    if (!shape.points.length || !videoDimensions.width || !videoDimensions.height) {
      return { x: 0, y: 0 };
    }
    // Denormalize first point
    const firstPt = shape.points[0];
    const x = firstPt.x * videoDimensions.width;
    const y = firstPt.y * videoDimensions.height;
    return { x, y: y - 30 }; // 30px above the drawing
  };

  const handleChipClick = (thread: Thread) => {
    onThreadClick(thread.id);
    if (videoRef.current) {
      videoRef.current.currentTime = thread.tStart;
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Update video dimensions when metadata loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setVideoDimensions({
        width: video.videoWidth,
        height: video.videoHeight
      });
    };

    const handleTimeUpdate = () => onTimeUpdate(video.currentTime);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [onTimeUpdate]);

  // ResizeObserver to update dimensions when container resizes
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const resizeObserver = new ResizeObserver(() => {
      if (video.videoWidth && video.videoHeight) {
        setVideoDimensions({
          width: video.videoWidth,
          height: video.videoHeight
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw thread shapes on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw threads visible at current time
    threads.forEach(thread => {
      const isVisible = currentTime >= thread.tStart && 
                       (!thread.tEnd || currentTime <= thread.tEnd);
      
      if (!isVisible) return;

      thread.shapes.forEach(shape => {
        const denormalized = denormalizeShape(shape, video.videoWidth, video.videoHeight);
        
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (denormalized.type === 'path') {
          ctx.beginPath();
          denormalized.points.forEach((pt, i) => {
            if (i === 0) {
              ctx.moveTo(pt.x, pt.y);
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          });
          ctx.stroke();
        } else if (denormalized.type === 'circle') {
          const [center, radiusPt] = denormalized.points;
          ctx.beginPath();
          ctx.arc(center.x, center.y, radiusPt.x, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw chip number
        const firstPoint = denormalized.points[0];
        ctx.fillStyle = shape.color;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${thread.chip}`, firstPoint.x, firstPoint.y - 20);
      });
    });
  }, [threads, currentTime, videoDimensions]);

  const visibleThreads = threads.filter(thread => 
    currentTime >= thread.tStart && (!thread.tEnd || currentTime <= thread.tEnd)
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden">
      <div className="relative">
        <video
          ref={videoRef}
          src={src}
          className="w-full h-auto"
          style={{ maxHeight: '70vh' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 20 }}
        />
        
        {/* Interactive chips layer */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
          {visibleThreads.map(thread => {
            if (!thread.shapes.length) return null;
            const pos = calculateChipPosition(thread.shapes[0]);
            const isInRange = currentTime >= thread.tStart && 
                             (!thread.tEnd || currentTime <= thread.tEnd);
            return (
              <button
                key={thread.id}
                className={cn(
                  "absolute pointer-events-auto w-8 h-8 bg-primary text-primary-foreground rounded-full border-2 border-background shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center text-sm font-bold cursor-pointer",
                  isInRange && "ring-4 ring-primary/50 scale-110"
                )}
                style={{ 
                  left: `${pos.x}px`, 
                  top: `${pos.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => handleChipClick(thread)}
              >
                {thread.chip}
              </button>
            );
          })}
        </div>
      </div>

      {isDrawing && (
        <DrawingCanvas
          videoWidth={videoDimensions.width}
          videoHeight={videoDimensions.height}
          currentTime={currentTime}
          onComplete={handleDrawingComplete}
          onCancel={handleDrawingCancel}
        />
      )}

      <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1.5 rounded text-sm font-mono backdrop-blur-sm">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      <div className="absolute top-4 right-4">
        <Button
          onClick={startDrawing}
          disabled={isDrawing}
          className="bg-primary hover:bg-primary/90"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Desenhar
        </Button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent pb-2">
        <div className="px-4 pt-8 pb-2">
          <div
            className="relative h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all"
            onClick={handleProgressClick}
          >
            <div
              className="absolute h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
            
            {threads.map((thread) => {
              const startPosition = duration > 0 ? (thread.tStart / duration) * 100 : 0;
              
              if (thread.tEnd) {
                const endPosition = duration > 0 ? (thread.tEnd / duration) * 100 : 0;
                const width = endPosition - startPosition;
                
                return (
                  <div key={thread.id}>
                    <div
                      className="absolute top-0 h-full bg-primary/30 border-l-2 border-r-2 border-primary cursor-pointer hover:bg-primary/40 transition-colors"
                      style={{ 
                        left: `${startPosition}%`,
                        width: `${width}%`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onThreadClick(thread.id);
                      }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-primary text-primary-foreground rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center text-xs font-bold z-10"
                      style={{ left: `${startPosition}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onThreadClick(thread.id);
                      }}
                    >
                      {thread.chip}
                    </div>
                  </div>
                );
              }
              
              return (
                <div
                  key={thread.id}
                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-primary text-primary-foreground rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center text-xs font-bold"
                  style={{ left: `${startPosition}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onThreadClick(thread.id);
                  }}
                >
                  {thread.chip}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              disabled={isDrawing}
              className="text-white hover:bg-white/10"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-white hover:bg-white/10"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => containerRef.current?.requestFullscreen()}
            className="text-white hover:bg-white/10"
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

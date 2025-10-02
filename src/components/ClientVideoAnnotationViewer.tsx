import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Play, Pause, SkipBack, SkipForward, Maximize, Clock, Image as ImageIcon } from 'lucide-react';

interface VideoAnnotation {
  id: string;
  timestamp_ms: number;
  timecode: string;
  image_url: string;
  comment?: string;
}

interface ClientVideoAnnotationViewerProps {
  videoUrl: string;
  annotations: VideoAnnotation[];
}

export const ClientVideoAnnotationViewer = ({ videoUrl, annotations }: ClientVideoAnnotationViewerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedAnnotation, setSelectedAnnotation] = useState<VideoAnnotation | null>(null);

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

  const seekToAnnotation = (annotation: VideoAnnotation) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = annotation.timestamp_ms / 1000;
    setIsPlaying(false);
  };

  const getCurrentAnnotationIndex = () => {
    return annotations.findIndex(a => 
      Math.abs(a.timestamp_ms / 1000 - currentTime / 1000) < 0.5
    );
  };

  const skipToPrevAnnotation = () => {
    const currentIdx = getCurrentAnnotationIndex();
    const prevIdx = currentIdx <= 0 ? 0 : currentIdx - 1;
    if (annotations[prevIdx]) {
      seekToAnnotation(annotations[prevIdx]);
    }
  };

  const skipToNextAnnotation = () => {
    const currentIdx = getCurrentAnnotationIndex();
    const nextIdx = currentIdx >= annotations.length - 1 ? annotations.length - 1 : currentIdx + 1;
    if (annotations[nextIdx]) {
      seekToAnnotation(annotations[nextIdx]);
    }
  };

  const formatTimestamp = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Video Player */}
      <div className="lg:col-span-3">
        <Card className="overflow-hidden border-0 shadow-lg">
          <div 
            ref={containerRef} 
            className="relative w-full bg-black rounded-lg overflow-hidden"
            style={{ maxHeight: '70vh' }}
          >
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                playsInline
              />
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 space-y-3" style={{ zIndex: 20 }}>
              {/* Progress Bar */}
              <div className="relative">
                <div 
                  className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    const newTime = percent * duration;
                    if (videoRef.current) {
                      videoRef.current.currentTime = newTime / 1000;
                      setCurrentTime(newTime);
                    }
                  }}
                >
                  <div 
                    className="h-full bg-primary rounded-full relative"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                  </div>
                  
                  {/* Annotation Markers */}
                  {annotations.map((annotation) => {
                    const position = (annotation.timestamp_ms / duration) * 100;
                    return (
                      <div
                        key={annotation.id}
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white cursor-pointer hover:scale-125 transition-transform bg-yellow-400"
                        style={{ left: `${position}%` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          seekToAnnotation(annotation);
                        }}
                        title={`Annotation: ${annotation.comment || 'No comment'}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/10 h-10 w-10"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  
                  <div className="text-white text-sm font-mono">
                    {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipToPrevAnnotation}
                    className="text-white hover:bg-white/10 h-8 w-8"
                    disabled={annotations.length === 0}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipToNextAnnotation}
                    className="text-white hover:bg-white/10 h-8 w-8"
                    disabled={annotations.length === 0}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (document.fullscreenElement) {
                        document.exitFullscreen();
                      } else {
                        containerRef.current?.requestFullscreen();
                      }
                    }}
                    className="text-white hover:bg-white/10 h-8 w-8"
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Annotations List */}
      <div className="lg:col-span-2">
        <div className="w-full bg-card rounded-lg border p-4 max-h-[600px] overflow-y-auto">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Annotations ({annotations.length})
          </h3>
          
          {annotations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No annotations yet
            </p>
          ) : (
            <div className="space-y-3">
              {annotations.map((annotation) => (
                <Card
                  key={annotation.id}
                  className="overflow-hidden cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setSelectedAnnotation(annotation)}
                >
                  <div className="flex gap-3 p-3">
                    {annotation.image_url && (
                      <img 
                        src={annotation.image_url} 
                        alt="Annotation thumbnail"
                        className="w-24 h-16 object-cover rounded flex-shrink-0"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="font-mono text-sm font-medium">
                          {annotation.timecode}
                        </span>
                      </div>
                      {annotation.comment && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {annotation.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Annotation Detail Modal */}
      <Dialog open={!!selectedAnnotation} onOpenChange={() => setSelectedAnnotation(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedAnnotation && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden bg-black">
                <img 
                  src={selectedAnnotation.image_url} 
                  alt="Annotation"
                  className="w-full h-auto"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono font-medium">{selectedAnnotation.timecode}</span>
                </div>
                
                {selectedAnnotation.comment && (
                  <div>
                    <h4 className="font-semibold mb-2">Comment:</h4>
                    <p className="text-muted-foreground">{selectedAnnotation.comment}</p>
                  </div>
                )}
                
                <Button 
                  onClick={() => {
                    seekToAnnotation(selectedAnnotation);
                    setSelectedAnnotation(null);
                  }}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Jump to Time in Video
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CustomVideoPlayerProps {
  src: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  annotations?: Array<{ timestamp_ms: number; id: string; comment?: string | null }>;
  onSeek?: (time: number) => void;
  className?: string;
  isPlaying?: boolean;
  onPlayPauseChange?: (isPlaying: boolean) => void;
  isDrawingMode?: boolean;
  onAnnotationClick?: (annotationId: string) => void;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  src,
  currentTime,
  onTimeUpdate,
  onDurationChange,
  annotations = [],
  onSeek,
  className,
  isPlaying: externalIsPlaying,
  onPlayPauseChange,
  isDrawingMode = false,
  onAnnotationClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalIsPlaying;
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    
    // Block play/pause when in drawing mode
    if (isDrawingMode) {
      return;
    }
    
    const newPlayingState = !isPlaying;
    
    if (newPlayingState) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
    
    if (onPlayPauseChange) {
      onPlayPauseChange(newPlayingState);
    } else {
      setInternalIsPlaying(newPlayingState);
    }
  }, [isPlaying, isDrawingMode, onPlayPauseChange]);

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
      if (newMuted) {
        setVolume(0);
      } else {
        setVolume(videoRef.current.volume || 0.5);
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      onTimeUpdate(newTime);
      if (onSeek) onSeek(newTime);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      onTimeUpdate(newTime);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore keyboard events when user is typing in input fields
      const activeElement = document.activeElement;
      const isTyping = activeElement instanceof HTMLElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      );
      
      if (isTyping) {
        return; // Let the input handle the event normally
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(5);
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, togglePlayPause]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      if (onPlayPauseChange) {
        onPlayPauseChange(true);
      } else {
        setInternalIsPlaying(true);
      }
    };
    const handlePause = () => {
      if (onPlayPauseChange) {
        onPlayPauseChange(false);
      } else {
        setInternalIsPlaying(false);
      }
    };
    const handleTimeUpdate = () => onTimeUpdate(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      onDurationChange(video.duration);
    };
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [onTimeUpdate, onDurationChange, onPlayPauseChange]);

  // Force pause when drawing mode is active - CRITICAL for drawing functionality
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isDrawingMode) {
      // FORCE pause the video immediately
      videoRef.current.pause();
      
      // Update the playing state
      if (onPlayPauseChange) {
        onPlayPauseChange(false);
      } else {
        setInternalIsPlaying(false);
      }
    }
  }, [isDrawingMode, onPlayPauseChange]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-black rounded-lg overflow-hidden group", className)}
      onMouseMove={showControlsTemporarily}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full block"
        style={{ maxHeight: '70vh' }}
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Timecode Overlay */}
      <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1.5 rounded text-sm font-mono backdrop-blur-sm">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      {/* Play/Pause Overlay (center) */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
          showControls && !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayPause}
          disabled={isDrawingMode}
          className="w-20 h-20 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
        </Button>
      </div>

      {/* Bottom Controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent transition-opacity duration-300 pb-2",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress Bar */}
        <div className="px-4 pt-8 pb-2">
          <div
            className="relative h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all group/progress"
            onClick={handleProgressClick}
          >
            <div
              className="absolute h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            
            {/* Annotation Markers */}
            {annotations.map((annotation) => {
              const position = duration > 0 ? (annotation.timestamp_ms / 1000 / duration) * 100 : 0;
              return (
                <div
                  key={annotation.id}
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform z-10"
                  style={{ left: `${position}%` }}
                  title={annotation.comment || 'Anotação visual'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnnotationClick?.(annotation.id);
                  }}
                />
              );
            })}

            {/* Progress Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between px-4 gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              disabled={isDrawingMode}
              className="text-white hover:bg-white/10 h-9 w-9 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-5)}
              className="text-white hover:bg-white/10 h-8 w-8"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(5)}
              className="text-white hover:bg-white/10 h-8 w-8"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/10 h-8 w-8"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.01}
                className="w-20"
              />
            </div>

            {/* Playback Speed */}
            <div className="flex items-center gap-1 ml-2">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <Button
                  key={rate}
                  variant="ghost"
                  size="sm"
                  onClick={() => changePlaybackRate(rate)}
                  className={cn(
                    "text-white hover:bg-white/10 h-7 px-2 text-xs",
                    playbackRate === rate && "bg-white/20"
                  )}
                >
                  {rate}x
                </Button>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white/10 h-9 w-9"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

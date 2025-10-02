import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Keyframe {
  id: string;
  title: string;
  attachments: Array<{
    time: number;
    timeStr: string;
    type: string;
  }>;
  feedback_count: number;
  project_feedback: Array<{
    id: string;
    comment: string;
    x_position: number;
    y_position: number;
    created_at: string;
  }>;
}

interface VideoPlayerWithKeyframesProps {
  src: string;
  keyframes: Keyframe[];
  onDurationChange?: (duration: number) => void;
}

export interface VideoPlayerRef {
  seekTo: (time: number) => void;
}

export const VideoPlayerWithKeyframes = forwardRef<VideoPlayerRef, VideoPlayerWithKeyframesProps>(({ 
  src, 
  keyframes,
  onDurationChange 
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoveredKeyframe, setHoveredKeyframe] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    seekTo: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current?.parentElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.parentElement.requestFullscreen();
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && videoRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };

  const handleKeyframeClick = (time: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      onDurationChange?.(video.duration);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onDurationChange]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative bg-black rounded-lg overflow-hidden group">
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        className="w-full aspect-video"
        onClick={togglePlay}
      />

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress Bar with Keyframes */}
        <div className="mb-3">
          <div
            ref={progressBarRef}
            className="relative h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all"
            onClick={handleProgressClick}
          >
            {/* Progress */}
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />

            {/* Keyframe Markers - INTEGRATED in the timeline */}
            {keyframes.map((keyframe) => {
              const timePosition = (keyframe.attachments[0]?.time / duration) * 100;
              const commentsCount = keyframe.project_feedback?.length || 0;
              const isHovered = hoveredKeyframe === keyframe.id;

              return (
                <div
                  key={keyframe.id}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ left: `${timePosition}%` }}
                  onMouseEnter={() => setHoveredKeyframe(keyframe.id)}
                  onMouseLeave={() => setHoveredKeyframe(null)}
                >
                  {/* Marker */}
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full border-2 border-white shadow-lg cursor-pointer transition-all hover:scale-150",
                      commentsCount > 0 ? "bg-warning" : "bg-primary"
                    )}
                    onClick={(e) => handleKeyframeClick(keyframe.attachments[0]?.time || 0, e)}
                  />

                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-50">
                      <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-xl border text-sm">
                        <div className="font-semibold">{keyframe.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(keyframe.attachments[0]?.time || 0)}
                          {commentsCount > 0 && ` • ${commentsCount} comentário${commentsCount !== 1 ? 's' : ''}`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>

            <span className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={toggleFullscreen}
          >
            <Maximize className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
});

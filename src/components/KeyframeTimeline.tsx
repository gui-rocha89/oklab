import { useState } from "react";
import { MessageSquare } from "lucide-react";
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

interface KeyframeTimelineProps {
  keyframes: Keyframe[];
  videoDuration: number;
  currentTime: number;
  onSeek: (time: number) => void;
}

export const KeyframeTimeline = ({ 
  keyframes, 
  videoDuration, 
  currentTime, 
  onSeek 
}: KeyframeTimelineProps) => {
  const [hoveredKeyframe, setHoveredKeyframe] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  return (
    <div className="w-full py-6 px-2">
      <div className="relative">
        {/* Background Track */}
        <div className="h-2 bg-muted rounded-full relative overflow-hidden">
          {/* Progress Bar */}
          <div 
            className="absolute inset-y-0 left-0 bg-primary/30 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Keyframe Markers */}
        <div className="absolute inset-0 -top-2 pointer-events-none">
          {keyframes.map((keyframe) => {
            const timePosition = (keyframe.attachments[0]?.time / videoDuration) * 100;
            const commentsCount = keyframe.project_feedback?.length || 0;
            const isHovered = hoveredKeyframe === keyframe.id;
            
            return (
              <div
                key={keyframe.id}
                className="absolute pointer-events-auto"
                style={{ 
                  left: `${timePosition}%`,
                  transform: 'translateX(-50%)'
                }}
                onMouseEnter={() => setHoveredKeyframe(keyframe.id)}
                onMouseLeave={() => setHoveredKeyframe(null)}
              >
                {/* Marker */}
                <button
                  onClick={() => onSeek(keyframe.attachments[0]?.time || 0)}
                  className={cn(
                    "group relative flex flex-col items-center transition-all duration-200",
                    "hover:scale-110 focus:outline-none focus:scale-110"
                  )}
                >
                  {/* Marker Pin */}
                  <div 
                    className={cn(
                      "w-4 h-6 rounded-t-full rounded-b-sm transition-all duration-200",
                      "shadow-lg border-2 border-background",
                      commentsCount > 0 
                        ? "bg-warning hover:bg-warning/90" 
                        : "bg-primary hover:bg-primary/90",
                      isHovered && "shadow-xl scale-110"
                    )}
                  >
                    {/* Comment Count Badge */}
                    {commentsCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-background">
                        {commentsCount}
                      </div>
                    )}
                  </div>

                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg border text-sm whitespace-nowrap max-w-xs">
                        <div className="font-semibold mb-1">{keyframe.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="font-mono">{formatTime(keyframe.attachments[0]?.time || 0)}</span>
                          {commentsCount > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {commentsCount} comentário{commentsCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Arrow */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-popover" />
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline Labels */}
      <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
        <span>0:00</span>
        <span>{formatTime(videoDuration)}</span>
      </div>
    </div>
  );
};

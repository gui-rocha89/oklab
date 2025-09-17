import React from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { InstagramCarousel } from './InstagramCarousel';

interface Attachment {
  name: string;
  url?: string;
  publicationDate?: string;
}

interface InstagramPostProps {
  title: string;
  attachments: Attachment[];
  publishDate?: string;
  profileName?: string;
  className?: string;
}

export const InstagramPost: React.FC<InstagramPostProps> = ({
  title,
  attachments,
  publishDate,
  profileName = "oklab_oficial",
  className = ""
}) => {
  const formatDate = (date: string) => {
    const now = new Date();
    const publishedDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  return (
    <div className={`bg-background border border-border rounded-lg shadow-card max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 via-purple-500 to-yellow-500 rounded-full p-0.5">
            <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center text-xs font-bold text-white">
                OK
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{profileName}</p>
            <p className="text-xs text-muted-foreground">Patrocinado</p>
          </div>
        </div>
        <MoreHorizontal className="w-6 h-6 text-muted-foreground cursor-pointer" />
      </div>

      {/* Image/Carousel */}
      <div className="relative">
        {attachments.length > 1 ? (
          <InstagramCarousel attachments={attachments} />
        ) : (
          <div className="aspect-square bg-muted flex items-center justify-center">
            {attachments[0]?.url ? (
              <img 
                src={attachments[0].url} 
                alt={attachments[0].name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-primary">OK</span>
                </div>
                <p className="text-sm font-medium text-foreground">{attachments[0]?.name}</p>
                <p className="text-xs text-muted-foreground">Preview do Post</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <Heart className="w-6 h-6 text-foreground cursor-pointer hover:text-red-500 transition-colors" />
            <MessageCircle className="w-6 h-6 text-foreground cursor-pointer hover:text-muted-foreground transition-colors" />
            <Send className="w-6 h-6 text-foreground cursor-pointer hover:text-muted-foreground transition-colors" />
          </div>
          <Bookmark className="w-6 h-6 text-foreground cursor-pointer hover:text-muted-foreground transition-colors" />
        </div>

        {/* Likes */}
        <p className="font-semibold text-sm text-foreground mb-1">0 curtidas</p>

        {/* Caption */}
        <div className="space-y-1">
          <p className="text-sm">
            <span className="font-semibold text-foreground">{profileName}</span>{' '}
            <span className="text-foreground">{title}</span>
          </p>
          
          {publishDate && (
            <p className="text-xs text-muted-foreground uppercase">
              {formatDate(publishDate)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
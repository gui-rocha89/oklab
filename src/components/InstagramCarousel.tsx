import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Attachment {
  name: string;
  url?: string;
  publicationDate?: string;
}

interface InstagramCarouselProps {
  attachments: Attachment[];
}

export const InstagramCarousel: React.FC<InstagramCarouselProps> = ({ attachments }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % attachments.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + attachments.length) % attachments.length);
  };

  return (
    <div className="relative aspect-square bg-muted">
      {/* Main Image */}
      <div className="w-full h-full flex items-center justify-center">
        {attachments[currentSlide]?.url ? (
          <img 
            src={attachments[currentSlide].url} 
            alt={attachments[currentSlide].name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary">OK</span>
            </div>
            <p className="text-sm font-medium text-foreground">{attachments[currentSlide]?.name}</p>
            <p className="text-xs text-muted-foreground">Preview {currentSlide + 1}/{attachments.length}</p>
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {attachments.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {attachments.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {currentSlide + 1}/{attachments.length}
        </div>
      )}

      {/* Dots Indicator */}
      {attachments.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1">
          {attachments.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
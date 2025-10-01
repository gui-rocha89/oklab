import { useState, useEffect, RefObject } from 'react';

/**
 * Hook para detectar e gerenciar a proporção do vídeo automaticamente
 * Similar ao sistema usado por Frame.IO
 */
export const useVideoAspectRatio = (videoRef: RefObject<HTMLVideoElement>) => {
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9); // Default fallback
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateDimensions = () => {
      if (video.videoWidth && video.videoHeight) {
        const ratio = video.videoWidth / video.videoHeight;
        setAspectRatio(ratio);
        setDimensions({
          width: video.videoWidth,
          height: video.videoHeight,
        });
        setIsReady(true);
        
        console.log('🎥 Vídeo detectado:', {
          nativeWidth: video.videoWidth,
          nativeHeight: video.videoHeight,
          aspectRatio: ratio.toFixed(3),
          format: getFormatName(ratio)
        });
      }
    };

    // Tentar obter dimensões imediatamente se já carregadas
    updateDimensions();

    // Listeners para garantir detecção
    video.addEventListener('loadedmetadata', updateDimensions);
    video.addEventListener('canplay', updateDimensions);

    return () => {
      video.removeEventListener('loadedmetadata', updateDimensions);
      video.removeEventListener('canplay', updateDimensions);
    };
  }, [videoRef]);

  return { aspectRatio, dimensions, isReady };
};

/**
 * Identifica o formato do vídeo baseado na proporção
 */
const getFormatName = (ratio: number): string => {
  if (Math.abs(ratio - 16/9) < 0.01) return '16:9 (Full HD)';
  if (Math.abs(ratio - 4/3) < 0.01) return '4:3 (Standard)';
  if (Math.abs(ratio - 21/9) < 0.01) return '21:9 (Ultrawide)';
  if (Math.abs(ratio - 9/16) < 0.01) return '9:16 (Vertical)';
  if (Math.abs(ratio - 1) < 0.01) return '1:1 (Square)';
  return `${ratio.toFixed(2)}:1 (Custom)`;
};

import { useEffect, useCallback, useRef } from 'react';

const BLUR_STYLES = `
.lovable-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.2s ease-out;
  pointer-events: auto;
}

.lovable-modal-backdrop.visible {
  opacity: 1;
}

.lovable-modal-content {
  position: relative;
  z-index: 1000;
  filter: none !important;
  -webkit-filter: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

body.lovable-modal-open {
  overflow: hidden;
}
`;

export const useModalBlur = (isOpen: boolean, onClose?: () => void) => {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    // Clear any pending cleanup
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    // Remove body class
    document.body.classList.remove('lovable-modal-open');

    // Remove backdrop if it exists
    if (backdropRef.current) {
      backdropRef.current.remove();
      backdropRef.current = null;
    }

    // Remove styles only if no other backdrops exist
    const remainingBackdrops = document.querySelectorAll('.lovable-modal-backdrop');
    if (remainingBackdrops.length === 0) {
      const styleElement = document.getElementById('lovable-modal-blur-styles');
      if (styleElement) {
        styleElement.remove();
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Inject styles if not already present
      if (!document.getElementById('lovable-modal-blur-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'lovable-modal-blur-styles';
        styleElement.textContent = BLUR_STYLES;
        document.head.appendChild(styleElement);
      }

      // Clean up any existing backdrop first
      cleanup();

      // Create new blur backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'lovable-modal-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      backdrop.setAttribute('data-lovable-backdrop', 'true');
      
      // Add click outside to close functionality
      const handleBackdropClick = (e: Event) => {
        if (e.target === backdrop && onClose) {
          onClose();
        }
      };
      
      backdrop.addEventListener('click', handleBackdropClick);
      backdropRef.current = backdrop;
      
      document.body.appendChild(backdrop);
      document.body.classList.add('lovable-modal-open');

      // Make backdrop visible with a slight delay for smooth animation
      requestAnimationFrame(() => {
        if (backdrop.parentNode) {
          backdrop.classList.add('visible');
        }
      });

      return () => {
        backdrop.removeEventListener('click', handleBackdropClick);
        // Delay cleanup to allow for exit animations
        cleanupTimeoutRef.current = setTimeout(cleanup, 100);
      };
    } else {
      cleanup();
    }
  }, [isOpen, onClose, cleanup]);

  // Cleanup on component unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
};
import { useEffect } from 'react';

const BLUR_STYLES = `
.modal-backdrop-blur {
  position: fixed;
  inset: 0;
  z-index: 50;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: rgba(17, 24, 39, 0.35);
  opacity: 0;
  transition: opacity 0.18s ease;
  pointer-events: auto;
}

.modal-backdrop-blur.visible {
  opacity: 1;
}

.modal-content-safe {
  position: relative;
  z-index: 51;
  filter: none !important;
  -webkit-filter: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

body.modal-open {
  overflow: hidden;
}
`;

export const useModalBlur = (isOpen: boolean, onClose?: () => void) => {
  useEffect(() => {
    if (isOpen) {
      // Inject styles if not already present
      if (!document.getElementById('modal-blur-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'modal-blur-styles';
        styleElement.textContent = BLUR_STYLES;
        document.head.appendChild(styleElement);
      }

      // Create blur backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop-blur';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);

      // Add body class to prevent scrolling
      document.body.classList.add('modal-open');

      // Add click outside to close functionality
      const handleBackdropClick = (e: Event) => {
        if (e.target === backdrop && onClose) {
          onClose();
        }
      };
      
      backdrop.addEventListener('click', handleBackdropClick);

      // Make backdrop visible
      requestAnimationFrame(() => {
        backdrop.classList.add('visible');
      });

      return () => {
        // Cleanup function for when component unmounts while modal is open
        backdrop.removeEventListener('click', handleBackdropClick);
        cleanup();
      };
    } else {
      cleanup();
    }
  }, [isOpen, onClose]);

  const cleanup = () => {
    // Remove body class
    document.body.classList.remove('modal-open');

    // Remove backdrop
    const backdrop = document.querySelector('.modal-backdrop-blur');
    if (backdrop) {
      backdrop.remove();
    }

    // Remove styles only if no other modals are using them
    const remainingBackdrops = document.querySelectorAll('.modal-backdrop-blur');
    if (remainingBackdrops.length === 0) {
      const styleElement = document.getElementById('modal-blur-styles');
      if (styleElement) {
        styleElement.remove();
      }
    }
  };
};
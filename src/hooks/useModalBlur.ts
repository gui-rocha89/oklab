import { useEffect } from 'react';

const BLUR_STYLES = `
:root {
  --oklab-blur: 10px;
  --oklab-overlay: rgba(17, 24, 39, 0.35);
  --oklab-z-overlay: 2147483000;
  --oklab-z-modal: 2147483600;
}

#oklab-blur-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--oklab-z-overlay);
  backdrop-filter: blur(var(--oklab-blur));
  -webkit-backdrop-filter: blur(var(--oklab-blur));
  background: var(--oklab-overlay);
  opacity: 0;
  transition: opacity 0.18s ease;
  pointer-events: auto;
}

#oklab-blur-overlay.oklab--visible {
  opacity: 1;
}

body.oklab--modal-open {
  overflow: hidden;
}

/* força topo absoluto para os modais mais comuns */
.oklab--force-top,
[role='dialog'],
.modal,
.modal.show,
.ReactModal__Content,
.MuiModal-root,
.MuiDialog-container,
.ant-modal,
.ant-modal-wrap,
dialog[open] {
  position: relative !important;
  z-index: var(--oklab-z-modal) !important;
  isolation: isolate;
}

/* garante que nada do modal receba blur */
.oklab--force-top *,
[role='dialog'] *,
.modal *,
.ReactModal__Content *,
.MuiModal-root *,
.MuiDialog-container *,
.ant-modal *,
.ant-modal-wrap * {
  filter: none !important;
  -webkit-filter: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
`;

export const useModalBlur = (isOpen: boolean, onClose?: () => void) => {
  useEffect(() => {
    if (isOpen) {
      // Inject styles
      const styleElement = document.createElement('style');
      styleElement.id = 'oklab-blur-styles';
      styleElement.textContent = BLUR_STYLES;
      document.head.appendChild(styleElement);

      // Create blur overlay
      const overlay = document.createElement('div');
      overlay.id = 'oklab-blur-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.appendChild(overlay);

      // Add classes
      document.body.classList.add('oklab--modal-open');
      
      // Add classes to modal elements
      const modalSelectors = [
        '[role="dialog"]',
        '.modal',
        '.ReactModal__Content',
        '.MuiModal-root',
        '.MuiDialog-container',
        '.ant-modal',
        '.ant-modal-wrap',
        'dialog[open]'
      ];
      
      modalSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => element.classList.add('oklab--force-top'));
      });

      // Add click outside to close functionality
      const handleOverlayClick = (e: Event) => {
        if (e.target === overlay && onClose) {
          onClose();
        }
      };
      
      overlay.addEventListener('click', handleOverlayClick);

      // Make overlay visible
      requestAnimationFrame(() => {
        overlay.classList.add('oklab--visible');
      });

      return () => {
        // Cleanup function for when component unmounts while modal is open
        overlay.removeEventListener('click', handleOverlayClick);
        cleanup();
      };
    } else {
      cleanup();
    }
  }, [isOpen, onClose]);

  const cleanup = () => {
    // Remove classes
    document.body.classList.remove('oklab--modal-open');
    
    const modalSelectors = [
      '[role="dialog"]',
      '.modal',
      '.ReactModal__Content',
      '.MuiModal-root',
      '.MuiDialog-container',
      '.ant-modal',
      '.ant-modal-wrap',
      'dialog[open]'
    ];
    
    modalSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => element.classList.remove('oklab--force-top'));
    });

    // Remove overlay
    const overlay = document.getElementById('oklab-blur-overlay');
    if (overlay) {
      overlay.remove();
    }

    // Remove styles
    const styleElement = document.getElementById('oklab-blur-styles');
    if (styleElement) {
      styleElement.remove();
    }
  };
};
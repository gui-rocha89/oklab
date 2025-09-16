import { useEffect } from 'react';

const BLUR_STYLES = `
:root {
  --oklab-blur: 10px;
  --oklab-overlay: rgba(17, 24, 39, 0.35);
  --oklab-z-overlay: 1000;
  --oklab-z-modal: 1002;
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

[role='dialog'].oklab--modal-top,
.modal.oklab--modal-top,
.ReactModal__Content.oklab--modal-top {
  position: relative;
  z-index: var(--oklab-z-modal);
  pointer-events: auto;
}
`;

export const useModalBlur = (isOpen: boolean) => {
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
      
      // Add classes to dialog elements
      const dialogs = document.querySelectorAll('[role="dialog"]');
      dialogs.forEach(dialog => dialog.classList.add('oklab--modal-top'));
      
      const modals = document.querySelectorAll('.modal');
      modals.forEach(modal => modal.classList.add('oklab--modal-top'));
      
      const reactModals = document.querySelectorAll('.ReactModal__Content');
      reactModals.forEach(modal => modal.classList.add('oklab--modal-top'));

      // Make overlay visible
      requestAnimationFrame(() => {
        overlay.classList.add('oklab--visible');
      });

      return () => {
        // Cleanup function for when component unmounts while modal is open
        cleanup();
      };
    } else {
      cleanup();
    }
  }, [isOpen]);

  const cleanup = () => {
    // Remove classes
    document.body.classList.remove('oklab--modal-open');
    
    const dialogs = document.querySelectorAll('[role="dialog"]');
    dialogs.forEach(dialog => dialog.classList.remove('oklab--modal-top'));
    
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.remove('oklab--modal-top'));
    
    const reactModals = document.querySelectorAll('.ReactModal__Content');
    reactModals.forEach(modal => modal.classList.remove('oklab--modal-top'));

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
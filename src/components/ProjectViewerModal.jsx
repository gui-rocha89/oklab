import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useModalBlur } from '../hooks/useModalBlur';

const ProjectViewerModal = ({ project, isOpen, onClose }) => {
  const [currentCreativeIndex, setCurrentCreativeIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  
  useModalBlur(isOpen, onClose);

  if (!isOpen || !project) {
    return null;
  }

  const currentCreative = project.creatives[currentCreativeIndex];
  const totalImages = currentCreative.attachments.length;

  const nextImage = () => {
    setImageIndex((prev) => (prev + 1) % totalImages);
  };

  const prevImage = () => {
    setImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setCurrentCreativeIndex(0);
      setImageIndex(0);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="lovable-modal-content w-full max-w-sm mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden relative"
        >
            <button onClick={handleClose} className="absolute top-3 right-3 z-10 p-2 bg-white/50 rounded-full hover:bg-white transition">
              <X className="h-5 w-5 text-gray-800" />
            </button>

            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <img alt="Admin Avatar" className="w-8 h-8 rounded-full object-cover border-2 border-blue-500" src="https://images.unsplash.com/photo-1580489944761-15a19d654956" />
                <span className="font-semibold text-sm text-gray-800">{project.author}</span>
              </div>
              <MoreHorizontal className="h-6 w-6 text-gray-500" />
            </div>

            <div className="relative w-full aspect-square bg-black">
              <AnimatePresence initial={false}>
                <motion.div
                  key={`${currentCreativeIndex}-${imageIndex}`}
                  className="absolute inset-0"
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ ease: "easeInOut" }}
                >
                  {currentCreative.attachments[imageIndex].url.endsWith('.mp4') ? (
                    <video src={currentCreative.attachments[imageIndex].url} className="w-full h-full object-cover" controls autoPlay muted loop playsInline />
                  ) : (
                    <img
                      alt={`Creative ${currentCreativeIndex + 1} - Image ${imageIndex + 1}`}
                      className="w-full h-full object-cover"
                      src={currentCreative.attachments[imageIndex].url}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {totalImages > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/50 rounded-full p-1 text-gray-800 hover:bg-white transition">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/50 rounded-full p-1 text-gray-800 hover:bg-white transition">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5">
                    {currentCreative.attachments.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imageIndex ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="px-4 py-4 text-sm">
              <p className="text-gray-800">
                <span className="font-semibold">{project.title}</span>
                &nbsp;
                {currentCreative.caption}
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Aprovado em: {new Date(project.approvedAt || project.sharedAt).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {project.creatives.length > 1 && (
              <div className="flex border-t border-gray-200">
                {project.creatives.map((creative, index) => (
                  <button
                    key={creative.id}
                    onClick={() => { setCurrentCreativeIndex(index); setImageIndex(0); }}
                    className={`flex-1 py-3 text-sm font-medium transition-colors relative ${currentCreativeIndex === index ? 'text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {creative.name}
                    {currentCreativeIndex === index && (
                      <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" layoutId="viewer-underline" />
                    )}
                  </button>
                ))}
              </div>
            )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectViewerModal;
// Motion system - consistent animations across marketing pages

export const motionConfig = {
  easing: [0.2, 0.7, 0.2, 1] as const,
  duration: 0.25,
  staggerDelay: 0.1,
  translateY: 14,
  viewport: { once: true, margin: '-50px' } as const,
};

export const fadeUp = {
  initial: { 
    opacity: 0, 
    y: motionConfig.translateY 
  },
  animate: { 
    opacity: 1, 
    y: 0 
  },
  transition: {
    duration: motionConfig.duration,
    ease: motionConfig.easing,
  },
};

export const fadeUpStagger = (index: number) => ({
  initial: { 
    opacity: 0, 
    y: motionConfig.translateY 
  },
  animate: { 
    opacity: 1, 
    y: 0 
  },
  transition: {
    duration: motionConfig.duration,
    ease: motionConfig.easing,
    delay: index * motionConfig.staggerDelay,
  },
});

export const fadeUpViewport = {
  initial: { 
    opacity: 0, 
    y: motionConfig.translateY 
  },
  whileInView: { 
    opacity: 1, 
    y: 0 
  },
  viewport: motionConfig.viewport,
  transition: {
    duration: motionConfig.duration,
    ease: motionConfig.easing,
  },
};

export const fadeUpViewportStagger = (index: number) => ({
  initial: { 
    opacity: 0, 
    y: motionConfig.translateY 
  },
  whileInView: { 
    opacity: 1, 
    y: 0 
  },
  viewport: motionConfig.viewport,
  transition: {
    duration: motionConfig.duration,
    ease: motionConfig.easing,
    delay: index * motionConfig.staggerDelay,
  },
});

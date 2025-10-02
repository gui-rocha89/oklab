import { Button } from '@/components/ui/button';
import { hero } from '@/mkt/content';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import '@/styles/mkt.css';

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const refHero = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: refHero,
    offset: ['start start', 'end start']
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -30]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section ref={refHero} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="mkt-hero-bg" aria-hidden="true" />

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="max-w-5xl mx-auto text-center space-y-12"
        >
          {/* Headline & Subcopy */}
          <div className="space-y-6">
            <h1 className="text-6xl sm:text-7xl lg:text-[72px] font-semibold text-foreground leading-[1.1] tracking-tight">
              {hero.headline}
            </h1>
            <p className="text-xl sm:text-[22px] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {hero.subcopy}
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {hero.ctas.map((cta, idx) => (
              <Button
                key={idx}
                variant={cta.variant}
                size="lg"
                asChild
                className="min-w-[220px]"
                aria-label={cta.label}
              >
                <a href={cta.href}>{cta.label}</a>
              </Button>
            ))}
          </div>

          {/* Real Product Mock with Parallax */}
          <motion.div 
            style={{ y }}
            className="hero-mock-container mt-16"
          >
            <div className="relative max-w-5xl mx-auto">
              <picture>
                <source
                  srcSet="/mkt/panel-approval-hero@2x.png 2x, /mkt/panel-approval-hero.png 1x"
                  type="image/png"
                />
                <img
                  src="/mkt/panel-approval-hero.png"
                  alt="Interface do OK Lab mostrando aprovação de vídeo com anotações e comentários em tempo real"
                  className="w-full h-auto rounded-lg shadow-2xl border border-border/50"
                  loading="eager"
                  width={1440}
                  height={900}
                />
              </picture>
              
              {/* Glow effect behind mock */}
              <div 
                className="absolute inset-0 -z-10 blur-3xl opacity-30" 
                style={{
                  background: 'radial-gradient(circle at 50% 50%, #0EA5B7 0%, transparent 70%)'
                }}
                aria-hidden="true"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Gradient overlay bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}

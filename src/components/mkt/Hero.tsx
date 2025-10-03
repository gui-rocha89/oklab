import { Button } from '@/components/ui/button';
import { hero } from '@/mkt/content';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { fadeUp } from '@/lib/motionVariants';

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const refHero = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: refHero,
    offset: ['start start', 'end start']
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -24]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section ref={refHero} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="mkt-hero-bg" aria-hidden="true" />

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-32">
        <motion.div
          {...fadeUp}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : fadeUp.initial.y }}
          className="max-w-5xl mx-auto text-center space-y-12"
        >
          {/* Headline & Subcopy */}
          <div className="space-y-6">
            <h1 className="mkt-h1 text-foreground font-semibold">
              {hero.headline}
            </h1>
            <p className="mkt-body text-muted-foreground max-w-3xl mx-auto leading-relaxed">
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
                  media="(max-width: 768px)"
                  srcSet="/mkt/panel-hero-mobile.webp"
                  type="image/webp"
                />
                <source
                  srcSet="/mkt/panel-hero-desktop.webp"
                  type="image/webp"
                />
                <img
                  src="/mkt/panel-hero-desktop.webp"
                  alt="Interface do OK Lab mostrando player de vídeo pausado com anotações desenhadas no frame e comentários nos timestamps 0:07 e 0:13"
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
                  background: 'radial-gradient(circle at 50% 50%, hsl(var(--primary)) 0%, transparent 70%)'
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

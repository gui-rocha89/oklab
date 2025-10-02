import { Button } from '@/components/ui/button';
import { hero } from '@/mkt/content';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Background mock player */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <img
          src="/mkt/player-annot.png"
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            {hero.headline}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            {hero.subcopy}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {hero.ctas.map((cta, idx) => (
              <Button
                key={idx}
                variant={cta.variant}
                size="lg"
                asChild
                className="min-w-[200px]"
              >
                <a href={cta.href}>{cta.label}</a>
              </Button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Gradient overlay bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}

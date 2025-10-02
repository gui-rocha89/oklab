import { howItWorks } from '@/mkt/content';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function HowItWorks() {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Reveal cards sequentially with delay
            howItWorks.steps.forEach((_, idx) => {
              setTimeout(() => {
                setVisibleCards((prev) => [...new Set([...prev, idx])]);
              }, idx * 100);
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="produto"
      ref={sectionRef}
      className="py-24 bg-card border-y border-border"
    >
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {howItWorks.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {howItWorks.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {howItWorks.steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: visibleCards.includes(idx) ? 1 : 0,
                y: visibleCards.includes(idx) ? 0 : 20,
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative group"
            >
              <div className="bg-background border border-border rounded-lg p-6 h-full transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                {/* Step number */}
                <div className="absolute -top-4 left-6 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>

                {/* Image */}
                <div className="mb-6 mt-4 rounded-md overflow-hidden bg-muted aspect-video">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover opacity-80"
                    loading="lazy"
                  />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

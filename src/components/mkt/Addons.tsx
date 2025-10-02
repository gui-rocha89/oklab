import { addons } from '@/mkt/content';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function Addons() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
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
    <section ref={sectionRef} className="py-24 bg-card border-y border-border">
      <div className="container px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: isVisible ? 1 : 0,
            y: isVisible ? 0 : 20,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Add-ons Flexíveis
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Expanda seu plano sob demanda com recursos adicionais personalizados
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {Object.entries(addons).map(([planId, items], planIdx) => (
            <motion.div
              key={planId}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: isVisible ? 1 : 0,
                y: isVisible ? 0 : 20,
              }}
              transition={{
                duration: 0.3,
                delay: planIdx * 0.08,
                ease: 'easeOut',
              }}
            >
              <div className="bg-background border border-border rounded-lg p-6 h-full">
                <h3 className="text-lg font-semibold text-foreground mb-4 capitalize">
                  {planId === 'creative-pro'
                    ? 'Creative Pro'
                    : planId === 'agency-complete'
                    ? 'Agency Complete'
                    : planId.charAt(0).toUpperCase() + planId.slice(1)}
                </h3>
                <ul className="space-y-3">
                  {items.map((addon, idx) => (
                    <li
                      key={idx}
                      className="flex items-start justify-between gap-2 text-sm"
                    >
                      <span className="flex items-start gap-2 text-foreground">
                        <Plus className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{addon.name}</span>
                      </span>
                      {addon.price !== null && (
                        <span className="text-muted-foreground font-medium whitespace-nowrap">
                          R$ {addon.price}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { fadeUpViewport, fadeUpViewportStagger, motionConfig } from '@/lib/motionVariants';

interface FeatureBandProps {
  id: string;
  title: string;
  description: string;
  image: string;
  bullets: string[];
  reverse?: boolean;
}

export function FeatureBand({
  title,
  description,
  image,
  bullets,
  reverse = false,
}: FeatureBandProps) {
  return (
    <div className="max-w-[1100px] mx-auto py-24 lg:py-32">
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
          reverse ? '' : ''
        }`}
      >
        {/* Content */}
        <motion.div
          {...fadeUpViewport}
          className={reverse ? 'lg:order-2' : ''}
        >
          <h3 className="mkt-h2 text-foreground mb-4">
            {title}
          </h3>
          <p className="mkt-body text-muted-foreground mb-8">
            {description}
          </p>
          <ul className="space-y-4">
            {bullets.map((bullet, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, y: motionConfig.translateY }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={motionConfig.viewport}
                transition={{
                  duration: motionConfig.duration,
                  ease: motionConfig.easing,
                  delay: idx * 0.08,
                }}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-foreground leading-relaxed">{bullet}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, y: motionConfig.translateY }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={motionConfig.viewport}
          transition={{
            duration: motionConfig.duration,
            ease: motionConfig.easing,
            delay: 0.1,
          }}
          className={reverse ? 'lg:order-1' : ''}
        >
          <div className="relative rounded-lg overflow-hidden shadow-mkt border border-border">
            <img
              src={image}
              alt={title}
              className="w-full h-auto"
              loading="lazy"
              width={1000}
              height={700}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

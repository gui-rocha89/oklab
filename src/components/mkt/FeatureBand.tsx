import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

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
    <div className="max-w-[1100px] mx-auto">
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
          reverse ? '' : ''
        }`}
      >
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: reverse ? 20 : -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={reverse ? 'lg:order-2' : ''}
        >
          <h3 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {title}
          </h3>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {description}
          </p>
          <ul className="space-y-4">
            {bullets.map((bullet, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.25,
                  delay: idx * 0.06,
                  ease: 'easeOut',
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
          initial={{ opacity: 0, x: reverse ? -20 : 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.28, ease: 'easeOut', delay: 0.1 }}
          className={reverse ? 'lg:order-1' : ''}
        >
          <div className="relative rounded-lg overflow-hidden border border-border/50 bg-card shadow-lg">
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

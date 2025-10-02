import { howItWorks } from '@/mkt/content';
import { motion } from 'framer-motion';

export function HowItWorks() {
  return (
    <section
      id="produto"
      className="py-24 bg-muted/30"
    >
      <div className="container px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {howItWorks.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {howItWorks.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {howItWorks.steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="space-y-4"
            >
              <div className="relative rounded-lg overflow-hidden border border-border/50 shadow-lg bg-card">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-auto"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  width={800}
                  height={600}
                />
                <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <span className="text-lg font-bold text-primary-foreground">{idx + 1}</span>
                </div>
              </div>
              <div className="space-y-2 px-2">
                <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

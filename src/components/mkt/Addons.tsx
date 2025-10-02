import { addons } from '@/mkt/content';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export function Addons() {
  return (
    <section className="py-24 lg:py-32 mkt-section-bg">
      <div className="container px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="mkt-h2 text-foreground mb-4">
            Add-ons Flexíveis
          </h2>
          <p className="mkt-body text-muted-foreground max-w-2xl mx-auto">
            Expanda seu plano sob demanda com recursos adicionais personalizados
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {Object.entries(addons).map(([planId, items], planIdx) => (
            <motion.div
              key={planId}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.3,
                delay: planIdx * 0.08,
              }}
            >
              <div className="mkt-card p-6 h-full transition-all duration-300 hover:shadow-mkt-lg hover:-translate-y-1">
                <h3 className="mkt-h3 text-foreground mb-4 capitalize">
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
                      className="flex items-start justify-between gap-2"
                    >
                      <span className="flex items-start gap-2 text-foreground mkt-small">
                        <Plus className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{addon.name}</span>
                      </span>
                      {addon.price !== null && (
                        <span className="text-muted-foreground font-medium whitespace-nowrap mkt-small">
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

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mt-12 text-center mkt-small text-muted-foreground"
        >
          <p>Add-ons são cobrados mensalmente junto com sua assinatura. Você pode adicionar ou remover a qualquer momento.</p>
        </motion.div>
      </div>
    </section>
  );
}

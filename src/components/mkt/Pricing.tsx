import { Button } from '@/components/ui/button';
import { plans } from '@/mkt/content';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export function Pricing() {
  return (
    <section
      id="precos"
      className="py-24 lg:py-32 mkt-section-bg"
    >
      <div className="container px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="mkt-h2 text-foreground mb-4">
            Planos para todas as necessidades
          </h2>
          <p className="mkt-body text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio. Sem taxas de setup, sem surpresas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className={`relative rounded-lg ${
                plan.featured
                  ? 'mkt-card ring-2 ring-primary shadow-mkt-lg scale-[1.02] lg:scale-105'
                  : 'mkt-card'
              } p-6 lg:p-8 flex flex-col transition-all duration-300 hover:shadow-mkt-lg hover:-translate-y-1`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                  Mais usado
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <h3 className="mkt-h3 text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="mkt-small text-muted-foreground mb-6 min-h-[40px]">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  {plan.price !== null ? (
                    <>
                      <span className="text-sm text-muted-foreground">R$</span>
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground mkt-small">{plan.period}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-foreground">
                      Sob consulta
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="mkt-small text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.featured ? 'default' : 'outline'}
                className="w-full"
                asChild
                aria-label={`${plan.cta} - Plano ${plan.name}`}
              >
                <a href={plan.ctaHref}>{plan.cta}</a>
              </Button>
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
          <p>Todos os planos incluem 14 dias de teste gratuito. Sem cartão de crédito necessário.</p>
        </motion.div>
      </div>
    </section>
  );
}

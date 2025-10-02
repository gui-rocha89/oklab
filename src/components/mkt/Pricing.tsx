import { Button } from '@/components/ui/button';
import { plans } from '@/mkt/content';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function Pricing() {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            plans.forEach((_, idx) => {
              setTimeout(() => {
                setVisibleCards((prev) => [...new Set([...prev, idx])]);
              }, idx * 80);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="precos"
      ref={sectionRef}
      className="py-24 bg-background"
    >
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Planos para todas as necessidades
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio. Sem taxas de setup, sem surpresas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: visibleCards.includes(idx) ? 1 : 0,
                y: visibleCards.includes(idx) ? 0 : 20,
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`relative rounded-lg border ${
                plan.featured
                  ? 'border-primary shadow-xl bg-card scale-105 lg:scale-110'
                  : 'border-border bg-card'
              } p-6 lg:p-8 flex flex-col`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Mais Popular
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  {plan.price !== null ? (
                    <>
                      <span className="text-sm text-muted-foreground">R$</span>
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground">{plan.period}</span>
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
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.featured ? 'default' : 'outline'}
                className="w-full"
                asChild
              >
                <a href={plan.ctaHref}>{plan.cta}</a>
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Todos os planos incluem 14 dias de teste gratuito. Sem cartão de crédito necessário.</p>
        </div>
      </div>
    </section>
  );
}

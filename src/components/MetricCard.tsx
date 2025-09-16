import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconGradient: [string, string];
  trend?: number;
  description?: string;
  format?: 'number' | 'percentage';
  index?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  iconGradient,
  trend,
  description,
  format = 'number',
  index = 0
}) => {
  const formatValue = (val: string | number) => {
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    
    switch (format) {
      case 'percentage':
        return `${numVal.toFixed(1)}%`;
      default:
        return numVal.toLocaleString('pt-BR');
    }
  };

  const getTrendBadgeClasses = () => {
    if (trend === undefined || trend === 0) {
      return {
        bg: 'rgba(107, 114, 128, 0.1)',
        color: '#6b7280',
        icon: null
      };
    }
    return trend > 0 
      ? {
          bg: 'rgba(16, 185, 129, 0.1)',
          color: '#10b981',
          icon: TrendingUp
        }
      : {
          bg: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          icon: TrendingDown
        };
  };

  const trendConfig = getTrendBadgeClasses();
  const TrendIcon = trendConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }}
      className="h-full"
    >
      <div 
        className="flex flex-col justify-between h-full min-h-[164px] p-5 rounded-2xl shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden hover:ring-2 hover:ring-primary/20 hover:shadow-primary/10"
        style={{ borderColor: 'transparent' }}
      >
        {/* Orange glow effect on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/30 shadow-lg shadow-primary/20"></div>
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/10 via-transparent to-primary/10 blur-sm"></div>
        </div>
        
        {/* Content wrapper with higher z-index */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <h3 
              className="text-sm font-bold uppercase tracking-wide leading-tight group-hover:text-primary/80 transition-colors duration-300"
              style={{ 
                color: '#4b5563',
                letterSpacing: '0.4px'
              }}
            >
              {title}
            </h3>
            
            {/* Icon Wrap */}
            <div 
              className="flex items-center justify-center rounded-xl shadow-md ring-1 ring-white/20 group-hover:shadow-lg group-hover:ring-primary/30 group-hover:shadow-primary/20 transition-all duration-300"
              style={{
                width: '40px',
                height: '40px',
                background: `linear-gradient(135deg, ${iconGradient[0]} 0%, ${iconGradient[1]} 100%)`
              }}
            >
              <Icon 
                className="text-white group-hover:scale-110 transition-transform duration-300" 
                style={{ width: '20px', height: '20px' }}
              />
            </div>
          </div>

          {/* Value */}
          <div className="flex-1">
            <div 
              className="text-4xl font-bold leading-none mt-2 group-hover:text-primary/90 transition-colors duration-300"
              style={{ 
                color: '#111827',
                fontSize: '36px',
                lineHeight: '1.1'
              }}
            >
              {formatValue(value)}
            </div>
            
            {description && (
              <p 
                className="text-sm mt-1 group-hover:text-primary/70 transition-colors duration-300"
                style={{ color: '#6b7280' }}
              >
                {description}
              </p>
            )}
          </div>

          {/* Footer */}
          {trend !== undefined && (
            <div className="mt-3.5">
              <div 
                className="inline-flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium group-hover:ring-1 group-hover:ring-primary/20 transition-all duration-300"
                style={{
                  backgroundColor: trendConfig.bg,
                  color: trendConfig.color,
                  borderRadius: '999px'
                }}
              >
                {TrendIcon && <TrendIcon style={{ width: '14px', height: '14px' }} />}
                <span>
                  {trend > 0 && '+'}{Math.abs(trend).toFixed(1)}%
                </span>
                <span 
                  className="text-xs ml-2"
                  style={{ color: '#6b7280' }}
                >
                  vs. mês anterior
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
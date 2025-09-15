import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: number;
  description?: string;
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'currency' | 'percentage' | 'time';
  index?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  description,
  prefix = '',
  suffix = '',
  format = 'number',
  index = 0
}) => {
  const formatValue = (val: string | number) => {
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(numVal);
      case 'percentage':
        return `${numVal.toFixed(1)}%`;
      case 'time':
        return `${numVal}h`;
      default:
        return numVal.toLocaleString('pt-BR');
    }
  };

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="w-4 h-4 text-muted-foreground" />;
    return trend > 0 
      ? <TrendingUp className="w-4 h-4 text-emerald-600" />
      : <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTrendStyles = () => {
    if (trend === undefined || trend === 0) {
      return {
        text: 'text-muted-foreground',
        bg: 'bg-gray-50',
        border: 'border-gray-200'
      };
    }
    return trend > 0 
      ? {
          text: 'text-emerald-700',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200'
        }
      : {
          text: 'text-red-700',
          bg: 'bg-red-50',
          border: 'border-red-200'
        };
  };

  const trendStyles = getTrendStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="group"
    >
      <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
        {/* Subtle top accent */}
        <div className={cn("absolute top-0 left-0 right-0 h-1", color)} />
        
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50/30 opacity-60" />
        
        <CardContent className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                {title}
              </p>
              
              <div className="flex items-baseline space-x-1 mb-1">
                {prefix && (
                  <span className="text-lg text-muted-foreground font-medium">{prefix}</span>
                )}
                <span className="text-3xl font-bold text-foreground tracking-tight">
                  {formatValue(value)}
                </span>
                {suffix && (
                  <span className="text-lg text-muted-foreground font-medium">{suffix}</span>
                )}
              </div>
              
              {description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            
            {/* Icon with enhanced styling */}
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-110",
              color
            )}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
          
          {/* Enhanced trend indicator */}
          {trend !== undefined && (
            <div className={cn(
              "inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
              trendStyles.bg,
              trendStyles.border,
              "border"
            )}>
              {getTrendIcon()}
              <span className={cn("font-semibold", trendStyles.text)}>
                {trend > 0 && '+'}{Math.abs(trend).toFixed(1)}%
              </span>
              <span className="text-muted-foreground font-normal">
                vs. mês anterior
              </span>
            </div>
          )}
          
          {/* Subtle bottom decoration */}
          <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50" />
        </CardContent>
      </Card>
    </motion.div>
  );
};
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
    if (trend === undefined || trend === 0) return <Minus className="w-4 h-4" />;
    return trend > 0 
      ? <TrendingUp className="w-4 h-4 text-green-500" />
      : <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-gray-500';
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Background gradient */}
        <div className={`absolute inset-0 ${color} opacity-5`} />
        
        {/* Decorative line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${color}`} />
        
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            {/* Main content */}
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {title}
              </p>
              
              <div className="flex items-baseline space-x-1">
                <span className="text-sm text-muted-foreground">{prefix}</span>
                <span className="text-3xl font-bold text-foreground">
                  {formatValue(value)}
                </span>
                <span className="text-sm text-muted-foreground">{suffix}</span>
              </div>
              
              {description && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {description}
                </p>
              )}
              
              {/* Trend indicator */}
              {trend !== undefined && (
                <div className="flex items-center mt-3 space-x-1">
                  {getTrendIcon()}
                  <span className={`text-sm font-medium ${getTrendColor()}`}>
                    {Math.abs(trend).toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs. mês anterior
                  </span>
                </div>
              )}
            </div>
            
            {/* Icon */}
            <div className={`p-3 rounded-full ${color} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
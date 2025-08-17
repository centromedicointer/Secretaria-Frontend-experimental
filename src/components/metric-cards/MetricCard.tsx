
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  valueColor?: string;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon,
  valueColor = '',
  onClick,
  className = '',
  compact = false,
}) => {
  const headerClasses = compact
    ? 'flex flex-row items-center justify-between space-y-0 px-3 pt-2 pb-1'
    : 'flex flex-row items-center justify-between space-y-0 pb-2';
  const contentClasses = compact ? 'px-3 pb-3' : '';
  const titleClasses = compact ? 'text-sm font-medium text-center flex-1' : 'text-base font-medium text-center flex-1';
  const valueClasses = compact ? `text-lg font-bold text-center ${valueColor}` : `text-2xl font-bold text-center ${valueColor}`;
  const descClasses = compact ? 'text-xs text-muted-foreground text-center' : 'text-sm text-muted-foreground text-center';

  return (
    <Card 
      className={`${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      <CardHeader className={headerClasses}>
        <CardTitle className={titleClasses}>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className={contentClasses}>
        <div className={valueClasses}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <p className={descClasses}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

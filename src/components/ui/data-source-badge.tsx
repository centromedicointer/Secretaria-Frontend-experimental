import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Database, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataSourceBadgeProps {
  source: 'postgresql' | 'supabase';
  className?: string;
  size?: 'sm' | 'default';
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  source,
  className,
  size = 'sm'
}) => {
  const isPostgres = source === 'postgresql';
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1 font-mono text-xs",
        isPostgres 
          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" 
          : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
        size === 'sm' && "px-2 py-0.5 text-[10px]",
        className
      )}
    >
      {isPostgres ? (
        <Database className="h-3 w-3" />
      ) : (
        <Cloud className="h-3 w-3" />
      )}
      {isPostgres ? 'PostgreSQL' : 'Supabase'}
    </Badge>
  );
};
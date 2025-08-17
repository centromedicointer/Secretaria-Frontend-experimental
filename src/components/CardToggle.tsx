import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff } from 'lucide-react';

interface CardToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export const CardToggle: React.FC<CardToggleProps> = ({ 
  isActive, 
  onToggle
}) => {
  return (
    <div className="absolute top-1 right-1 z-20 flex items-center bg-white/95 backdrop-blur-sm rounded-full p-1 border border-gray-200 shadow-sm">
      {isActive ? (
        <Eye className="h-2.5 w-2.5 text-green-600" />
      ) : (
        <EyeOff className="h-2.5 w-2.5 text-gray-400" />
      )}
      <Switch
        checked={isActive}
        onCheckedChange={onToggle}
        className="scale-50 data-[state=checked]:bg-green-600 ml-0.5"
      />
    </div>
  );
};
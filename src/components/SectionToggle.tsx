import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff } from 'lucide-react';

interface SectionToggleProps {
  isActive: boolean;
  onToggle: () => void;
  title: string;
  children?: React.ReactNode;
}

export const SectionToggle: React.FC<SectionToggleProps> = ({ 
  isActive, 
  onToggle, 
  title,
  children 
}) => {
  return (
    <div className="relative">
      {/* Toggle pequeño en esquina superior derecha */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 border border-gray-200 shadow-sm">
        {isActive ? (
          <Eye className="h-3 w-3 text-green-600" />
        ) : (
          <EyeOff className="h-3 w-3 text-gray-400" />
        )}
        <Switch
          checked={isActive}
          onCheckedChange={onToggle}
          className="scale-75 data-[state=checked]:bg-green-600"
        />
      </div>

      {/* Título de la sección */}
      <div className={`mb-4 ${isActive ? '' : 'opacity-50'}`}>
        <h3 className="text-lg font-semibold text-gray-900 pr-16">
          {title}
        </h3>
      </div>

      {/* Contenido de la sección */}
      <div className={`transition-opacity duration-200 ${
        isActive ? 'opacity-100' : 'opacity-30 pointer-events-none'
      }`}>
        {children}
      </div>
    </div>
  );
};
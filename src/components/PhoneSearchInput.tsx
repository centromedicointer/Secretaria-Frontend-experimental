
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface PhoneSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const PhoneSearchInput: React.FC<PhoneSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Buscar por número de teléfono..."
}) => {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};

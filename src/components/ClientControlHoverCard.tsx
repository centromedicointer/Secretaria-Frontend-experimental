
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldOff } from 'lucide-react';

interface ClientControlHoverCardProps {
  botActive: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

export const ClientControlHoverCard: React.FC<ClientControlHoverCardProps> = ({
  botActive,
  onClick,
  title,
  icon,
  bgColor,
  textColor
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const { data: clientData } = useQuery({
    queryKey: [`client-control-hover-${botActive}`],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_control')
        .select('phone_number')
        .eq('bot_active', botActive)
        .order('phone_number', { ascending: true });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  const phoneNumbers = clientData?.map(client => client.phone_number) || [];
  const totalCount = phoneNumbers.length;

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Only hide if the mouse is leaving the entire container area
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setIsHovered(false);
    }
  };
  
  const overlayPositionClasses = botActive
    ? "absolute top-full left-1/2 -translate-x-1/2 mt-1 w-64 max-h-48"
    : "absolute top-0 left-0 w-full h-full";

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card 
        className={`h-16 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 transform ${bgColor}`}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-1 pb-0">
          <CardTitle className="text-xs font-medium text-center flex-1">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent className="p-1 pt-0">
          <div className={`text-base font-bold text-center ${textColor}`}>
            {totalCount?.toLocaleString() || '0'}
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            {botActive ? 'Clientes con bot activado' : 'Clientes con bot desactivado'} (clic para ver detalles)
          </p>
        </CardContent>
      </Card>

      {/* Hover overlay with phone numbers */}
      {isHovered && phoneNumbers.length > 0 && (
        <div className={`${overlayPositionClasses} bg-white/95 backdrop-blur-sm border rounded-lg shadow-lg z-20 p-2 overflow-y-auto pointer-events-none`}>
          <div className="text-xs font-medium mb-2 text-gray-700">
            Números de Teléfono ({totalCount})
          </div>
          <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
            {phoneNumbers.map((phone, index) => (
              <div key={index} className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded">
                {phone}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState } from 'react';
import { MessageSquare, TrendingUp } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { N8nMessagesModal } from '../N8nMessagesModal';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDateTimeInMexicoTime } from '@/lib/dateUtils';

interface EvolutionMetrics {
  mensajes_enviados?: number;
  mensajes_recibidos?: number;
}

interface LatestKpi {
  tasa_entrega?: string;
}

interface N8nMessagePreview {
  id: string;
  nombre?: string;
  phone_number: string;
  pregunta: string;
  fecha_recibido?: string;
}

interface MessageStatsCardsProps {
  metrics: EvolutionMetrics;
  latestKpi?: LatestKpi;
}

export const MessageStatsCards: React.FC<MessageStatsCardsProps> = ({
  metrics,
  latestKpi
}) => {
const [isN8nMessagesModalOpen, setIsN8nMessagesModalOpen] = useState(false);

// Preview de últimos mensajes para hover
const { data: previewMessages, isLoading: previewLoading } = useQuery<N8nMessagePreview[]>({
  queryKey: ['n8n-messages-preview'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('n8n_mensajes')
      .select('id, nombre, phone_number, pregunta, fecha_recibido')
      .order('fecha_recibido', { ascending: false })
      .limit(6);
    if (error) throw error;
    return (data || []).map((msg: any) => ({ ...msg, id: msg.id.toString() }));
  },
  refetchInterval: 30000,
});

const handleMessageClick = () => {
  setIsN8nMessagesModalOpen(true);
};

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<HoverCard openDelay={150} closeDelay={100}>
  <HoverCardTrigger asChild>
    <div
      role="button"
      tabIndex={0}
      onClick={handleMessageClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleMessageClick();
        }
      }}
      className="outline-none"
    >
      <MetricCard
        title="Mensajes"
        value={`${metrics.mensajes_enviados || 0}/${metrics.mensajes_recibidos || 0}`}
        description="enviados/recibidos (clic para ver detalles)"
        icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
        className="cursor-pointer hover:shadow-md transition-shadow"
      />
    </div>
  </HoverCardTrigger>
  <HoverCardContent className="w-96">
    <div className="space-y-2">
      <div className="text-sm font-medium">Últimos mensajes</div>
      {previewLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : previewMessages && previewMessages.length > 0 ? (
        <ul className="space-y-2">
          {previewMessages.slice(0, 5).map((m) => (
            <li key={m.id} className="text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="line-clamp-2">{m.pregunta}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {m.fecha_recibido ? formatDateTimeInMexicoTime(m.fecha_recibido) : ''}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {(m.nombre || 'Usuario')} · {m.phone_number}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-muted-foreground">No hay mensajes disponibles</div>
      )}
      <div className="text-xs text-muted-foreground">Haz clic para ver más detalles</div>
    </div>
  </HoverCardContent>
</HoverCard>

        <MetricCard
          title="Tasa de Entrega"
          value={latestKpi?.tasa_entrega ? `${parseFloat(latestKpi.tasa_entrega).toFixed(1)}%` : 'N/A'}
          description="Tasa de entrega de mensajes"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <N8nMessagesModal
        isOpen={isN8nMessagesModalOpen}
        onClose={() => setIsN8nMessagesModalOpen(false)}
      />
    </>
  );
};

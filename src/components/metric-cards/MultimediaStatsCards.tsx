
import React from 'react';
import { Image, Mic, Sticker, FileText, Video, Users, UserX, Mail, MessageSquare } from 'lucide-react';
import { MetricCard } from './MetricCard';

interface EvolutionMetrics {
  stickers_recibidos?: number;
  mensajes_abiertos?: number;
  usuarios_unicos?: number;
  usuarios_optout?: number;
  imagenes_enviadas?: number;
  imagenes_recibidas?: number;
  documentos_recibidos?: number;
  videos_recibidos?: number;
  total_chats?: number;
  audios_enviados?: number;
  audios_recibidos?: number;
}

interface MultimediaStatsCardsProps {
  metrics: EvolutionMetrics;
}

export const MultimediaStatsCards: React.FC<MultimediaStatsCardsProps> = ({
  metrics
}) => {
  return (
    <>
      {/* Nuevas métricas de evolution_metricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Stickers Recibidos"
          value={metrics.stickers_recibidos || 0}
          description="Total de stickers recibidos"
          icon={<Sticker className="h-4 w-4 text-muted-foreground" />}
        />

        <MetricCard
          title="Mensajes Abiertos"
          value={metrics.mensajes_abiertos || 0}
          description="Mensajes abiertos por usuarios"
          icon={<Mail className="h-4 w-4 text-muted-foreground" />}
        />

        <MetricCard
          title="Usuarios Únicos"
          value={metrics.usuarios_unicos || 0}
          description="Usuarios únicos activos"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />

        <MetricCard
          title="Usuarios Opt-out"
          value={metrics.usuarios_optout || 0}
          description="Usuarios que se dieron de baja"
          icon={<UserX className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Métricas de multimedia ampliadas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <MetricCard
          title="Imágenes Enviadas"
          value={metrics.imagenes_enviadas || 0}
          description="Total de imágenes enviadas"
          icon={<Image className="h-4 w-4 text-muted-foreground" />}
        />

        <MetricCard
          title="Imágenes Recibidas"
          value={metrics.imagenes_recibidas || 0}
          description="Total de imágenes recibidas"
          icon={<Image className="h-4 w-4 text-muted-foreground" />}
        />

        <MetricCard
          title="Documentos Recibidos"
          value={metrics.documentos_recibidos || 0}
          description="Documentos recibidos"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />

        <MetricCard
          title="Videos Recibidos"
          value={metrics.videos_recibidos || 0}
          description="Videos recibidos"
          icon={<Video className="h-4 w-4 text-muted-foreground" />}
        />

        <MetricCard
          title="Total Chats"
          value={metrics.total_chats || 0}
          description="Conversaciones totales"
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Métricas de audios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Audios Enviados"
          value={metrics.audios_enviados || 0}
          description="Total de audios enviados"
          icon={<Mic className="h-4 w-4 text-muted-foreground" />}
        />

        <MetricCard
          title="Audios Recibidos"
          value={metrics.audios_recibidos || 0}
          description="Total de audios recibidos"
          icon={<Mic className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
    </>
  );
};

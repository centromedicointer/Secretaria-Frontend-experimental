
import React from 'react';
import { AlertTriangle, TrendingUp, Image } from 'lucide-react';
import { MetricCard } from './MetricCard';

interface LatestKpi {
  tasa_error?: string;
  tasa_respuesta?: string;
  tasa_multimedia_total?: string;
}

interface KpiStatsCardsProps {
  latestKpi?: LatestKpi;
}

export const KpiStatsCards: React.FC<KpiStatsCardsProps> = ({ latestKpi }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Tasa de Error"
        value={latestKpi?.tasa_error ? `${parseFloat(latestKpi.tasa_error).toFixed(2)}%` : '0.00%'}
        description="Tasa de errores actual"
        icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
      />

      <MetricCard
        title="Tasa de Respuesta"
        value={latestKpi?.tasa_respuesta ? `${parseFloat(latestKpi.tasa_respuesta).toFixed(1)}%` : 'N/A'}
        description="Tasa de respuesta actual"
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />

      <MetricCard
        title="Multimedia Total"
        value={latestKpi?.tasa_multimedia_total ? `${parseFloat(latestKpi.tasa_multimedia_total).toFixed(1)}%` : 'N/A'}
        description="Tasa de contenido multimedia"
        icon={<Image className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
};

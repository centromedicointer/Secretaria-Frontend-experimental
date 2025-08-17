
import React from 'react';
import { Phone, AlertTriangle } from 'lucide-react';
import { MetricCard } from './MetricCard';

interface EvolutionMetrics {
  llamadas_exitosas?: number;
  total_llamadas?: number;
  errores_total?: number;
}

interface CallStatsCardsProps {
  metrics: EvolutionMetrics;
  llamadasExitosasPorcentaje: number;
}

export const CallStatsCards: React.FC<CallStatsCardsProps> = ({
  metrics,
  llamadasExitosasPorcentaje
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Llamadas Exitosas"
        value={metrics.llamadas_exitosas || 0}
        description={`${llamadasExitosasPorcentaje.toFixed(1)}% del total`}
        icon={<Phone className="h-4 w-4 text-muted-foreground" />}
      />

      <MetricCard
        title="Total Llamadas"
        value={metrics.total_llamadas || 0}
        description="Total de llamadas realizadas"
        icon={<Phone className="h-4 w-4 text-muted-foreground" />}
      />

      <MetricCard
        title="Errores Total"
        value={metrics.errores_total || 0}
        description="Total de errores registrados"
        icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
};
